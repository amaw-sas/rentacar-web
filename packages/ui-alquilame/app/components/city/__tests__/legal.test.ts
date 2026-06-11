/**
 * F2 step07 — legales restyle (issue #112).
 *
 * Static-source contract for the two legal pages. Encodes the observable
 * holdout scenarios as source assertions (full runtime check deferred to step10):
 *   - SCEN-F2-07  : design's clean legal-document style — numbered h2s use
 *                   `font-heading`, no `bg-gradient-to-` (Tailwind 4 → `bg-linear-*`).
 *   - SCEN-F2-07b : the current intermediation framing is PRESERVED, NOT swapped
 *                   for the design's direct-operator copy. `terminos` must keep
 *                   "plataforma de intermediación" + "no somos una empresa de
 *                   alquiler" and must NOT adopt the design's direct-operator
 *                   markers ("agencia de alquiler de autos", "Identificación del
 *                   prestador").
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const terminos = read('app/pages/terminos-condiciones.vue')
const privacidad = read('app/pages/politica-privacidad.vue')

describe('F2 step07 — legal-document style (SCEN-F2-07)', () => {
  for (const [name, src] of [
    ['terminos-condiciones', terminos],
    ['politica-privacidad', privacidad],
  ] as const) {
    describe(name, () => {
      it('renders numbered h2 sections with font-heading', () => {
        // every <h2> in the page carries font-heading
        const h2s = src.match(/<h2\b[^>]*>/g) ?? []
        expect(h2s.length).toBeGreaterThan(0)
        for (const h2 of h2s) {
          expect(h2).toContain('font-heading')
        }
      })

      it('uses the design heading family on the h1', () => {
        expect(src).toMatch(/<h1\b[^>]*font-heading/)
      })

      it('does not use the deprecated bg-gradient-to- utility', () => {
        expect(src).not.toContain('bg-gradient-to-')
      })

      it('preserves the SEO meta + canonical link', () => {
        expect(src).toContain('useSeoMeta')
        expect(src).toContain('rel: \'canonical\'')
      })
    })
  }
})

describe('F2 step07 — intermediation framing preserved (SCEN-F2-07b)', () => {
  it('terminos keeps the intermediation disclaimers', () => {
    expect(terminos).toContain('plataforma de intermediación')
    expect(terminos).toContain('No somos una empresa de alquiler de vehículos')
    expect(terminos).toContain('Actuamos como intermediarios')
  })

  it('terminos was NOT replaced by the design direct-operator copy', () => {
    // design markers that frame alquilame as a direct rental agency
    expect(terminos).not.toContain('agencia de alquiler de autos')
    expect(terminos).not.toContain('Identificación del prestador')
  })

  it('privacidad keeps the third-party rentadoras framing', () => {
    expect(privacidad).toContain('empresas rentadoras de vehículos')
  })
})
