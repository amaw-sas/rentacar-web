/**
 * Repairs issue #362 — the 16 blog articles were authored for Alquilatucarro and
 * `seed-blog-posts.ts` upserted the same `body` for all three brands, so
 * Alquicarros and Alquilame each published six sentences naming their sister
 * brand ("En Alquilatucarro tenemos sedes…").
 *
 * The markdown source was deleted in 9c4411d once Supabase became the single
 * source of truth, so the rows cannot be re-seeded — they are rewritten in
 * place using the franchise-neutral copy in `blogEditorialFixes.ts`.
 *
 * All three brands are rewritten, Alquilatucarro included: the replacement copy
 * names no franchise, and the original sentences asserted franchise-specific
 * claims (branch coverage, fleet breadth, multi-provider comparison) that the
 * repo already guards against elsewhere. The generic Spanish phrase "alquila tu
 * carro" is left alone — it is not a brand mention.
 *
 * Dry run by default; writes only with `--apply`. Idempotent either way.
 *
 * Run from the repo root:
 *   npx tsx --env-file=.env.local scripts/fix-blog-cross-brand-mentions.ts
 *   npx tsx --env-file=.env.local scripts/fix-blog-cross-brand-mentions.ts --apply
 *
 * (Not `pnpm --filter <pkg> exec`: that sets cwd to the package directory, so a
 * relative script path resolves under packages/<pkg>/ and Node exits with
 * ERR_MODULE_NOT_FOUND before the script runs.)
 *
 * `--apply` writes a timestamped snapshot of the pre-image rows next to the
 * repo before touching anything; override the location with BLOG_SNAPSHOT_PATH.
 * Rollback is by restoring those bodies. The update loop is not atomic: a
 * mid-loop failure exits non-zero and leaves the remaining rows untouched, but
 * the script is idempotent, so re-running finishes the job.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { countAuthoringBrandMentions } from '../packages/logic/src/utils/brandContent'
import { applyEditorialFixes, REWRITTEN_SLUGS } from './blogEditorialFixes'

/** Every brand seeded from the same markdown. */
const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros'] as const

/** Plain-text columns that can carry a franchise mention. */
const TEXT_COLUMNS = ['title', 'description', 'body', 'meta_title'] as const

/** Ordinary Spanish, legitimate on every brand — must survive untouched. */
const GENERIC_PHRASE = /alquila\s+tu\s+carro/gi

const APPLY = process.argv.includes('--apply')

/** Filesystem-safe UTC timestamp for the snapshot filename. */
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')

interface BlogRow {
  brand: string
  slug: string
  title: string | null
  description: string | null
  body: string | null
  meta_title: string | null
}

const SELECT = 'brand,slug,title,description,body,meta_title'

async function fetchRows(supabase: SupabaseClient, brand: string): Promise<BlogRow[]> {
  const { data, error } = await supabase.from('blog_posts').select(SELECT).eq('brand', brand).order('slug')
  if (error) {
    console.error(`❌ query failed for ${brand}:`, error)
    process.exit(1)
  }
  return (data ?? []) as unknown as BlogRow[]
}

const countPhrases = (row: BlogRow) =>
  TEXT_COLUMNS.reduce(
    (total, column) => total + (typeof row[column] === 'string' ? (row[column]!.match(GENERIC_PHRASE)?.length ?? 0) : 0),
    0,
  )

const countMentions = (row: BlogRow) =>
  TEXT_COLUMNS.reduce(
    (total, column) => total + (typeof row[column] === 'string' ? countAuthoringBrandMentions(row[column]!) : 0),
    0,
  )

