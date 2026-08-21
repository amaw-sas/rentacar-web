/**
 * Publishes one blog article from `content/blog/<brand>/<slug>.md` into Supabase
 * `blog_posts`. This is the only repo→database path; nothing in the app reads
 * `content/blog/` at runtime (`server/api/blog/posts.get.ts` and
 * `post/[slug].get.ts` both query Supabase), so a markdown file that is never
 * pushed through this script is a draft, not a post.
 *
 * That separation is the point. Writing an article and publishing it are two
 * acts: a batch of finished `.md` files can sit in the repo indefinitely, and
 * each one goes live the day you name its slug here. Neither endpoint filters
 * on `date`, so a future date does NOT hold a post back — the row existing is
 * what makes it public.
 *
 * Run from the repo root:
 *   pnpm blog:publish --check                       # validate every .md, write nothing
 *   pnpm blog:publish --slug=<slug> --dry-run       # diff against the live row
 *   pnpm blog:publish --slug=<slug>                 # publish (upsert)
 *   pnpm blog:pull --slug=<slug> --brand=<brand>    # live row → markdown file
 *
 * `--pull` is the other direction, and it is why the repo can be trusted again:
 * an article edited straight in the database, or published before this script
 * existed, is recovered into `content/blog/` instead of being overwritten the
 * next time someone publishes. It writes a file and touches nothing remote.
 *
 * Idempotent: upsert on the `blog_posts_brand_slug_key` unique index, the same
 * conflict target `server/api/blog/wordpress-sync.post.ts` uses.
 *
 * WARNING: this overwrites the live row. Edits made directly in the database
 * are lost unless they were brought back into the markdown first — which is
 * exactly how the repo drifted from production before this script existed. Run
 * --dry-run and read the diff.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CONTENT_DIR = resolve(ROOT, 'content', 'blog')

/** Brand → the package whose `public/` serves that brand's images. */
const BRAND_PACKAGE: Record<string, string> = {
  alquilame: 'ui-alquilame',
  alquilatucarro: 'ui-alquilatucarro',
  alquicarros: 'ui-alquicarros',
}

/**
 * Frontmatter keys that map 1:1 onto NOT NULL columns. The markdown mirrors the
 * column names in snake_case — unlike the retired `seed-blog-posts.ts`, which
 * read camelCase (`readingTime`, `metaTitle`) from the older content set.
 */
const REQUIRED_FIELDS = [
  'brand', 'slug', 'title', 'description', 'image', 'alt',
  'author_name', 'author_avatar', 'date', 'category', 'reading_time',
] as const

type Article = {
  brand: string
  slug: string
  file: string
  fm: Record<string, any>
  body: string
}

function md5(value: string): string {
  return createHash('md5').update(value, 'utf8').digest('hex')
}

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function readArticles(): Article[] {
  if (!existsSync(CONTENT_DIR)) return []
  const articles: Article[] = []
  for (const brand of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!brand.isDirectory()) continue
    const dir = resolve(CONTENT_DIR, brand.name)
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const raw = readFileSync(resolve(dir, file), 'utf-8')
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!match) {
        throw new Error(`${brand.name}/${file}: no frontmatter block found`)
      }
      articles.push({
        brand: brand.name,
        slug: file.replace(/\.md$/, ''),
        file: `content/blog/${brand.name}/${file}`,
        fm: parseYaml(match[1]) ?? {},
        // Trailing newlines would flip the md5 on every round-trip and make the
        // dry-run diff lie about a no-op edit.
        body: match[2].trim(),
      })
    }
  }
  return articles
}

/**
 * Everything that must hold before a row is written. Returns human-readable
 * problems rather than throwing on the first one, so a single run reports all
 * of them instead of making the author re-run once per typo.
 */
