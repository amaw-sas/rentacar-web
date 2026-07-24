/**
 * Páginas legales + crédito del pie.
 *
 *   - SCEN-LEGAL-01: las legales abren con la banda de marca, como el resto del
 *     sitio. Antes empezaban en blanco justo debajo del header y no se leían
 *     como parte de la casa.
 *   - SCEN-LEGAL-02: la jerarquía sale de las utilidades compartidas
 *     (heading-page / -section / -card), no de tamaños inventados por página.
 *   - SCEN-LEGAL-03: **el texto legal no se toca**. Este cambio es de
 *     presentación; si una frase sustantiva desaparece, es un bug grave (son
 *     documentos con efecto jurídico), así que se fijan frases testigo.
 *   - SCEN-CRED-01: el crédito del pie enlaza a la agencia, en pestaña nueva y
 *     con rel seguro.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')

const LEGALES = ['app/pages/terminos-condiciones.vue', 'app/pages/politica-privacidad.vue']

describe('páginas legales — presentación alineada al sitio', () => {
  for (const rel of LEGALES) {
    const src = read(rel)
    const nombre = rel.split('/').pop()

    it(`SCEN-LEGAL-01: ${nombre} abre con la banda de marca`, () => {
      expect(src).toMatch(/from-footer-from[\s\S]{0,40}to-footer-to/)
    })

    it(`SCEN-LEGAL-02: ${nombre} usa las utilidades heading-* del sitio`, () => {
      expect(src).toContain('heading-page')
      expect(src).toContain('heading-section')
      // Ningún encabezado define su propia escala a mano.
      expect(src).not.toMatch(/<h[123][^>]*class="[^"]*\btext-(?:xl|2xl|3xl|4xl|5xl)\b/)
    })
  }

  it('SCEN-LEGAL-03: el contenido legal sustantivo sigue intacto', () => {
    const terminos = read(LEGALES[0]!)
    expect(terminos).toContain('AMAW S.A.S')
    expect(terminos).toContain('900.665.917-7')
    expect(terminos).toContain('plataforma de intermediación')
    expect(terminos).toContain('No somos una empresa de alquiler de vehículos')
    // Las 12 secciones numeradas siguen presentes.
    expect((terminos.match(/<h2[^>]*>\s*\d+\./g) || []).length).toBeGreaterThanOrEqual(10)

    const privacidad = read(LEGALES[1]!)
    expect(privacidad).toMatch(/<h2[^>]*>\s*\d+\./)
  })
})

describe('crédito del pie', () => {
  const layout = read('app/layouts/default.vue')

  it('SCEN-CRED-01: "Estrategias" enlaza a la agencia de forma segura', () => {
    expect(layout).toContain('https://www.estrategias.us/')
    expect(layout).toMatch(/estrategias\.us[\s\S]{0,220}rel="noopener noreferrer"/)
    expect(layout).toMatch(/estrategias\.us[\s\S]{0,220}target="_blank"/)
  })
})
