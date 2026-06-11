/**
 * F0 chrome phase — steps 07, 08a, 08b, 09 (issue #112).
 *
 * Encodes the observable chrome scenarios as static-source assertions
 * (full runtime/visual check deferred to step10):
 *   - step07: header is the brand red gradient, sticky, no #000073/blue-*.
 *   - step08a: the 3 bottom sections are fused into ONE red-gradient footer
 *             (from-footer-from to-footer-to) with font-heading.
 *   - step08b: the 19 city links stay INTERNAL via getCityReservationURL with
 *             :external + target=_blank, the #109 hydration guard (onMounted-only
 *             date calc, null-initial refs) is preserved untouched.
 *   - step09: error.vue boundary is brand red (no blue); typography .link-* use
 *             brand tokens, not text-blue-*.
 *   - SCEN-F0-06: grep of the 3 chrome surfaces yields zero blue.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const BLUE = /#000073|#0891b2|blue-[0-9]/

describe('F0 step07 — header rojo sticky (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('header background is the brand hero gradient, not the legacy blue', () => {
    expect(layout).toMatch(/from-hero-from\s+to-hero-to/)
    expect(layout).not.toContain('bg-[#000073]')
  })

  it('header is sticky to the top like the design', () => {
    expect(layout).toMatch(/sticky\s+top-0/)
  })

  it('root dropped the blue gradient', () => {
    expect(layout).not.toMatch(/from-\[#000073\]/)
    expect(layout).not.toMatch(/via-blue-800/)
  })

  // Regression guard (B1): the root must stay DARK while pages still render
  // text-white over it (hero, /pendiente, /sindisponibilidad). A light surface
  // root would make that white text invisible. The light body is an F1 concern,
  // landing when each page gets its own section background.
  it('root keeps a dark brand backdrop so white-text pages stay legible', () => {
    const rootLine = layout.split('\n').find((l) => l.includes('min-h-screen')) ?? ''
    expect(rootLine).toMatch(/from-brand-9\d0\s+to-brand-950/)
    expect(rootLine).not.toMatch(/bg-surface/)
  })

  it('keeps the white-variant Logo legible over the red header', () => {
    expect(layout).toMatch(/<Logo[^>]*variant="white"/)
  })
})

describe('F0 step08a — footer rojo unificado (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('fuses the bottom sections into a single <footer> with the red gradient', () => {
    const footers = layout.match(/<footer\b[^>]*>/g) ?? []
    expect(footers).toHaveLength(1)
    expect(footers[0]).toMatch(/from-footer-from\s+to-footer-to/)
    expect(footers[0]).toMatch(/font-heading/)
  })

  it('drops the legacy bg-black UFooter and blue legal/city section', () => {
    expect(layout).not.toContain('bg-blue-700')
    expect(layout).not.toContain('bg-blue-600')
    expect(layout).not.toContain('<UFooter')
    // The only remaining bg-black is the mobile-slideover close button, never the footer.
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).not.toContain('bg-black')
  })

  it('still renders the legal links from franchise.footerLinks inside the footer', () => {
    expect(layout).toMatch(/v-for="\(footerLink, index\) in franchise\.footerLinks"/)
  })
})

describe('F0 step08b — city links + #109 hydration guard (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('keeps the 19 city links INTERNAL via getCityReservationURL (not wa.me)', () => {
    expect(layout).toMatch(/:to="getCityReservationURL\(city\)"/)
    expect(layout).not.toContain('wa.me')
  })

  it('preserves :external + target=_blank on the city buttons', () => {
    expect(layout).toMatch(/v-for="city in cities"/)
    expect(layout).toMatch(/:external="true"/)
    expect(layout).toMatch(/target="_blank"/)
  })

  it('#109 guard: dates are computed ONLY in onMounted from null-initial refs', () => {
    expect(layout).toMatch(/const reservationInitDay = ref<string \| null>\(null\)/)
    expect(layout).toMatch(/const reservationEndDay = ref<string \| null>\(null\)/)
    // Assignment happens inside onMounted, never at SSR/module scope.
    expect(layout).toMatch(/onMounted\(\(\) => {[\s\S]*reservationInitDay\.value =/)
    expect(layout).toMatch(/onMounted\(\(\) => {[\s\S]*reservationEndDay\.value =/)
  })

  it('restyles the city buttons to a red-on-red translucent treatment, no blue', () => {
    const section = layout.slice(layout.indexOf('id="sedes"'))
    expect(section).not.toMatch(BLUE)
  })
})

describe('F0 step09 — de-blue error.vue + typography .link-*', () => {
  const error = read('app/error.vue')
  const typography = read('app/assets/css/rentacar-main/typography.css')

  it('error boundary background is brand red, not blue', () => {
    expect(error).toMatch(/from-hero-from\s+to-brand-950/)
    expect(error).not.toMatch(/from-blue-900/)
    expect(error).not.toMatch(/to-blue-950/)
  })

  it('.link-light / .link-dark use brand tokens, not text-blue-*', () => {
    expect(typography).toMatch(/\.link-light\s*{[\s\S]*text-brand-600/)
    expect(typography).toMatch(/\.link-dark\s*{[\s\S]*text-brand-200/)
    const linkBlock = typography.slice(
      typography.indexOf('.link-light'),
      typography.indexOf('Form Text'),
    )
    expect(linkBlock).not.toMatch(/blue-[0-9]/)
  })
})

// Regression guard (step10 runtime): the chrome gradients MUST use the v4
// canonical `bg-linear-to-*` utility, NOT the v3 alias `bg-gradient-to-*`.
// In this Tailwind 4.1 build, `from-*`/`to-*` built from custom @theme tokens
// emit position-aware `--tw-gradient-stops` ("to bottom in oklab, …"); the v3
// `bg-gradient-to-b` shim prepends its OWN direction → `linear-gradient(to
// bottom, to bottom in oklab, …)` → invalid → background-image:none. The header,
// footer and dark root backdrop then render transparent and white text turns
// invisible (the exact B1 failure). `bg-linear-to-*` consumes the stops as-is
// and renders. Verified live on the preview before this guard was written.
describe('chrome gradients use v4 bg-linear-* (render), not v3 bg-gradient-* (transparent)', () => {
  for (const rel of ['app/layouts/default.vue', 'app/error.vue']) {
    it(`${rel} uses bg-linear-to-* and never the broken bg-gradient-to-*`, () => {
      const src = read(rel)
      expect(src).toMatch(/bg-linear-to-[a-z]/)
      expect(src).not.toMatch(/bg-gradient-to-/)
    })
  }
})

describe('SCEN-F0-06 — chrome surfaces have zero blue', () => {
  const surfaces = [
    'app/layouts/default.vue',
    'app/error.vue',
    'app/assets/css/rentacar-main/typography.css',
  ]

  for (const rel of surfaces) {
    it(`${rel} contains no #000073 / #0891b2 / blue-N`, () => {
      expect(read(rel)).not.toMatch(BLUE)
    })
  }
})
