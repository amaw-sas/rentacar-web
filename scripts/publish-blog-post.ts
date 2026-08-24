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
 *   pnpm blog:publish --solo-seo                    # only the SEO/voice review, no database
 *   pnpm blog:publish --slug=<slug> --dry-run       # diff against the live row
 *   pnpm blog:publish --slug=<slug>                 # publish (upsert)
 *   pnpm blog:pull --slug=<slug> --brand=<brand>    # live row → markdown file
 *
 * `--solo-seo` is the draft reader: it needs no credentials because it never
 * opens a connection, so an article can be reviewed before its images exist or
 * before anyone has the service-role key in scope.
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
  /** Lines consumed by the frontmatter, so a finding in the body can be
   *  reported at the line number the author sees in their editor. */
  bodyOffset: number
}

function md5(value: string): string {
  return createHash('md5').update(value, 'utf8').digest('hex')
}

function countLines(text: string): number {
  return text.split('\n').length - 1
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
      const rawBody = match[2]
      const beforeBody = raw.slice(0, raw.length - rawBody.length)
      const blankLead = rawBody.slice(0, rawBody.length - rawBody.trimStart().length)
      articles.push({
        brand: brand.name,
        slug: file.replace(/\.md$/, ''),
        file: `content/blog/${brand.name}/${file}`,
        fm: parseYaml(match[1]) ?? {},
        // Trailing newlines would flip the md5 on every round-trip and make the
        // dry-run diff lie about a no-op edit.
        body: rawBody.trim(),
        bodyOffset: countLines(beforeBody) + countLines(blankLead),
      })
    }
  }
  return articles
}

/* ── SEO and voice ────────────────────────────────────────────────────────
 *
 * Two families of defect that the structural checks above cannot see: a post
 * that is well-formed but gets truncated in the results page, and a post that
 * reads like it was written by a machine. Both are cheap to fix before
 * publishing and expensive after, because the row is what Google crawls.
 */

/** Where the results page cuts, in characters. */
const TITLE_IDEAL = 60
const TITLE_HARD = 70
const DESC_IDEAL_MIN = 120
const DESC_IDEAL_MAX = 158
const DESC_HARD_MIN = 100
const DESC_HARD_MAX = 165
const SLUG_MAX = 60
const ALT_MIN = 40
const WORDS_PER_MINUTE = 200
/** How far `reading_time` may drift from the estimate before it is worth saying. */
const READING_TIME_TOLERANCE = 0.4

/**
 * `\b` is ASCII-only: it treats `é` as a separator, so `\bverifiqué\b` never
 * matches, and it fires `\bavis\b` inside «aviso». Both bugs bite this corpus —
 * every first-person verb here is accented and «aviso» is a common word. These
 * lookarounds ask for a letter or digit in any script instead.
 */
