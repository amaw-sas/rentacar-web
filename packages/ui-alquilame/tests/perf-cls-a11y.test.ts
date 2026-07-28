import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateFontFace, getMetricsForFamily } from 'fontaine'
import { describe, expect, it } from 'vitest'

const read = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), 'utf8')

const config = read('nuxt.config.ts')
const theme = read('app/assets/css/theme.css')
const fleet = read('app/components/home/Fleet.vue')
const layout = read('app/layouts/default.vue')

const MIN_AA_RATIO = 4.5
const TAILWIND_GRAY_300 = '#d1d5dc'

function token(name: string): string {
  const match = theme.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!match?.[1]) throw new Error(`Missing six-digit color token ${name}`)
  return match[1]
}

function luminance(color: string): number {
  const channels = [1, 3, 5]
    .map((index) => Number.parseInt(color.slice(index, index + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (lighter! + 0.05) / (darker! + 0.05)
}

describe('T2-G1 — first-paint brand font metrics', () => {
  const brandFonts = ['DM Sans', 'Plus Jakarta Sans'] as const
  const fallbackFonts = [
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica Neue',
    'Arial',
    'Noto Sans',
  ] as const

  const normalizeCss = (css: string) => css.replaceAll('"', "'").replace(/\s+/g, ' ').trim()

  async function metricsForFamily(family: string) {
    const metrics = await getMetricsForFamily(family)
    if (!metrics) throw new Error(`Missing fontaine metrics for ${family}`)
    return metrics
  }

  it('keeps both brand fonts configured through @nuxt/fonts', () => {
    expect(config).toMatch(/name:\s*'Plus Jakarta Sans',\s*weights:\s*\[700, 800\]/)
    expect(config).toMatch(/name:\s*'DM Sans',\s*weights:\s*\[400, 500, 600\]/)
  })

  it('inlines every fontaine fallback face used by the delayed stylesheet', async () => {
    const normalizedConfig = normalizeCss(config)

    for (const family of brandFonts) {
      const metrics = await metricsForFamily(family)

      for (const fallback of fallbackFonts) {
        const expectedFace = generateFontFace(metrics, {
          name: `${family} Fallback: ${fallback}`,
          font: fallback,
          metrics: await metricsForFamily(fallback),
        })

        expect(
          normalizedConfig,
          `Missing critical fallback face for ${family} on ${fallback}`,
        ).toContain(normalizeCss(expectedFace))
      }
    }
  })

  it('uses adjusted DM Sans metrics on body from first paint', () => {
    expect(config).toMatch(
      /body\s*\{[\s\S]*?font-family:\s*'DM Sans',\s*'DM Sans Fallback: BlinkMacSystemFont',[\s\S]*?'DM Sans Fallback: Noto Sans'/,
    )
  })

  it('uses adjusted Plus Jakarta metrics for both heading APIs from first paint', () => {
    expect(config).toMatch(
      /\.heading-hero,[\s\S]*?font-family:\s*'Plus Jakarta Sans',\s*'Plus Jakarta Sans Fallback: BlinkMacSystemFont'/,
    )
    expect(config).toMatch(
      /\.font-heading\s*\{[\s\S]*?font-family:\s*'Plus Jakarta Sans',\s*'Plus Jakarta Sans Fallback: BlinkMacSystemFont'/,
    )
  })
})

describe('T2-G2 — fleet and footer text contrast', () => {
  it('validates the WCAG contrast formula against known anchors', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 2)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 2)
  })

  it('keeps every IVA note green and at AA contrast on the real fleet surface', () => {
    const ratio = contrast(token('--color-tax-note'), token('--color-surface-softest'))

    expect(fleet.match(/text-tax-note">IVA incluido/g)).toHaveLength(2)
    expect(fleet).not.toMatch(/text-emerald-600">IVA incluido/)
    expect(ratio).toBeGreaterThanOrEqual(MIN_AA_RATIO)
  })

  it('makes the complete credit block readable but subtle on black', () => {
    const bottomBar = layout.slice(layout.indexOf('<!-- Bottom Bar -->'))
    const ratio = contrast(token('--color-footer-credit'), '#000000')

    expect(bottomBar).toMatch(/class="text-center text-footer-credit md:text-right"/)
    expect(bottomBar).not.toMatch(/text-gray-500/)
    expect(bottomBar).toContain('Elaborado por')
    expect(bottomBar).toMatch(/class="text-gray-300[^\"]*"[\s\S]*?>Estrategias<\/a>/)
    expect(ratio).toBeGreaterThanOrEqual(MIN_AA_RATIO)
    expect(contrast(TAILWIND_GRAY_300, '#000000')).toBeGreaterThanOrEqual(MIN_AA_RATIO)
  })
})
