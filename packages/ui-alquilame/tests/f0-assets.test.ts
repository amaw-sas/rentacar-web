/**
 * F0 assets phase — steps 04–06 (issue #112).
 *
 * Encodes the observable scenarios as static-source + on-disk assertions
 * (full HTTP-200 runtime check SCEN-F0-05 is deferred to step10):
 *   - step04: optimize-images.mjs exists, exports svg2png/webp helpers, and
 *             actually produces a valid webp + PNG from a fixture.
 *   - step05: brand assets that app.config references exist on disk; the
 *             favicon <link> is declared; og-image replaced by the lighter one.
 *   - step06: Logo.vue is the design wordmark with a color/white variant,
 *             still inline (no <img> request), and consumed via `cls` + variant.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import sharp from 'sharp'
import { pngToWebp, svgToPng, WEIGHT_WARN_BYTES } from '../scripts/optimize-images.mjs'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

/** Recursively collect every .vue file under `dir`. */
function globVueFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...globVueFiles(full))
    else if (entry.name.endsWith('.vue')) out.push(full)
  }
  return out
}

describe('F0 step04 — optimize-images.mjs', () => {
  const script = read('scripts/optimize-images.mjs')

  it('uses the repo sharp version and documents reuse for F1/F2', () => {
    expect(script).toMatch(/import sharp from 'sharp'/)
    expect(script).toMatch(/Reusable by F1\/F2/)
    expect(script).toMatch(/sharp@\^0\.34\.5/)
  })

  it('exposes a 500 KB critical-path warning threshold', () => {
    expect(WEIGHT_WARN_BYTES).toBe(500 * 1024)
  })

  let workdir: string
  beforeAll(() => {
    workdir = mkdtempSync(join(tmpdir(), 'f0-assets-'))
  })
  afterAll(() => {
    rmSync(workdir, { recursive: true, force: true })
  })

  it('pngToWebp emits a valid .webp and reports its weight (AC1)', async () => {
    const png = join(workdir, 'fixture.png')
    await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 204, g: 2, b: 43 } } })
      .png()
      .toFile(png)

    const { dest, size } = await pngToWebp(png, join(workdir, 'fixture.webp'))
    expect(existsSync(dest)).toBe(true)
    expect(size).toBeGreaterThan(0)
    const meta = await sharp(dest).metadata()
    expect(meta.format).toBe('webp')
  })

  it('svgToPng rasterizes an SVG into a valid PNG (AC2 — feeds step05 og-logo)', async () => {
    const svg = join(workdir, 'fixture.svg')
    readFileSync // keep import tree-shake-safe
    const { writeFileSync } = await import('node:fs')
    writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 55" width="200" height="55"><rect width="200" height="55" fill="#CC022B"/></svg>')

    const { dest } = await svgToPng(svg, join(workdir, 'fixture.png'), { width: 128 })
    const meta = await sharp(dest).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(128)
  })
})

