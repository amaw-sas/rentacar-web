/**
 * F0 — Fundación de marca alquicarros (reskin, espejo de #112).
 *
 * Encodes the observable scenarios of F0 as static-source assertions (the
 * foundation has no runtime yet; full runtime checks deferred to QA in F1):
 *   - SCEN-F0-01: primary color flips to the institutional orange (#EF9600),
 *     no legacy blue (#000073) remains in the brand token layer.
 *   - SCEN-F0-02: institutional font (Montserrat) wired self-hosted, no Google
 *     Fonts <link>; critical CSS body font uses Montserrat, not bare system-ui.
 *   - SCEN-F0-03: token layer present and anchored to the legacy
 *     (#FF9500 = 500, #EF9600 = 600) with the full 50–950 ramp + semantic tokens.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

describe('F0 — brand tokens (theme.css)', () => {
  const theme = read('app/assets/css/theme.css')
  const main = read('app/assets/css/main.css')

  it('defines a @theme block with the brand scale', () => {
    expect(theme).toMatch(/@theme\s*{/)
  })

  it('anchors brand-500 to #ff9500 and brand-600 to #ef9600 (institutional orange)', () => {
    expect(theme).toMatch(/--color-brand-500:\s*#ff9500/i)
    expect(theme).toMatch(/--color-brand-600:\s*#ef9600/i)
  })

  it('defines the full brand ramp 50–950', () => {
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(theme).toMatch(new RegExp(`--color-brand-${shade}:\\s*#[0-9a-f]{6}`, 'i'))
    }
  })

  it('defines hero/footer/surface semantic tokens from the legacy palette', () => {
    expect(theme).toMatch(/--color-hero-from:\s*#ff9500/i)
    expect(theme).toMatch(/--color-hero-to:\s*#ff6b1c/i)
    expect(theme).toMatch(/--color-footer-from:\s*#[0-9a-f]{6}/i)
    expect(theme).toMatch(/--color-footer-to:\s*#[0-9a-f]{6}/i)
    expect(theme).toMatch(/--color-surface-soft:\s*#[0-9a-f]{6}/i)
    expect(theme).toMatch(/--color-surface-softer:\s*#[0-9a-f]{6}/i)
    expect(theme).toMatch(/--color-surface-softest:\s*#[0-9a-f]{6}/i)
  })

  it('defines the institutional font variables (Montserrat for heading and body)', () => {
    expect(theme).toMatch(/--font-heading:\s*'Montserrat'/)
    expect(theme).toMatch(/--font-sans:\s*'Montserrat'/)
  })

  it('is imported by main.css', () => {
    expect(main).toMatch(/@import\s+['"]\.\/theme\.css['"]/)
  })
})

describe('F0 — self-hosted font (Montserrat)', () => {
  const config = read('nuxt.config.ts')

  it('declares a top-level fonts block (not inside modules[]) with Montserrat', () => {
    expect(config).toMatch(/fonts:\s*{[\s\S]*families:/)
    expect(config).toMatch(/Montserrat/)
  })

  it('does NOT add a Google Fonts <link>', () => {
    expect(config).not.toContain('fonts.googleapis.com')
    expect(config).not.toContain('fonts.gstatic.com')
  })

  it('critical CSS body font-family uses Montserrat, not bare system-ui', () => {
    expect(config).not.toMatch(/body\s*{[^}]*font-family:\s*system-ui/)
    expect(config).toMatch(/body\s*{[^}]*font-family:\s*'Montserrat'/)
  })
})

describe('F0 — brand primary color', () => {
  const appConfig = read('app/app.config.ts')
  const theme = read('app/assets/css/theme.css')

  it('sets ui.colors.primary to the brand scale', () => {
    expect(appConfig).toMatch(/primary:\s*['"]brand['"]/)
    expect(appConfig).toMatch(/neutral:\s*['"]zinc['"]/)
  })

  it('pins --ui-primary to brand-600 so the button matches #EF9600', () => {
    expect(theme).toMatch(/--ui-primary:\s*var\(--color-brand-600\)/)
  })

  it('no legacy blue primary remains in the brand token layer', () => {
    expect(theme).not.toContain('#000073')
  })
})

describe('F0 — Logo supports color/white variants', () => {
  const logo = read('app/components/Logo.vue')

  it('exposes a variant prop (color over light bg, white over the orange hero)', () => {
    expect(logo).toMatch(/variant\??:\s*'color'\s*\|\s*'white'/)
  })

  it('paints the brand orange accent in the color variant', () => {
    expect(logo).toMatch(/#ef9600/i)
  })
})

describe('critical CSS — reskin hero reserves above-the-fold geometry (CLS)', () => {
  const config = read('nuxt.config.ts')

  // Root cause (alquicarros-hero-cls.scenarios.md, SCEN-ACR-CLS-01): there is NO
  // render-blocking <link rel=stylesheet>; the rest of the CSS is JS-injected on
  // hydration. The reskin (#210) hero's above-the-fold utilities were omitted
  // from the hand-curated critical-cls inline block (it predates the reskin —
  // still carries the navy #000073 gradient / aspect-[100/81]), so they applied
  // AFTER first paint: on mobile the hero gained py-10 (+80px), gap-10 and the
  // h1 collapsed to leading-[1.1], reflowing everything below down (city /bogota
  // CLS 0.366, /reservas 0.209). The critical block MUST declare them so the
  // geometry is reserved from the first paint. Mirror of alquilame #287.
  // Source text carries doubled backslashes for escaped Tailwind class names
  // (JS template string), so match the literal source substrings.
  it('declares .py-10 (2.5rem vertical padding)', () => {
    expect(config).toContain('.py-10 {')
    expect(config).toContain('.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }')
  })

  it('declares .md\\:py-12 (3rem) inside a min-width:768px query', () => {
    expect(config).toContain('.md\\\\:py-12 {')
    expect(config).toContain('.md\\\\:py-12 { padding-top: 3rem; padding-bottom: 3rem; }')
  })

  it('declares .gap-10 (2.5rem grid gap)', () => {
    expect(config).toContain('.gap-10 {')
    expect(config).toContain('.gap-10 { gap: 2.5rem; }')
  })

  it('declares .leading-[1.1] (tight hero h1 line-height)', () => {
    expect(config).toContain('.leading-\\\\[1\\\\.1\\\\] {')
    expect(config).toContain('.leading-\\\\[1\\\\.1\\\\] { line-height: 1.1; }')
  })

  // City Intro (#descripcion) illustration box reserves height via aspect-square
  // (+ max-w-[400px]) around a lazy component; absent from critical CSS the box
  // collapses to 0 pre-CSS and shoves the poster down (residual city CLS 0.153).
  it('declares .aspect-square (city Intro illustration box)', () => {
    expect(config).toContain('.aspect-square {')
    expect(config).toContain('.aspect-square { aspect-ratio: 1 / 1; }')
  })

  it('declares .max-w-[400px] (city Intro illustration cap)', () => {
    expect(config).toContain('.max-w-\\\\[400px\\\\] {')
    expect(config).toContain('.max-w-\\\\[400px\\\\] { max-width: 400px; }')
  })

  // Hero h1 uses the .heading-hero component class (typography.css:
  // @apply text-4xl md:text-5xl lg:text-7xl leading-tight), which wins over the
  // inline text-3xl/leading-[1.1] in the final render but ships ONLY in the
  // JS-injected stylesheet — so pre-CSS the h1 paints at 30px (text-3xl) and jumps
  // to 36px, shifting the Searcher column (web#289). heading-hero must be in the
  // critical block, at its FINAL size, so the h1 never resizes after first paint.
  it('declares .heading-hero at its final size (2.25rem / 1.25 mobile + breakpoints)', () => {
    expect(config).toContain('.heading-hero { font-size: 2.25rem; line-height: 1.25;')
    expect(config).toContain('.heading-hero { font-size: 3rem; }')
    expect(config).toContain('.heading-hero { font-size: 4.5rem; }')
  })

  // Root cause of the residual /reservas CLS (reservas-margin-collapse.scenarios.md,
  // SCEN-RMC-02, box-probe): the critical @layer base reset only body/img/picture/svg,
  // NOT block elements. So at first paint the hero <h1> carries its UA default margin
  // (0.67em × 36px ≈ 24px top+bottom) and the <p> carries 1em (16px); when the
  // JS-injected main CSS lands (with Tailwind Preflight → margin:0) those collapse,
  // shrinking the text column 48px and pulling the Searcher column up 48px. The
  // Preflight block-margin reset MUST be in critical so first paint == settled.
  it('declares the Preflight block-margin reset (h1/p) in critical base', () => {
    expect(config).toContain(
      'h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd, pre { margin: 0; }',
    )
  })

  // With the reset alone the hero <p> would lose its settled top margin at first
  // paint (mt-4 is NOT in critical either) → the shift flips to +16px. .mt-4 must
  // also be reserved so the <p> keeps margin-top:1rem from the first paint.
  it('declares .mt-4 so the hero <p> top margin is reserved pre-CSS', () => {
    expect(config).toContain('.mt-4 { margin-top: 1rem; }')
  })
})
