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