async function run(supabase: SupabaseClient) {
  console.log(APPLY ? '⚠ APPLY mode — rows will be written\n' : 'ℹ Dry run — no rows will be written (pass --apply to write)\n')

  const snapshot: BlogRow[] = []
  const pending: Array<{ brand: string; slug: string; body: string }> = []
  /** Generic-phrase count per brand before the rewrite, asserted again after. */
  const phrasesBefore = new Map<string, number>()

  for (const brand of BRANDS) {
    const rows = await fetchRows(supabase, brand)
    phrasesBefore.set(brand, rows.reduce((total, row) => total + countPhrases(row), 0))

    let applied = 0
    for (const row of rows) {
      if (!REWRITTEN_SLUGS.includes(row.slug) || typeof row.body !== 'string') continue

      const result = applyEditorialFixes(row.body, row.slug)
      for (const rewrite of result.missing) {
        console.warn(`  ⚠ ${brand}/${row.slug}: already applied or copy drifted — "${rewrite.from.slice(0, 70)}…"`)
      }
      if (result.applied.length === 0) continue

      // The rewrite must clear every mention it was meant to clear.
      if (countAuthoringBrandMentions(result.text) !== 0) {
        console.error(`❌ ${brand}/${row.slug}: rewrite left a franchise mention behind`)
        process.exit(1)
      }

      applied += result.applied.length
      snapshot.push(row)
      pending.push({ brand, slug: row.slug, body: result.text })
      console.log(`  • ${brand}/${row.slug} — ${result.applied.length} sentence(s)`)
      for (const rewrite of result.applied) {
        console.log(`      - ${rewrite.from}`)
        console.log(`      + ${rewrite.to}`)
      }
    }
    console.log(`\n${brand}: ${applied} sentence(s) rewritten, ${countPhrasesLabel(phrasesBefore.get(brand)!)}\n`)
  }

  if (pending.length === 0) {
    // Deliberately not "no mentions found" — this branch is also reached when
    // every `from` has drifted and matched nothing. verify() below is what
    // actually establishes the claim, so say only what is known here.
    console.log('ℹ no rewrites applied (already migrated, or the stored copy drifted) — verifying')
    return verify(supabase, phrasesBefore)
  }

  if (!APPLY) {
    console.log(`ℹ Dry run complete — ${pending.length} row(s) would change. Re-run with --apply to write.`)
    return
  }

  // Anchored to the script, not cwd, so the artifact never depends on where the
  // operator stood. Timestamped so a re-run after a partial failure cannot
  // clobber the pre-image captured by the first run — that file is the only
  // record of the original bodies, since the markdown source no longer exists.
  const snapshotPath = process.env.BLOG_SNAPSHOT_PATH
    ? resolve(process.env.BLOG_SNAPSHOT_PATH)
    : resolve(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        `blog-cross-brand-snapshot.${stamp()}.json`,
      )
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log(`💾 snapshot of ${snapshot.length} original row(s) → ${snapshotPath}\n`)

  for (const { brand, slug, body } of pending) {
    const { error } = await supabase.from('blog_posts').update({ body }).eq('brand', brand).eq('slug', slug)
    if (error) {
      console.error(`❌ update failed for ${brand}/${slug}:`, error)
      process.exit(1)
    }
    console.log(`  ✓ updated ${brand}/${slug}`)
  }

  await verify(supabase, phrasesBefore)
}

const countPhrasesLabel = (count: number) => `${count} generic "alquila tu carro" phrase(s) to preserve`

/**
 * Re-reads every brand and asserts the three post-conditions: no franchise
 * mention survives, the generic phrase count is unchanged, and the rewritten
 * articles are byte-identical across brands.
 */
async function verify(supabase: SupabaseClient, phrasesBefore: Map<string, number>) {
  console.log('\n— verification —')
  let failed = false

  const bodiesBySlug = new Map<string, Map<string, string>>()

  for (const brand of BRANDS) {
    const rows = await fetchRows(supabase, brand)
    const mentions = rows.reduce((total, row) => total + countMentions(row), 0)
    const phrases = rows.reduce((total, row) => total + countPhrases(row), 0)
    const expectedPhrases = phrasesBefore.get(brand)!

    console.log(`  ${brand}: ${mentions} franchise mention(s), ${phrases}/${expectedPhrases} generic phrase(s), ${rows.length} posts`)
    if (mentions !== 0) {
      console.error(`  ❌ ${brand}: ${mentions} franchise mention(s) still present`)
      failed = true
    }
    if (phrases !== expectedPhrases) {
      console.error(`  ❌ ${brand}: generic phrase count changed ${expectedPhrases} → ${phrases}`)
      failed = true
    }

    for (const row of rows) {
      if (!REWRITTEN_SLUGS.includes(row.slug) || typeof row.body !== 'string') continue
      if (!bodiesBySlug.has(row.slug)) bodiesBySlug.set(row.slug, new Map())
      bodiesBySlug.get(row.slug)!.set(brand, row.body)
    }
  }

  for (const slug of REWRITTEN_SLUGS) {
    const byBrand = bodiesBySlug.get(slug)
    // A slug present on only one brand would otherwise read as agreement:
    // one value in the set is trivially "identical". Require all brands first.
    if (!byBrand || byBrand.size !== BRANDS.length) {
      console.error(`  ❌ ${slug}: present on ${byBrand?.size ?? 0}/${BRANDS.length} brands`)
      failed = true
      continue
    }
    const distinct = new Set(byBrand.values())
    if (distinct.size !== 1) {
      console.error(`  ❌ ${slug}: body differs across brands (${distinct.size} variants)`)
      failed = true
    }
  }
  if (!failed) console.log(`  ✓ rewritten articles byte-identical across all ${BRANDS.length} brands`)

  if (failed) process.exit(1)
  console.log('✅ verification passed')
}

function main() {
  const url = process.env.NUXT_SUPABASE_URL
  const serviceRole = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    console.error('❌ NUXT_SUPABASE_URL and NUXT_SUPABASE_SERVICE_ROLE_KEY must be set (source .env.local)')
    process.exit(1)
  }
  return run(createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } }))
}

main()