function wordPattern(term: string, caseSensitive = false): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${term}(?![\\p{L}\\p{N}])`, caseSensitive ? 'gu' : 'giu')
}

/**
 * First person singular narrating the research. The most telling AI marker in
 * this blog, and the one with a clean fix: the impersonal says the same thing.
 * The company «nosotros» is deliberately absent from this list — «lo escribimos
 * nosotros, que alquilamos carros» is the house voice, not a defect.
 */
const FIRST_PERSON: Record<string, string> = {
  'no pude': 'no se pudo',
  pude: 'se pudo',
  verifiqué: 'se verificó',
  revisé: 'se revisó',
  conté: 'se contaron',
  encontré: 'se encontró',
  busqué: 'se buscó',
  medí: 'se midió',
  comprobé: 'se comprobó',
  intenté: 'se intentó',
  leí: 'se leyó',
  miré: 'se miró',
  hice: 'se hizo',
  logré: 'se logró',
  quise: 'se quiso',
}

const FILLERS = [
  'cabe destacar', 'en este sentido', 'es importante señalar', 'es importante mencionar',
  'juega un papel', 'sin duda alguna', 'en el mundo actual', 'en la era de',
  'en resumen', 'en conclusión',
]

/** Gerund of posteriority: the action did not happen *while*, it happened after. */
const GERUNDS = [
  'logrando así', 'posicionándose como', 'convirtiéndose en',
  'generando un impacto', 'permitiendo así',
]

const EMPTY_CLOSERS = [
  'el futuro es prometedor', 'solo el tiempo dirá', 'queda claro que', 'en definitiva',
]

/** Rental brands and pico y placa aggregators. Naming them sends the reader away. */
const COMPETITORS = [
  'pyphoy', 'picoyplacahoy', 'hertz', 'avis', 'sixt', 'rentcars', 'kayak',
]

/**
 * Brands that are also ordinary words: «el sistema localiza la placa» is the
 * verb, not the rental company. Matched only capitalized, which in Spanish
 * mid-sentence means a proper noun.
 */
const COMPETITORS_AMBIGUOUS = ['Localiza', 'Budget', 'Alamo']

type Hit = { line: number; term: string; excerpt: string }

/** A window around the match, so the author can find it without opening a diff. */
function excerptAt(line: string, start: number, end: number): string {
  const from = Math.max(0, start - 26)
  const to = Math.min(line.length, end + 26)
  return `${from > 0 ? '…' : ''}${line.slice(from, to).trim()}${to < line.length ? '…' : ''}`
}

/**
 * Longest term first, and claimed ranges are not offered twice: otherwise «no
 * pude» reports as both «no pude» and «pude», and the author fixes one finding
 * twice.
 */
function scan(lines: string[], offset: number, terms: string[], caseSensitive = false): Hit[] {
  const hits: Hit[] = []
  const ordered = [...terms].sort((a, b) => b.length - a.length)
  for (const [index, line] of lines.entries()) {
    const claimed: Array<[number, number]> = []
    for (const term of ordered) {
      for (const match of line.matchAll(wordPattern(term, caseSensitive))) {
        const start = match.index ?? 0
        const end = start + match[0].length
        if (claimed.some(([from, to]) => start < to && end > from)) continue
        claimed.push([start, end])
        hits.push({ line: offset + index + 1, term: match[0], excerpt: excerptAt(line, start, end) })
      }
    }
  }
  return hits.sort((a, b) => a.line - b.line)
}

/** Blocks separated by a blank line, each keeping the line it starts on. */
function paragraphs(body: string, offset: number): Array<{ line: number; text: string }> {
  const blocks: Array<{ line: number; text: string }> = []
  let current: string[] = []
  let start = 0
  const flush = () => {
    if (current.length) blocks.push({ line: offset + start + 1, text: current.join(' ') })
    current = []
  }
  for (const [index, line] of body.split('\n').entries()) {
    if (line.trim() === '') {
      flush()
      continue
    }
    if (!current.length) start = index
    current.push(line.trim())
  }
  flush()
  return blocks
}

function countWords(body: string): number {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>|`-]+/g, ' ')
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

/**
 * SEO and voice review. Same contract as `validate`: a flat list of Spanish
 * strings, `AVISO:` prefixed when the finding should not block publishing.
 * Runs without a database connection, which is what lets `--solo-seo` review a
 * draft with no credentials in scope.
 */
