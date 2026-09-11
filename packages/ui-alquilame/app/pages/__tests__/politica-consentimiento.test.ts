/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre la mitad web de SCEN-PQRS-013b — el consentimiento tiene que poder
 * reconstruirse dentro de dos años.
 *
 * Hoy la política solo se identifica por una frase en prosa ("Última actualización:
 * Enero 2025") y se reserva el derecho de reescribirse en cualquier momento sin
 * archivar lo anterior. Guardar un puntero a un documento así no prueba nada: nadie
 * podrá resolver esa cadena a un texto. De ahí estas dos reglas, y por eso el test
 * mira la PÁGINA además de la constante — si la versión no se publica, no es
 * verificable por quien radicó.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { POLICY_VERSION, CONSENT_TEXT } from '../../utils/policy'

const raiz = join(__dirname, '../../..')
const leer = (rel: string) => readFileSync(join(raiz, rel), 'utf8')

describe('versión de la política de privacidad', () => {
  it('la versión es una fecha AAAA-MM, no una frase', () => {
    // Una cadena libre ("Enero 2025") no ordena ni compara; una fecha sí.
    expect(POLICY_VERSION).toMatch(/^\d{4}-\d{2}$/)
  })

  it('la página publica la misma versión que se envía en el formulario', () => {
    // Si divergen, la fila guarda un número que no aparece en ningún sitio y el
    // titular no puede comprobar contra qué aceptó.
    const pagina = leer('app/pages/politica-privacidad.vue')
    expect(pagina).toContain('POLICY_VERSION')
  })

  it('el texto del consentimiento dice qué se acepta y a quién', () => {
    // Es la frase que se enseña ante la SIC: no la política de doce secciones, la
    // línea que la persona leyó al marcar la casilla.
    expect(CONSENT_TEXT.length).toBeGreaterThan(40)
    expect(CONSENT_TEXT.toLowerCase()).toContain('datos personales')
    expect(CONSENT_TEXT.toLowerCase()).toMatch(/pol[íi]tica/)
  })

  it('el texto del consentimiento no promete nada que la política no diga', () => {
    // Guard contra la tentación de adornar la casilla: si menciona un plazo o un
    // derecho, tiene que estar en la política publicada.
    const politica = leer('app/pages/politica-privacidad.vue').toLowerCase()
    if (CONSENT_TEXT.toLowerCase().includes('suprimir')) {
      expect(politica).toContain('suprimir')
    }
    if (CONSENT_TEXT.toLowerCase().includes('rectificar')) {
      expect(politica).toContain('rectificar')
    }
  })
})
