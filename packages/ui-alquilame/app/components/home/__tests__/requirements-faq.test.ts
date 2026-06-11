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

describe('F1 step06 — Requirements.vue restyle', () => {
  const requirements = read('app/components/home/Requirements.vue')

  it('carries the 4 real requirements (current home copy)', () => {
    expect(requirements).toMatch(/Reserva previa/i)
    expect(requirements).toMatch(/Documento de identidad/i)
    expect(requirements).toMatch(/Tarjeta de crédito/i)
    expect(requirements).toMatch(/Licencia de conducir/i)
  })

  it('iterates exactly 4 requirement entries from a data array', () => {
    const matches = requirements.match(/title:\s*"/g) ?? []
    expect(matches).toHaveLength(4)
  })

  it('reuses ImagesPersona inside an aspect-ratio box (CLS)', () => {
    expect(requirements).toMatch(/<LazyImagesPersona\b/)
    expect(requirements).toMatch(/aspect-\[/)
  })

  it('reads the brand name from useAppConfig (not hardcoded)', () => {
    expect(requirements).toMatch(/useAppConfig\(\)/)
    expect(requirements).toMatch(/franchise\.shortname/)
  })

  it('adopts the .heading-* utility for the section title', () => {
    expect(requirements).toMatch(/heading-/)
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
    expect(faq).toMatch(/heading-/)
  })

  it('uses the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })
})
