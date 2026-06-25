/**
 * F2 — Páginas legales de alquicarros (reskin al diseño nuevo).
 *
 * Encoda los escenarios estáticos del holdout f2-legales:
 *   - SCEN-F2-01/02: diseño nuevo (font-heading, max-w-3xl, eyebrow de fecha).
 *   - SCEN-F2-03: contenido legal preservado (AMAW S.A.S + NIT), contacto de
 *     marca config-driven (franchise.*), sin literal "Alquilame".
 *   - SCEN-F2-04: accents de marca naranjas (brand-600/700), sin rojos.
 *   - SCEN-F2-06: SEO por página config-driven (title + canonical).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

const PAGES = [
  ['terminos-condiciones.vue', read('app/pages/terminos-condiciones.vue')] as const,
  ['politica-privacidad.vue', read('app/pages/politica-privacidad.vue')] as const,
]

const RED_HEX = /#cc022b|#cb032c|#a00425|#93070b|#7a001a|#c71a16|#e53a1f|#ff294d|#ff7a45/i
const RED_CLASS = /\b(bg|text|border|from|to|via|ring|shadow)-red-\d/

describe('F2 legales — diseño nuevo, sin marca ajena, sin rojo', () => {
  for (const [name, src] of PAGES) {
    it(`${name}: no contiene literal "Alquilame"`, () => {
      expect(src).not.toMatch(/Alquilame/i)
    })
    it(`${name}: sin hex rojo de alquilame`, () => {
      expect(src).not.toMatch(RED_HEX)
    })
    it(`${name}: sin clases Tailwind red-*`, () => {
      expect(src).not.toMatch(RED_CLASS)
    })
    it(`${name}: usa el diseño nuevo (font-heading + max-w-3xl)`, () => {
      expect(src).toMatch(/font-heading/)
      expect(src).toMatch(/max-w-3xl/)
    })
    it(`${name}: accent de marca naranja (brand-600/700)`, () => {
      expect(src).toMatch(/text-brand-600/)
    })
    it(`${name}: contenido legal preservado (AMAW S.A.S + NIT)`, () => {
      expect(src).toContain('AMAW S.A.S')
      expect(src).toContain('900.665.917-7')
    })
    it(`${name}: SEO config-driven (title + canonical con franchise.*)`, () => {
      expect(src).toMatch(/title:\s*`[^`]*\$\{franchise\.shortname\}/)
      expect(src).toMatch(/canonical[\s\S]{0,40}franchise\.website/)
    })
  }

  it('terminos: contacto de marca config-driven (franchise.phone/email)', () => {
    const t = PAGES[0][1]
    expect(t).toMatch(/\{\{\s*franchise\.phone\s*\}\}/)
    expect(t).toMatch(/\{\{\s*franchise\.email\s*\}\}/)
  })
})