function reviewSeoAndVoice(article: Article): string[] {
  const { fm, body, bodyOffset } = article
  const problems: string[] = []
  const bodyLines = body.split('\n')

  // ── SEO
  for (const field of ['title', 'meta_title'] as const) {
    const value = fm[field]
    if (typeof value !== 'string' || !value) continue
    if (value.length > TITLE_HARD) {
      problems.push(
        `${field}: ${value.length} caracteres. Google corta cerca de ${TITLE_IDEAL}; ` +
          `recorta ${value.length - TITLE_IDEAL}.`,
      )
    } else if (value.length > TITLE_IDEAL) {
      problems.push(
        `AVISO: ${field}: ${value.length} caracteres. Se va a ver cortado en los resultados ` +
          `(el límite cómodo es ${TITLE_IDEAL}).`,
      )
    }
  }

  const description = typeof fm.description === 'string' ? fm.description : ''
  if (description) {
    if (description.length > DESC_HARD_MAX) {
      problems.push(
        `description: ${description.length} caracteres. Google corta cerca de ${DESC_IDEAL_MAX}; ` +
          `recorta ${description.length - DESC_IDEAL_MAX}.`,
      )
    } else if (description.length < DESC_HARD_MIN) {
      problems.push(
        `description: ${description.length} caracteres. Es muy corta para ocupar el espacio ` +
          `que da el resultado; súbela a ${DESC_IDEAL_MIN}-${DESC_IDEAL_MAX}.`,
      )
    } else if (description.length > DESC_IDEAL_MAX || description.length < DESC_IDEAL_MIN) {
      problems.push(
        `AVISO: description: ${description.length} caracteres. La franja que se ve entera es ` +
          `${DESC_IDEAL_MIN}-${DESC_IDEAL_MAX}.`,
      )
    }
  }

  const slug = typeof fm.slug === 'string' ? fm.slug : article.slug
  if (slug.length > SLUG_MAX) {
    problems.push(`slug: ${slug.length} caracteres. Máximo ${SLUG_MAX}: acórtalo y renombra el archivo.`)
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    problems.push(
      `slug "${slug}": solo minúsculas, números y guiones. Quita tildes, mayúsculas, ` +
        'espacios y guiones bajos, y renombra el archivo igual.',
    )
  }

  const alt = typeof fm.alt === 'string' ? fm.alt : ''
  const title = typeof fm.title === 'string' ? fm.title : ''
  if (alt && alt.length < ALT_MIN) {
    problems.push(
      `AVISO: alt: ${alt.length} caracteres. Describe la foto para quien no la ve; ` +
        `con menos de ${ALT_MIN} no alcanza a decir qué se ve.`,
    )
  }
  const normalize = (v: string) => v.toLowerCase().replace(/\s+/g, ' ').trim()
  if (alt && title && normalize(alt).includes(normalize(title))) {
    problems.push(
      'AVISO: alt: repite el título tal cual. El alt describe la imagen, no el artículo — ' +
        'di qué se ve en la foto.',
    )
  }

  // The template prints the H1 from `title`. A `# ` in the body ships a second
  // one, and the two compete for the same query.
  for (const [index, line] of bodyLines.entries()) {
    if (/^#\s/.test(line)) {
      problems.push(
        `línea ${bodyOffset + index + 1}: «${line.trim().slice(0, 60)}» — el cuerpo no lleva H1, ` +
          'la plantilla ya lo pone desde `title`. Bájalo a `##`.',
      )
    }
  }

  // Starts at 1 because the page always has the template's H1 above the body:
  // a body that opens on `###` is already a skipped level, not a fresh start.
  let previousLevel = 1
  for (const [index, line] of bodyLines.entries()) {
    const heading = line.match(/^(#{1,6})\s/)
    if (!heading) continue
    const level = heading[1].length
    if (level > previousLevel + 1) {
      problems.push(
        `AVISO: línea ${bodyOffset + index + 1}: salta de ${'#'.repeat(previousLevel)} a ` +
          `${'#'.repeat(level)} sin pasar por ${'#'.repeat(previousLevel + 1)}. ` +
          'Los lectores de pantalla y el índice leen ese salto como un hueco.',
      )
    }
    previousLevel = level
  }

  const internalLinks = [...body.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)]
  if (!internalLinks.length) {
    problems.push(
      'AVISO: no enlaza a ningún otro artículo del blog. Un enlace interno contextual reparte ' +
        'autoridad y mantiene al lector adentro.',
    )
  }

  const declared = Number(fm.reading_time ?? 0)
  const words = countWords(body)
  const estimated = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  if (declared > 0 && Math.abs(declared - estimated) / estimated > READING_TIME_TOLERANCE) {
    problems.push(
      `AVISO: reading_time: dice ${declared} min y el cuerpo tiene ${words} palabras, ` +
        `que a ${WORDS_PER_MINUTE} por minuto son ~${estimated} min. Ajusta el número.`,
    )
  }

  const images = [...body.matchAll(/!\[[^\]]*\]\([^)]+\)/g)].length
  problems.push(
    `AVISO: imágenes internas: ${images}. No son obligatorias — una imagen interna vale cuando ` +
      'es evidencia o un mapa, no cuando decora.',
  )

  // ── Voz
  for (const hit of scan(bodyLines, bodyOffset, Object.keys(FIRST_PERSON))) {
    const fix = FIRST_PERSON[hit.term.toLowerCase()]
    problems.push(
      `línea ${hit.line}: «${hit.excerpt}» — primera persona del singular.\n` +
        `     Cambia a impersonal: «${fix}». El «nosotros» de la empresa sí vale; el «yo» no.`,
    )
  }

  for (const hit of scan(bodyLines, bodyOffset, FILLERS)) {
    problems.push(
      `línea ${hit.line}: «${hit.excerpt}» — frase muleta.\n` +
        `     Bórrala: «${hit.term}» no añade información, y la frase se sostiene sin ella.`,
    )
  }

  for (const hit of scan(bodyLines, bodyOffset, GERUNDS)) {
    problems.push(
      `línea ${hit.line}: «${hit.excerpt}» — gerundio de posterioridad.\n` +
        '     Parte la frase en dos, o usa un verbo conjugado: «y así logró», «se convirtió en».',
    )
  }

  const competitorHits = [
    ...scan(bodyLines, bodyOffset, COMPETITORS),
    ...scan(bodyLines, bodyOffset, COMPETITORS_AMBIGUOUS, true),
  ].sort((a, b) => a.line - b.line)
  for (const hit of competitorHits) {
    problems.push(
      `línea ${hit.line}: «${hit.excerpt}» — nombra a «${hit.term}», que es competencia.\n` +
        '     Dilo genérico: «otra rentadora», «los agregadores de pico y placa».',
    )
  }

  const blocks = paragraphs(body, bodyOffset)
  const lastBlock = blocks[blocks.length - 1]
  if (lastBlock) {
    for (const closer of EMPTY_CLOSERS) {
      if (wordPattern(closer).test(lastBlock.text)) {
        problems.push(
          `línea ${lastBlock.line}: el último párrafo cierra con «${closer}» — cierre vacío.\n` +
            '     Termina con el dato o con lo que el lector tiene que hacer, no con una frase de relleno.',
        )
      }
    }
  }

  for (const block of blocks) {
    const adverbs = [...block.text.matchAll(/(?<![\p{L}])[\p{L}]{3,}mente(?![\p{L}])/giu)].map((m) => m[0])
    if (adverbs.length > 1) {
      problems.push(
        `AVISO: línea ${block.line}: ${adverbs.length} adverbios en -mente en el mismo párrafo ` +
          `(${adverbs.join(', ')}). Deja uno y reescribe los otros.`,
      )
    }
  }

  return problems
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

  // A draft's working notes live in HTML comments, invisible while writing and
  // still invisible on the rendered page — but the body is stored verbatim and
  // shipped to the browser, so "no verificado" and "NO inventar" travel with it.
  // The Santa Marta article carried exactly this and only escaped because whoever
  // published it stripped the block by hand.
  const comment = body.match(/<!--[\s\S]*?-->/)
  if (comment) {
    const first = comment[0].replace(/\s+/g, ' ').slice(0, 70)
    problems.push(`tiene un comentario HTML que viajaría al navegador dentro del cuerpo: «${first}…»`)
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

  problems.push(...reviewSeoAndVoice(article))

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

/**
 * `--solo-seo`: the SEO and voice review on its own. No client, no keys, no
 * network — a draft can be read before its hero image exists or before anyone
 * has the service-role key. Returns the count of articles with blocking
 * findings, so the caller can gate a branch the way `--check` does.
 */
function reviewOnly(articles: Article[]): number {
  let failed = 0
  for (const article of articles) {
    const problems = reviewSeoAndVoice(article)
    const blocking = problems.filter((p) => !p.startsWith('AVISO:'))
    const warnings = problems.filter((p) => p.startsWith('AVISO:'))

    console.log(`\n${article.file}`)
    for (const p of blocking) console.log(`  ✗ ${p}`)
    for (const w of warnings) console.log(`  ⚠ ${w.replace('AVISO: ', '')}`)
    if (blocking.length) {
      failed++
    } else {
      console.log('  ✓ sin problemas que bloqueen la publicación')
    }
  }

  if (failed) {
    console.error(`\n❌ ${failed} de ${articles.length} artículo(s) con problemas de SEO o de voz.`)
  } else {
    console.log(`\n✅ ${articles.length} artículo(s) revisados, ninguno bloquea`)
  }
  return failed
}

async function main() {
  const args = process.argv.slice(2)
  const flag = (name: string) => args.some((a) => a === `--${name}`)
  const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

  const checkOnly = flag('check')
  const soloSeo = flag('solo-seo')
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

  if (soloSeo) {
    const scoped = articles.filter((a) => (!slug || a.slug === slug) && (!brand || a.brand === brand))
    if (!scoped.length) {
      console.error(`❌ no encontré ${slug ?? 'artículos'}${brand ? ` en la marca ${brand}` : ''} bajo content/blog/`)
      process.exit(1)
    }
    process.exit(reviewOnly(scoped) ? 1 : 0)
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
