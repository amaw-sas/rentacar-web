// @vitest-environment happy-dom

/**
 * Holdout: rentacar-dashboard docs/specs/2026-10-19-calificaciones-web/scenarios/
 * calificaciones-web.scenarios.md — SCEN-11918 (la versión publicada) y SCEN-11906
 * (`consent_policy_version: '2025-01'`).
 *
 * Cada calificación baja guarda en el tablero contra qué versión de la política se
 * dio el consentimiento. Esa cadena solo prueba algo si la página de la política
 * la publica: por eso el test mira la PÁGINA además de la constante. Puerto de
 * ui-alquilame/app/pages/__tests__/politica-consentimiento.test.ts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { POLICY_VERSION, OPINION_CONSENT_LEAD, OPINION_CONSENT_TEXT } from '../../utils/policy'

const raiz = join(__dirname, '../../..')

afterEach(() => {
  vi.unstubAllGlobals()
})
const leer = (rel: string) => readFileSync(join(raiz, rel), 'utf8')

describe('versión de la política de privacidad (alquilatucarro)', () => {
  it('la versión es una fecha AAAA-MM, no una frase', () => {
    expect(POLICY_VERSION).toMatch(/^\d{4}-\d{2}$/)
  })

  it('es 2025-01: el texto publicado hoy, fechado «Enero 2025»', () => {
    // No es la 2026-09 de Alquílame: alquilatucarro nunca publicó esa versión.
    expect(POLICY_VERSION).toBe('2025-01')
  })

  it('la página montada muestra «Versión 2025-01» a quien la lee', async () => {
    // Mirar el código fuente prueba que la plantilla nombra la constante; montarla
    // prueba que el texto que ve el titular es esa versión.
    vi.stubGlobal('useAppConfig', () => ({ franchise: { website: 'https://alquilatucarro.com' } }))
    vi.stubGlobal('useHead', vi.fn())
    vi.stubGlobal('useSeoMeta', vi.fn())
    const { default: PoliticaPrivacidad } = await import('../politica-privacidad.vue')
    const wrapper = mount(PoliticaPrivacidad)
    expect(wrapper.text()).toContain('Versión 2025-01')
    wrapper.unmount()
  })

  it('la página publica la constante, no una versión escrita a mano', () => {
    const pagina = leer('app/pages/politica-privacidad.vue')
    expect(pagina).toContain('{{ POLICY_VERSION }}')
    expect(pagina).toMatch(/import \{ POLICY_VERSION \} from '[^']*utils\/policy'/)
  })
})

describe('frase de consentimiento de /opinion (alquilatucarro)', () => {
  it('el texto guardado es la frase que la página arma con el enlace', () => {
    expect(OPINION_CONSENT_TEXT).toBe(`${OPINION_CONSENT_LEAD} política de privacidad.`)
  })

  it('es la frase que se lee hoy bajo el formulario, sin cambios para el cliente', () => {
    expect(OPINION_CONSENT_TEXT).toBe(
      'Al enviarlo autorizas el tratamiento de tus datos para atender tu caso, según la política de privacidad.',
    )
  })
})