describe('F0 step05 — brand assets on disk', () => {
  it('logo + white variant live under public/images/brand/', () => {
    expect(existsSync(join(ROOT, 'public/images/brand/logo.svg'))).toBe(true)
    expect(existsSync(join(ROOT, 'public/images/brand/logo-white.svg'))).toBe(true)
  })

  it('og-logo.png raster exists (app.config oglogo ref, was a latent 404)', () => {
    const p = join(ROOT, 'public/images/brand/og-logo.png')
    expect(existsSync(p)).toBe(true)
    expect(statSync(p).size).toBeGreaterThan(0)
  })

  // SCEN-FAV-ALQUILAME: the brand favicon is the .ico. The prior favicon.svg
  // was a generic red "A" placeholder (not the brand mark) and was removed so
  // it can no longer win over the .ico in modern browsers.
  it('serves a brand favicon.ico that is NOT the leaked shared placeholder', () => {
    const ico = join(ROOT, 'public/favicon.ico')
    expect(existsSync(ico)).toBe(true)
    expect(statSync(ico).size).toBeGreaterThan(0)
    const md5 = createHash('md5').update(readFileSync(ico)).digest('hex')
    // d0dc0cd8… is the single icon that was duplicated across all three brands.
    expect(md5).not.toBe('d0dc0cd81676758c19ac93674bdd94f0')
  })

  it('removes the generic placeholder favicon.svg', () => {
    expect(existsSync(join(ROOT, 'public/favicon.svg'))).toBe(false)
  })

  it('og-image replaced by the lighter design jpg (67 KB, not the old 109 KB)', () => {
    const size = statSync(join(ROOT, 'public/img/og-alquilame.jpg')).size
    expect(size).toBeLessThan(90 * 1024)
    expect(size).toBeGreaterThan(0)
  })

  it('app.config paths the brand assets satisfy still point to the created files', () => {
    const cfg = read('app/app.config.ts')
    expect(cfg).toMatch(/logo:\s*["']\/images\/brand\/logo\.svg["']/)
    expect(cfg).toMatch(/oglogo:\s*["']\/images\/brand\/og-logo\.png["']/)
    expect(cfg).toMatch(/svglogo:\s*["']\/images\/brand\/logo\.svg["']/)
    expect(cfg).toMatch(/ogImage:\s*["']\/img\/og-alquilame\.jpg["']/)
  })

  it('declares the .ico favicon <link> and NO svg+xml favicon link', () => {
    const cfg = read('nuxt.config.ts')
    expect(cfg).toMatch(/href:\s*['"]\/favicon\.ico['"]/)
    expect(cfg).not.toMatch(/type:\s*['"]image\/svg\+xml['"],\s*href:\s*['"]\/favicon\.svg['"]/)
    expect(cfg).not.toMatch(/link:\s*\[\s*\]/)
  })
})

describe('F0 step06 — Logo.vue', () => {
  const logo = read('app/components/Logo.vue')
  const layout = read('app/layouts/default.vue')

  it('is the design wordmark viewBox, not the legacy one', () => {
    expect(logo).toContain('viewBox="0 0 200 54.71"')
    expect(logo).not.toContain('viewBox="0 0 577.03 167.13"')
  })

  it('stays inline SVG (no <img>/extra request)', () => {
    expect(logo).toMatch(/<svg/)
    expect(logo).not.toMatch(/<img/)
  })

  it('exposes a color/white variant that flips the wordmark fill', () => {
    expect(logo).toMatch(/variant\?:\s*'color'\s*\|\s*'white'/)
    expect(logo).toMatch(/variant === 'white'.*'#fff'/s)
    expect(logo).toContain('#CC022B')
  })

  it('keeps the cls prop and preserves intrinsic aspect-ratio (no CLS)', () => {
    expect(logo).toMatch(/cls\?:\s*string/)
    expect(logo).toMatch(/width="200"/)
    expect(logo).toMatch(/height="55"/)
  })

  // Golden chrome: the header is now a WHITE surface (red logo) and the footer
  // is dark navy (white logo). Both consumers carry cls + an explicit variant;
  // the header logo is color (red over white), the footer logo is white.
  it('both consumers in default.vue compile with cls + explicit variant', () => {
    const uses = layout.match(/<Logo[^>]*\/>/g) ?? []
    expect(uses).toHaveLength(2)
    for (const u of uses) {
      expect(u).toMatch(/cls=/)
      expect(u).toMatch(/variant="(color|white)"/)
    }
    expect(uses.some((u) => /variant="color"/.test(u))).toBe(true)
    expect(uses.some((u) => /variant="white"/.test(u))).toBe(true)
  })

  // Regression guard: the variant default is 'color' (red/black), illegible on the
  // app's dark/red chrome. Every <Logo> consumer in app/ must declare variant
  // explicitly so a dark-bg surface (error.vue, gana.vue) never silently regresses.
  it('every <Logo> consumer in app/ declares an explicit variant', () => {
    const files = globVueFiles(join(ROOT, 'app'))
    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf-8')
      for (const use of src.match(/<Logo\b[^>]*\/?>/g) ?? []) {
        if (!/variant=/.test(use)) offenders.push(`${file}: ${use}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
