/**
 * Generate per-brand Open Graph images (issue #108).
 *
 * alquilame and alquicarros lacked their own og:image (alquilame served a 404,
 * alquicarros served alquilatucarro's image). They have no distinct visual
 * identity in the repo beyond their wordmark SVG, so we reuse alquilatucarro's
 * brand-neutral photographic base (family + SUV + Colombia) and overlay a clean
 * white panel carrying each brand's real colored logo + tagline.
 *
 * Re-run after a logo/tagline change: pnpm og:generate
 *
 * Output is reproducible on a given machine but NOT guaranteed byte-identical
 * across machines: the panel text is rendered with system fonts via
 * librsvg/fontconfig, so a host lacking Arial/Georgia substitutes a fallback.
 * The committed JPEG is the shipped artifact; regenerate and review visually
 * after changing inputs.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Canvas + panel geometry (base asset is 1200x630).
const W = 1200
const H = 630
const PANEL_X = 800
const PANEL_W = W - PANEL_X // 400
const LOGO_W = PANEL_W - 110 // horizontal padding inside panel
const LOGO_TOP = 150
// Vertical room from LOGO_TOP down to the accent rule (y=335) is 185px; cap the
// logo below that so a future tall wordmark scales down instead of overlapping.
const LOGO_MAX_H = 170

const BASE = resolve(ROOT, 'packages/ui-alquilatucarro/public/img/og-alquilatucarro.jpg')

interface BrandSpec {
  /** brand key = public dir + output filename suffix */
  brand: 'alquilame' | 'alquicarros'
  /** accent color for filete, rule and "Colombia" */
  accent: string
}

const BRANDS: BrandSpec[] = [
  { brand: 'alquilame', accent: '#CC022B' },
  { brand: 'alquicarros', accent: '#FF8C00' },
]

function panelSvg(accent: string): Buffer {
  return Buffer.from(
    `<svg width="${PANEL_W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${PANEL_W}" height="${H}" fill="#ffffff"/>
      <rect x="0" y="0" width="8" height="${H}" fill="${accent}"/>
      <rect x="${PANEL_W / 2 - 45}" y="335" width="90" height="4" fill="${accent}"/>
      <text x="${PANEL_W / 2}" y="430" font-family="Arial, sans-serif" font-size="33" font-weight="700" fill="#1f2937" text-anchor="middle">ALQUILER</text>
      <text x="${PANEL_W / 2}" y="473" font-family="Arial, sans-serif" font-size="33" font-weight="700" fill="#1f2937" text-anchor="middle">DE CARROS EN</text>
      <text x="${PANEL_W / 2}" y="527" font-family="Georgia, serif" font-size="44" font-style="italic" fill="${accent}" text-anchor="middle">Colombia</text>
    </svg>`,
  )
}

function svgPath(brand: BrandSpec['brand']): string {
  return resolve(ROOT, `scripts/og-logo-${brand}.svg`)
}

async function generate({ brand, accent }: BrandSpec): Promise<void> {
  const logoSvg = readFileSync(svgPath(brand))
  // Cap both width and height so a future tall/wide wordmark scales down to fit
  // the panel instead of overflowing into the tagline band.
  const logo = await sharp(logoSvg, { density: 400 })
    .resize({ width: LOGO_W, height: LOGO_MAX_H, fit: 'inside' })
    .png()
    .toBuffer()
  const { width: logoWidth = LOGO_W } = await sharp(logo).metadata()
  // logoWidth <= LOGO_W <= PANEL_W, so the offset is non-negative; clamp anyway.
  const logoLeft = PANEL_X + Math.max(0, Math.round((PANEL_W - logoWidth) / 2))

  const out = resolve(ROOT, `packages/ui-${brand}/public/img/og-${brand}.jpg`)
  await sharp(BASE)
    .composite([
      { input: panelSvg(accent), left: PANEL_X, top: 0 },
      { input: logo, left: logoLeft, top: LOGO_TOP },
    ])
    .jpeg({ quality: 88 })
    .toFile(out)

  console.log(`✓ ${out}`)
}

// Fail before writing anything if an input is missing, so a partial run can't
// leave one brand's asset updated and the other stale.
const missing = [BASE, ...BRANDS.map((s) => svgPath(s.brand))].filter((p) => !existsSync(p))
if (missing.length > 0) {
  console.error(`Missing input(s):\n${missing.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}

for (const spec of BRANDS) {
  await generate(spec)
}
console.log('OG images generated.')