function validate(article: Article, known: Set<string>, allowForwardLinks: boolean): string[] {
  const { fm, brand, slug, body } = article
  const problems: string[] = []

  for (const field of REQUIRED_FIELDS) {
    if (fm[field] === undefined || fm[field] === null || fm[field] === '') {
      problems.push(`falta el campo obligatorio "${field}" (la columna es NOT NULL)`)
    }
  }

  if (fm.slug && fm.slug !== slug) {
    problems.push(`el slug del frontmatter ("${fm.slug}") no coincide con el nombre del archivo ("${slug}")`)
  }
  if (fm.brand && fm.brand !== brand) {
    problems.push(`la marca del frontmatter ("${fm.brand}") no coincide con la carpeta ("${brand}")`)
  }

  const pkg = BRAND_PACKAGE[brand]
  if (!pkg) {
    problems.push(`marca desconocida "${brand}" — no sé en qué paquete viven sus imágenes`)
  } else if (typeof fm.image === 'string' && fm.image.startsWith('/')) {
    // A path that resolves in the database but 404s on the page is worse than a
    // failed publish: the post goes live with a broken hero.
    const imagePath = resolve(ROOT, 'packages', pkg, 'public', fm.image.replace(/^\//, ''))
    if (!existsSync(imagePath)) {
      problems.push(`la portada "${fm.image}" no existe en packages/${pkg}/public`)
    }
  }

  if (fm.date && toDateString(fm.date) > new Date().toISOString().slice(0, 10)) {
    problems.push(
      `la fecha ${toDateString(fm.date)} es futura, y no hay programación: ` +
        'la fila se ve apenas existe, y saldría de primera en el índice',
    )
  }

  // Internal links are the reason staggered publishing is risky: article 3 can
  // link to article 4 months before article 4 exists, and the reader gets a 404.
  for (const match of body.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
    const target = match[1]
    if (!known.has(target)) {
      const message = `enlaza a /blog/${target}, que no está publicado ni entra en esta corrida`
      problems.push(allowForwardLinks ? `AVISO: ${message}` : message)
    }
  }

  return problems
}

function buildRow(article: Article): Record<string, unknown> {
  const { fm, brand, slug, body } = article
  return {
    brand,
    slug,
    title: fm.title,
    description: fm.description,
    body,
    image: fm.image,
    alt: fm.alt,
    author_name: fm.author_name,
    author_avatar: fm.author_avatar,
    date: toDateString(fm.date),
    updated: fm.updated ? toDateString(fm.updated) : null,
    category: fm.category,
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    reading_time: fm.reading_time ?? 0,
    featured: fm.featured ?? false,
    faq_items: fm.faq_items ?? null,
    // `?? null`, not a truthiness check: an explicit empty meta_title must keep
    // persisting as '' rather than silently becoming NULL.
    meta_title: fm.meta_title ?? null,
  }
}

/** Field-by-field comparison against the live row, so --dry-run is readable. */
function diffAgainstLive(row: Record<string, unknown>, live: Record<string, any> | null): string[] {
  if (!live) return ['(no existe fila: sería una publicación nueva)']
  const lines: string[] = []
  for (const [key, value] of Object.entries(row)) {
    const before = live[key]
    const norm = (v: unknown) => (Array.isArray(v) ? v.join('|') : v === null ? '∅' : String(v))
    if (key === 'body') {
      const beforeMd5 = md5(String(before ?? ''))
      const afterMd5 = md5(String(value))
      if (beforeMd5 !== afterMd5) {
        lines.push(
          `  body     ${beforeMd5.slice(0, 8)} (${String(before ?? '').length} chars) ` +
            `→ ${afterMd5.slice(0, 8)} (${String(value).length} chars)`,
        )
      }
      continue
    }
    if (norm(before) !== norm(value)) {
      lines.push(`  ${key.padEnd(8)} ${norm(before)} → ${norm(value)}`)
    }
  }
  return lines.length ? lines : ['  (sin cambios)']
}

/**
 * `--check` and `--dry-run` only read, so they run on the anon key and never
 * need the service-role secret in scope. Only a real publish asks for it.
 */
function client(readOnly: boolean): SupabaseClient {
  const url = process.env.NUXT_SUPABASE_URL
  if (!url) {
    console.error('❌ NUXT_SUPABASE_URL no está definida (source .env.local)')
    process.exit(1)
  }

  const serviceRole = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
  const key = readOnly ? serviceRole ?? process.env.NUXT_SUPABASE_ANON_KEY : serviceRole

  if (!key) {
    console.error(
      readOnly
        ? '❌ define NUXT_SUPABASE_ANON_KEY o NUXT_SUPABASE_SERVICE_ROLE_KEY (source .env.local)'
        : '❌ publicar requiere NUXT_SUPABASE_SERVICE_ROLE_KEY (source .env.local)',
    )
    process.exit(1)
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Serializes a live row back into the `.md` shape, in the frontmatter key order
 * the existing articles use so a pulled file reads like a hand-written one.
 */
function toMarkdown(row: Record<string, any>): string {
  const quote = (v: string) => `"${String(v).replace(/"/g, '\\"')}"`
  const lines = [
    '---',
    `brand: ${row.brand}`,
    `slug: ${row.slug}`,
    `title: ${quote(row.title)}`,
  ]
  if (row.meta_title !== null && row.meta_title !== undefined) lines.push(`meta_title: ${quote(row.meta_title)}`)
  lines.push(`description: ${quote(row.description)}`)
  lines.push(`image: ${row.image}`)
  lines.push(`alt: ${quote(row.alt)}`)
  lines.push(`author_name: ${row.author_name}`)
  lines.push(`author_avatar: ${row.author_avatar}`)
  lines.push(`date: ${toDateString(row.date)}`)
  if (row.updated) lines.push(`updated: ${toDateString(row.updated)}`)
  lines.push(`category: ${row.category}`)
  lines.push('tags:')
  for (const tag of row.tags ?? []) lines.push(`  - ${tag}`)
  lines.push(`reading_time: ${row.reading_time}`)
  lines.push(`featured: ${row.featured}`)
  if (row.faq_items) lines.push(`faq_items: ${JSON.stringify(row.faq_items)}`)
  lines.push('---', '', String(row.body).trim(), '')
  return lines.join('\n')
}

async function pull(slug: string, brand: string | undefined) {
  if (!brand) {
    console.error('❌ --pull necesita --brand, porque el mismo slug puede existir en varias marcas')
    process.exit(1)
  }
  const supabase = client(true)
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('brand', brand)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error(`❌ consulta fallida: ${error.message}`)
    process.exit(1)
  }
  if (!data) {
    console.error(`❌ no hay fila publicada para ${brand}/${slug}`)
    process.exit(1)
  }

  const target = resolve(CONTENT_DIR, brand, `${slug}.md`)
  if (existsSync(target)) {
    console.error(
      `❌ ${target} ya existe. --pull no sobrescribe: si quieres comparar, usa --slug=${slug} --dry-run.`,
    )
    process.exit(1)
  }

  writeFileSync(target, toMarkdown(data), 'utf-8')
  console.log(`✅ content/blog/${brand}/${slug}.md · body ${md5(String(data.body).trim()).slice(0, 8)}`)
}

async function main() {
  const args = process.argv.slice(2)
  const flag = (name: string) => args.some((a) => a === `--${name}`)
  const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

  const checkOnly = flag('check')
  const dryRun = flag('dry-run')
  const pullMode = flag('pull')
  const allowForwardLinks = flag('allow-forward-links')
  const slug = value('slug')
  const brand = value('brand')

  if (pullMode) {
    if (!slug) {
      console.error('❌ --pull necesita --slug')
      process.exit(1)
    }
    await pull(slug, brand)
    return
  }

  const articles = readArticles()
  if (!articles.length) {
    console.error(`❌ no hay artículos en ${CONTENT_DIR}`)
    process.exit(1)
  }

  if (!checkOnly && !slug) {
    console.error(
      '❌ falta --slug. Publicar es un acto explícito por artículo: sin slug no se escribe nada.\n' +
        '   Usa --check para validar todos los .md sin tocar la base.',
    )
    process.exit(1)
  }

  const supabase = client(checkOnly || dryRun)

  // Known slugs = everything already live for the brand, plus every .md in the
  // repo for it. A link between two articles published on the same day is fine;
  // a link to something that exists nowhere is not.
  const targets = checkOnly
    ? articles
    : articles.filter((a) => a.slug === slug && (!brand || a.brand === brand))

  if (!targets.length) {
    console.error(`❌ no encontré ${slug}${brand ? ` en la marca ${brand}` : ''} bajo content/blog/`)
    process.exit(1)
  }
  if (targets.length > 1 && !checkOnly) {
    console.error(
      `❌ "${slug}" existe en varias marcas (${targets.map((t) => t.brand).join(', ')}). Especifica --brand.`,
    )
    process.exit(1)
  }

  let failed = 0
  for (const article of targets) {
    const { data: live } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('brand', article.brand)
      .eq('slug', article.slug)
      .maybeSingle()

    const { data: published } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('brand', article.brand)

    const known = new Set<string>([
      ...(published ?? []).map((p: any) => p.slug as string),
      ...articles.filter((a) => a.brand === article.brand).map((a) => a.slug),
    ])

    const problems = validate(article, known, allowForwardLinks)
    const blocking = problems.filter((p) => !p.startsWith('AVISO:'))
    const warnings = problems.filter((p) => p.startsWith('AVISO:'))

    console.log(`\n${article.file}`)
    for (const w of warnings) console.log(`  ⚠ ${w.replace('AVISO: ', '')}`)
    if (blocking.length) {
      failed++
      for (const p of blocking) console.log(`  ✗ ${p}`)
      continue
    }

    const row = buildRow(article)
    console.log(`  ✓ validado · body ${md5(article.body).slice(0, 8)} (${article.body.length} chars)`)

    if (checkOnly) continue

    console.log('  diff contra la fila viva:')
    for (const line of diffAgainstLive(row, live)) console.log(line)

    if (dryRun) {
      console.log('  → --dry-run: no se escribió nada')
      continue
    }

    const { error } = await supabase.from('blog_posts').upsert(row, { onConflict: 'brand,slug' })
    if (error) {
      console.error(`  ❌ upsert falló: ${error.message}`)
      process.exit(1)
    }

    const { data: after } = await supabase
      .from('blog_posts')
      .select('body,updated_at')
      .eq('brand', article.brand)
      .eq('slug', article.slug)
      .maybeSingle()

    const liveMd5 = md5(String(after?.body ?? ''))
    if (liveMd5 !== md5(article.body)) {
      console.error(`  ❌ el body en la base (${liveMd5.slice(0, 8)}) no coincide con el del archivo`)
      process.exit(1)
    }
    console.log(`  ✅ publicado · ${article.brand}/${article.slug} · body ${liveMd5.slice(0, 8)}`)
  }

  if (failed) {
    console.error(`\n❌ ${failed} artículo(s) con problemas. No se escribió nada para ellos.`)
    process.exit(1)
  }
  console.log(checkOnly ? '\n✅ todos los artículos válidos' : '')
}

main()
