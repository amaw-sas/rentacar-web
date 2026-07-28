/**
 * F1 step06 — Requirements + FAQ restyle (issue #112).
 *
 * Static-source assertions encoding the observable contract (full runtime/visual
 * check deferred to the F1 preview verification):
 *   - SCEN-F1-06: requirements + faq use the REAL data with the design style.
 *   - Requirements.vue carries the 4 real requirements (current home copy) and
 *     reuses ImagesPersona inside an aspect-ratio box (CLS).
 *   - Faq.vue iterates the real `faqs` from useData() (NOT the mockup copy) and
 *     does NOT inline the FAQPage JSON-LD (that stays in index.vue, single SoT).
 *   - Headings adopt the .heading-* utility (Plus Jakarta, F0-03).
 *   - Gradient guard (F0 lesson): both sections use the v4 `bg-linear-to-*`
 *     utility, NEVER the broken v3 `bg-gradient-to-*` alias.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('Requirements.vue — golden parity', () => {
  const requirements = read('app/components/home/Requirements.vue')

  it('carries the 5 golden requirement items (verbatim copy)', () => {
    expect(requirements).toMatch(/Realizar una reserva previa\./)
    expect(requirements).toMatch(/Cédula de ciudadanía o pasaporte vigente/)
    expect(requirements).toMatch(/Licencia de conducción vigente/)
    expect(requirements).toMatch(/Tarjeta de crédito a nombre del conductor/)
    expect(requirements).toMatch(/Ser mayor de 18 años/)
  })

  it('iterates exactly 5 requirement entries from a data array', () => {
    // The string[] literal — 5 quoted entries between the array brackets.
    const block = requirements.match(/const requirements: string\[\] = \[([\s\S]*?)\]/)
    expect(block).not.toBeNull()
    const entries = (block?.[1]?.match(/'[^']+'/g) ?? [])
    expect(entries).toHaveLength(5)
  })

  it('renders the golden full-bleed photographic layout (no ImagesPersona column)', () => {
    expect(requirements).toMatch(/requisitos-fondo-2\.webp/)
    expect(requirements).toMatch(/object-cover/)
    expect(requirements).not.toMatch(/LazyImagesPersona/)
  })

  it('routes the "Reserva Ahora" CTA internally to /reservas (client-side, not an external jump)', () => {
    // Contract updated: el CTA ahora navega interno a /reservas como el resto de
    // CTAs de reserva, en vez de un salto full-page al home externo del brand.
    expect(requirements).toMatch(/to="\/reservas"/)
    expect(requirements).toMatch(/Reserva Ahora/)
    // Ya no salta al sitio externo del brand ni hardcodea la URL del golden.
    expect(requirements).not.toMatch(/reservation\.website/)
    expect(requirements).not.toContain('reservatuauto.com')
  })

  it('adopts the .heading-* utility for the section title', () => {
    expect(requirements).toMatch(/font-heading/)
  })

  it('uses the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(requirements).toMatch(/bg-linear-to-[a-z]/)
    expect(requirements).not.toMatch(BROKEN_V3_GRADIENT)
  })
})

describe('F1 step06 — Faq.vue restyle', () => {
  const faq = read('app/components/home/Faq.vue')

  it('iterates the real `faqs` from useData() in the accordion', () => {
    expect(faq).toMatch(/useData\(\)/)
    expect(faq).toMatch(/const\s*\{\s*faqs\s*\}\s*=\s*useData\(\)/)
    expect(faq).toMatch(/:items="faqs"/)
  })

  it('renders the accordion item label/content from the data, not mockup copy', () => {
    expect(faq).toMatch(/item\.label/)
    expect(faq).toMatch(/item\.content/)
  })

  it('does NOT inline the FAQPage schema (stays in index.vue, single SoT)', () => {
    expect(faq).not.toMatch(/FAQPage/)
    expect(faq).not.toMatch(/useSchemaOrg/)
    expect(faq).not.toMatch(/defineQuestion/)
  })

  it('adopts the .heading-* utility for the section title', () => {
    expect(faq).toMatch(/font-heading/)
  })

  it('uses the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })
})
