/**
 * alquicarros — wizard de /reservas por PATH + independencia de buscar-vehiculos.
 *
 * Codifica los escenarios ESTÁTICOS del holdout reservas-path-migration (los
 * runtime/E2E — SCEN-ACP-02/03/05 — se verifican con dev server + Playwright):
 *   - SCEN-ACP-01: server middleware redirige /{city}/buscar-vehiculos/<resto> → 301.
 *   - SCEN-ACP-04: Results (wrapper) es noindex,follow + canonical /reservas y monta
 *     el wizard; el sitemap excluye los paths de resultados y ya no menciona buscar-vehiculos.
 *   - SCEN-ACP-06: el árbol PATH de /reservas existe y monta <ReservasResults>; el shell
 *     del wizard NO llama useSearchByRouteParams (contrato index.test.ts); Searcher construye el PATH.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const tryRead = (rel: string): string => {
  const p = join(ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf-8') : ''
}
const exists = (rel: string): boolean => existsSync(join(ROOT, rel))

const TAIL =
  'lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]'

const RESERVAS_PATH_PAGES = [
  `app/pages/reservas/${TAIL}/index.vue`,
  `app/pages/reservas/${TAIL}/categoria/[categoria]/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/categoria/[categoria]/index.vue`,
]

describe('SCEN-ACP-06 — árbol PATH de /reservas monta <ReservasResults> (wizard)', () => {
  it('components/reservas/Results.vue existe', () => {
    expect(exists('app/components/reservas/Results.vue')).toBe(true)
  })
  const results = () => tryRead('app/components/reservas/Results.vue')
  it('Results hidrata la búsqueda por route.params (useSearchByRouteParams)', () => {
    expect(results()).toMatch(/useSearchByRouteParams\(\)/)
  })
  it('Results monta el wizard (<ReservationWizard>)', () => {
    expect(results()).toMatch(/<ReservationWizard\b/)
  })
  it('el shell del wizard NO llama useSearchByRouteParams (se mantiene el contrato)', () => {
    expect(tryRead('app/components/wizard/ReservationWizard.vue')).not.toMatch(/useSearchByRouteParams\(/)
  })
  for (const p of RESERVAS_PATH_PAGES) {
    const label = p.replace('app/pages/reservas/', '').replace(`${TAIL}`, '…')
    it(`existe la página PATH: reservas/${label}`, () => {
      expect(exists(p)).toBe(true)
    })
    it(`reservas/${label} monta <ReservasResults>`, () => {
      expect(tryRead(p)).toMatch(/<ReservasResults\s*\/>/)
    })
  }
})

describe('SCEN-ACP-04 — SEO: Results noindex + canonical /reservas', () => {
  const results = () => tryRead('app/components/reservas/Results.vue')
  it('Results emite robots noindex, follow', () => {
    expect(results()).toMatch(/robots:\s*'noindex,\s*follow'/)
  })
  it('Results canonicaliza a /reservas', () => {
    expect(results()).toMatch(/\/reservas`/)
    expect(results()).toMatch(/rel:\s*'canonical'/)
  })
  it('la /reservas limpia conserva el robots condicional por query (indexable sin query)', () => {
    expect(tryRead('app/pages/reservas/index.vue')).toMatch(/route\.query\.lugar_recogida/)
  })
})

describe('SCEN-ACP-04 — sitemap: excluye paths de resultados /reservas, sin buscar-vehiculos', () => {
  const cfg = () => tryRead('nuxt.config.ts')
  it('el sitemap ya no lista la exclusión buscar-vehiculos', () => {
    expect(cfg()).not.toMatch(/['"]\/\*\/buscar-vehiculos\/\*\*['"]/)
  })
  it('el sitemap excluye los estados de resultados de /reservas', () => {
    expect(cfg()).toMatch(/\/reservas\/lugar-recogida\/\*\*/)
  })
  it('los estados PATH noindex envían el mismo X-Robots-Tag', () => {
    expect(cfg()).toContain(
      "'/reservas/lugar-recogida/**': { robots: 'noindex, follow', headers: { 'x-robots-tag': 'noindex, follow' } }",
    )
    expect(cfg()).toContain(
      "'/reservas/referido/**': { robots: 'noindex, follow', headers: { 'x-robots-tag': 'noindex, follow' } }",
    )
  })
})

describe('SCEN-ACP-01 — 301 buscar-vehiculos → /reservas (server middleware path→path)', () => {
  const mw = () => tryRead('server/middleware/redirect-buscar-vehiculos.ts')
  it('el server middleware de redirect existe', () => {
    expect(exists('server/middleware/redirect-buscar-vehiculos.ts')).toBe(true)
  })
  it('captura /{city}/buscar-vehiculos/<resto> y redirige 301 a /reservas/<resto>', () => {
    expect(mw()).toMatch(/buscar-vehiculos/)
    expect(mw()).toMatch(/`\/reservas\$\{/)
    expect(mw()).toMatch(/sendRedirect\(\s*event\s*,\s*target\s*,\s*301\s*\)/)
  })
  it('el routeRule plano de buscar-vehiculos ya no está en nuxt.config', () => {
    expect(tryRead('nuxt.config.ts')).not.toMatch(/buscar-vehiculos\/\*\*['"]\s*:\s*\{\s*redirect/)
  })
})

describe('SCEN-ACP-02 — Searcher construye el PATH /reservas', () => {
  const s = () => tryRead('app/components/Searcher.vue')
  it('searchDestination arma el PATH por segmentos (referido + lugar-recogida), no query', () => {
    expect(s()).toMatch(/\/reservas\/referido\//)
    expect(s()).toMatch(/`\/lugar-recogida\/\$\{/)
    expect(s()).not.toMatch(/path:\s*'\/reservas'/)
  })
})

describe('SCEN-ACP-05 — ?paso híbrido: el gate del sync es pickup-aware (query o params)', () => {
  const w = () => tryRead('app/components/wizard/ReservationWizard.vue')
  it('el sync de ?paso usa un pickup derivado de query O params', () => {
    expect(w()).toMatch(/route\.params\.lugar_recogida/)
  })
})
