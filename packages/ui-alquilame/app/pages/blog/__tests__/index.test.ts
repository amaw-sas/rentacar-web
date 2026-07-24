/**
 * F4 step01 — blog listado reskin a marca alquilame (issue #112).
 *
 * Source-text brand guard (mismo patrón que tests/f0-chrome.test.ts:
 * readFileSync + regex, sin montar el componente). Encoda el holdout SCEN-F4:
 *   - SCEN-F4-01: hero h1 con font-heading + text-white, acento brand (no red-500).
 *   - SCEN-F4-02: cero bg-gradient-to-* (v3); badges/hover/filtro-activo en brand-*.
 *   - SCEN-F4-04: único CTA de reserva → /reservas; ningún to="/" residual.
 *   - CTA footer: panel bg-brand-900 + [--ctx-text-primary:#fff] (heading blanco).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = readFileSync(
  join(__dirname, '..', 'index.vue'),
  'utf-8',
)

describe('SCEN-F4-01 — hero brand (blog/index.vue)', () => {
  // The hero <template #title> h1 block: white over the dark layout ground,
  // brand font, brand-tone accent legible on dark.
  const heroH1 = SOURCE.slice(
    SOURCE.indexOf('<h1'),
    SOURCE.indexOf('</h1>'),
  )

  it('hero h1 keeps text-white and takes the brand heading font', () => {
    expect(heroH1).toMatch(/class="[^"]*\btext-white\b/)
    // Contrato actualizado: la fuente de marca ya no se pide suelta con
    // `font-heading` — llega dentro de `heading-page`, que además fija la escala
    // del sitio. Pedir el token suelto invitaba a inventar tamaños por página.
    expect(heroH1).toMatch(/class="[^"]*\bheading-page\b/)
  })

  it('hero accent uses a brand tone, not the legacy text-red-500', () => {
    expect(heroH1).toMatch(/text-brand-\d/)
    expect(heroH1).not.toMatch(/text-red-500/)
  })
})

describe('SCEN-F4-02 — sin gradiente v3 + cards/filtros brand', () => {
  it('source has zero v3 bg-gradient-to-* (Tailwind 4 → bg-linear-to-*)', () => {
    expect(SOURCE).not.toMatch(/bg-gradient-to-/)
  })

  it('active category filter fills with bg-brand-600, not bg-red-700', () => {
    expect(SOURCE).toMatch(/bg-brand-600 text-white/)
    expect(SOURCE).not.toMatch(/bg-red-700/)
  })

  it('badges and hovers use brand-* tokens, no raw red-* chrome left', () => {
    expect(SOURCE).toMatch(/text-brand-700 bg-brand-100/)
    expect(SOURCE).toMatch(/group-hover:text-brand-700/)
    expect(SOURCE).not.toMatch(/text-red-700/)
    expect(SOURCE).not.toMatch(/bg-red-100/)
  })
})

describe('SCEN-F4-04 — CTA de reserva centralizado en /reservas', () => {
  it('the only reserve CTA points to /reservas', () => {
    expect(SOURCE).toMatch(/to="\/reservas"/)
  })

  it('no bare to="/" reserve target remains (anti-reward-hack)', () => {
    expect(SOURCE).not.toMatch(/to="\/"/)
  })
})

describe('CTA footer panel brand', () => {
  // The dark CTA panel rebrands gray-900 → brand-900; the panel sets text-white
  // which the heading inherits (the h2 uses font-heading, not .heading-*, so no
  // --ctx-text-primary token is needed — text-white is what keeps it legible).
  const ctaPanel = SOURCE.slice(SOURCE.indexOf('<!-- CTA Section -->'))

  it('footer CTA panel uses bg-brand-900 with white text, no raw gray-900', () => {
    expect(ctaPanel).toMatch(/bg-brand-900 text-white/)
    expect(ctaPanel).not.toMatch(/bg-gray-900/)
  })

  it('footer CTA button fills brand-600 → brand-700 on hover, no red-*', () => {
    expect(ctaPanel).toMatch(/bg-brand-600 hover:bg-brand-700/)
    expect(ctaPanel).not.toMatch(/red-[0-9]/)
  })
})
