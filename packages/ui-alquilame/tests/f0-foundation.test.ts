/**
 * F0 — Fundación de marca alquilame (issue #112).
 *
 * Encodes the observable scenarios of steps 01–03 as static-source assertions
 * (the foundation has no runtime yet; full runtime checks deferred to step10):
 *   - SCEN-F0-01 (partial): primary color flips to brand red, no #000073.
 *   - SCEN-F0-03 (partial): brand fonts wired self-hosted, no Google Fonts link.
 *   - Token layer present and anchored to the design (#CC022B=600, #94001E=800).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

describe('F0 step01 — brand tokens (theme.css)', () => {
  const theme = read('app/assets/css/theme.css')
  const main = read('app/assets/css/main.css')

  it('defines a @theme block with the brand scale', () => {
    expect(theme).toMatch(/@theme\s*{/)
  })

  it('anchors brand-600 to #cc022b and brand-800 to #94001e', () => {
    expect(theme).toMatch(/--color-brand-600:\s*#cc022b/i)
    expect(theme).toMatch(/--color-brand-800:\s*#94001e/i)
  })

  it('defines the full brand ramp 50–950', () => {
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(theme).toMatch(new RegExp(`--color-brand-${shade}:\\s*#[0-9a-f]{6}`, 'i'))
    }
  })

  it('defines hero/footer/surface semantic tokens from the design', () => {
    expect(theme).toMatch(/--color-hero-from:\s*#cc022b/i)
    expect(theme).toMatch(/--color-hero-to:\s*#94001e/i)
    expect(theme).toMatch(/--color-footer-from:\s*#cb032c/i)
    expect(theme).toMatch(/--color-footer-to:\s*#a00425/i)
    expect(theme).toMatch(/--color-surface-soft:\s*#edf0f5/i)
    expect(theme).toMatch(/--color-surface-softer:\s*#f4f5f9/i)
    expect(theme).toMatch(/--color-surface-softest:\s*#f8f9fc/i)
  })

  it('defines the brand font variables', () => {
    expect(theme).toMatch(/--font-heading:\s*'Plus Jakarta Sans'/)
    expect(theme).toMatch(/--font-sans:\s*'DM Sans'/)
  })

  it('is imported by main.css', () => {
    expect(main).toMatch(/@import\s+['"]\.\/theme\.css['"]/)
  })
})

describe('F0 step02 — self-hosted fonts', () => {
  const config = read('nuxt.config.ts')
  const typography = read('app/assets/css/rentacar-main/typography.css')

  it('declares a top-level fonts block (not inside modules[])', () => {
    expect(config).toMatch(/fonts:\s*{[\s\S]*families:/)
    expect(config).toMatch(/Plus Jakarta Sans/)
    expect(config).toMatch(/DM Sans/)
  })

  it('does NOT add a Google Fonts <link> in app.head', () => {
    expect(config).not.toContain('fonts.googleapis.com')
    expect(config).not.toContain('fonts.gstatic.com')
  })

  it('critical CSS body font-family uses the brand fonts, not bare system-ui', () => {
    expect(config).not.toMatch(/body\s*{[^}]*font-family:\s*system-ui/)
    expect(config).toMatch(/body\s*{[^}]*font-family:\s*'DM Sans'/)
  })

  it('wires --font-heading into the .heading-* classes', () => {
    expect(typography).toMatch(/font-family:\s*var\(--font-heading\)/)
  })
})

describe('F0 step03 — brand primary color', () => {
  const appConfig = read('app/app.config.ts')
  const theme = read('app/assets/css/theme.css')

  it('sets ui.colors.primary to the brand scale', () => {
    expect(appConfig).toMatch(/primary:\s*['"]brand['"]/)
    expect(appConfig).toMatch(/neutral:\s*['"]zinc['"]/)
  })

  it('pins --ui-primary to brand-600 so the button matches #CC022B', () => {
    expect(theme).toMatch(/--ui-primary:\s*var\(--color-brand-600\)/)
  })

  it('no legacy blue primary remains in the chrome tokens', () => {
    expect(theme).not.toContain('#000073')
  })
})

describe('critical CSS — translate utilities do not double under Tailwind v4', () => {
  const config = read('nuxt.config.ts')

  // Root cause (SCEN-004, announcement-close-button.scenarios.md): the inline
  // critical CSS hand-rolled the v3 `transform: translate(var(--tw-translate-*))`
  // mechanism for -translate-x/y utilities. Tailwind v4's main stylesheet emits
  // the SAME utilities via the modern CSS `translate` PROPERTY. Because those are
  // two different properties they STACK once the main CSS loads → every
  // above-the-fold translate is doubled (e.g. -translate-y-1/2 → -100%), which
  // pushed the announcement close button 12px too high and shoved the HowItWorks
  // step badges ~24px left. The critical CSS must use the `translate` property too
  // so it never stacks with the main CSS.

  // Locate the critical-CSS rule that declares the --tw-translate-* defaults.
  const translateBlock = config.match(
    /\.transform[^}]*--tw-translate-y:\s*0;[^}]*}/,
  )

  it('declares the -translate utilities via the `translate` property, not `transform`', () => {
    expect(translateBlock, 'critical-CSS translate utility block should exist').not.toBeNull()
    // The modern, non-stacking property.
    expect(translateBlock![0]).toMatch(/translate:\s*var\(--tw-translate-x\)\s+var\(--tw-translate-y\)/)
    // The v3 transform-based composition must be gone (it is what doubled).
    expect(translateBlock![0]).not.toMatch(/transform:\s*translate\(/)
  })
})

describe('critical CSS — /reservas hero margin-collapse + h1 size (CLS)', () => {
  const config = read('nuxt.config.ts')

  // Root cause (reservas-margin-collapse.scenarios.md, SCEN-RMC-02, box-probe): the
  // critical @layer base reset only body/img/picture/svg, NOT block elements. So at
  // first paint the hero <h1> carries its UA default margin (0.67em × 36px ≈ 24px
  // top+bottom) and the <p> 1em (16px); when the JS-injected main CSS lands (with
  // Tailwind Preflight → margin:0) those collapse, shrinking the text column 48px and
  // pulling the Searcher column up 48px. The Preflight block-margin reset MUST be in
  // critical so first paint == settled.
  it('declares the Preflight block-margin reset (h1/p) in critical base', () => {
    expect(config).toContain(
      'h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd, pre { margin: 0; }',
    )
  })

  // The hero <p>'s settled top margin (mt-4 = 1rem) must be reserved pre-CSS too, or
  // the reset alone flips the shift to +16px.
  it('declares .mt-4 so the hero <p> top margin is reserved pre-CSS', () => {
    expect(config).toContain('.mt-4 { margin-top: 1rem; }')
  })

  // The hero h1 uses .heading-hero (typography.css: @apply text-4xl md:text-5xl
  // lg:text-7xl font-extrabold leading-tight tracking-tight), which wins over the
  // inline text-3xl/leading-[1.1] in the final render but ships ONLY in the injected
  // stylesheet — so pre-CSS the h1 paints at 30px (text-3xl) and jumps to 36px,
  // shifting the Searcher column. heading-hero must be in critical at its FINAL size.
  // Parity with alquicarros #291.
  it('declares .heading-hero at its final size (2.25rem / 1.25 mobile + breakpoints)', () => {
    expect(config).toContain('.heading-hero { font-size: 2.25rem; line-height: 1.25;')
    expect(config).toContain('.heading-hero { font-size: 3rem; }')
    expect(config).toContain('.heading-hero { font-size: 4.5rem; }')
  })
})
