/**
 * One-time seed for issue #52 — migrate the 16 blog posts off `content/blog/*.md`
 * into Supabase `blog_posts`, for all 3 brands (16 × 3 = 48 rows).
 *
 * Why a script (not MCP execute_sql as the spec suggested): the markdown bodies
 * are large; routing 48 full articles through a raw SQL string is fragile to
 * escape and heavy. supabase-js handles typing/escaping natively and keeps the
 * bodies out of the agent context. Idempotent (upsert on brand+slug) so it is
 * safe to re-run.
 *
 * Run from the repo root:
 *   npx tsx --env-file=.env.local scripts/seed-blog-posts.ts
 *
 * (Not `pnpm --filter <pkg> exec`: that sets cwd to the package directory, so a
 * relative script path resolves under packages/<pkg>/ and Node exits with
 * ERR_MODULE_NOT_FOUND before the script runs.)
 *
 * NOTE: `CONTENT_DIR` no longer exists — the markdown was deleted in 9c4411d
 * once Supabase became the single source of truth, so this script cannot run
 * as-is. It is kept because it documents how the table was populated, and it
 * now localizes the brand token (issue #362) so restoring the content and
 * re-seeding would not reintroduce the cross-brand mentions this script
 * originally published. The already-seeded rows were repaired separately by
 * `fix-blog-cross-brand-mentions.ts`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { createClient } from '@supabase/supabase-js'
import { replaceBrandToken } from '../packages/logic/src/utils/brandContent'
import type { ContentBrand } from '../packages/logic/src/utils/trailingSlashRedirect'
import { applyEditorialFixes } from './blogEditorialFixes'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = resolve(__dirname, '..', 'packages', 'ui-alquilatucarro', 'content', 'blog')

// author_name per brand = franchises.display_name; avatar localized off Firebase.
const BRANDS: Record<string, string> = {
  alquilatucarro: 'Alquila tu Carro',
  alquilame: 'Alquilame',
  alquicarros: 'Alquicarros',
}
const AVATAR = '/img/blog/author-avatar.png'

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function parseFrontmatter(raw: string): { fm: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) throw new Error('No frontmatter block found')
  return { fm: parseYaml(match[1]) ?? {}, body: match[2].trim() }
}

function buildRows() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
  if (files.length !== 16) {
    console.warn(`⚠ expected 16 .md, found ${files.length}`)
  }
  const rows: Record<string, unknown>[] = []
  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const { fm, body } = parseFrontmatter(readFileSync(resolve(CONTENT_DIR, file), 'utf-8'))
    for (const [brand, authorName] of Object.entries(BRANDS)) {
      // The markdown is authored for Alquilatucarro and names it in prose, so a
      // verbatim upsert made the other two brands publish their sister brand's
      // name (issue #362). Two passes, in order: the editorial table replaces
      // the six known first-person claims with franchise-neutral copy, then
      // `replaceBrandToken` catches any brand mention added to the markdown
      // since. Both deliberately spare the generic phrase "alquila tu carro".
      const localize = (value: unknown) =>
        typeof value === 'string' ? replaceBrandToken(value, brand as ContentBrand) : value

      // A drifted sentence would fall through to `replaceBrandToken`, which
      // would dutifully publish "En Alquicarros tenemos sedes…" — the exact
      // first-person franchise claim the neutral rewrites exist to remove. Fail
      // loudly instead, mirroring fix-blog-cross-brand-mentions.ts.
      const editorial = applyEditorialFixes(body, slug)
      if (editorial.missing.length > 0) {
        throw new Error(
          `${slug}: ${editorial.missing.length} editorial rewrite(s) no longer match the markdown. ` +
            'The copy drifted — update EDITORIAL_REWRITES before re-seeding.',
        )
      }

      rows.push({
        brand,
        slug,
        title: localize(fm.title),
        description: localize(fm.description),
        body: localize(editorial.text),
        image: fm.image,
        alt: fm.alt,
        author_name: authorName,
        author_avatar: AVATAR,
        date: toDateString(fm.date),
        updated: fm.updated ? toDateString(fm.updated) : null,
        category: fm.category,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        reading_time: fm.readingTime ?? 0,
        featured: fm.featured ?? false,
        faq_items: fm.faqItems ?? null,
        // `?? null`, not a truthiness check: an explicit empty metaTitle must
        // keep persisting as '' rather than silently becoming NULL.
        meta_title: localize(fm.metaTitle ?? null),
      })
    }
  }
  return rows
}

async function main() {
  const url = process.env.NUXT_SUPABASE_URL
  const serviceRole = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    console.error('❌ NUXT_SUPABASE_URL and NUXT_SUPABASE_SERVICE_ROLE_KEY must be set (source .env.local)')
    process.exit(1)
  }
  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const rows = buildRows()
  console.log(`Seeding ${rows.length} rows (${rows.length / 3} posts × 3 brands)…`)

  const { error } = await supabase.from('blog_posts').upsert(rows, { onConflict: 'brand,slug' })
  if (error) {
    console.error('❌ upsert failed:', error)
    process.exit(1)
  }

  const { data, error: countErr } = await supabase
    .from('blog_posts')
    .select('brand', { count: 'exact', head: false })
  if (countErr) {
    console.error('❌ verification query failed:', countErr)
    process.exit(1)
  }
  const perBrand = (data ?? []).reduce<Record<string, number>>((acc, r: any) => {
    acc[r.brand] = (acc[r.brand] ?? 0) + 1
    return acc
  }, {})
  console.log('✅ seeded. rows per brand:', perBrand)
}

main()
