/**
 * alquilame — /reservas por PATH + independencia de buscar-vehiculos.
 *
 * Codifica los escenarios ESTÁTICOS del holdout reservas-path-migration (los
 * runtime/E2E — SCEN-AL-02/03 — se verifican con dev server + Playwright):
 *   - SCEN-AL-01: nuxt.config redirige /{city}/buscar-vehiculos/** → 301.
 *   - SCEN-AL-04: ReservasResults es noindex,follow + canonical /reservas; el
 *     sitemap excluye los paths de resultados de /reservas y ya no menciona
 *     buscar-vehiculos.
 *   - SCEN-AL-05: sin páginas buscar-vehiculos; el árbol PATH de /reservas existe
 *     y monta <ReservasResults>; sindisponibilidad reapunta a /reservas (no a
 *     buscar-vehiculos); SelectBranch eliminado; Searcher construye el PATH.
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

// Cola de segmentos compartida por buscar-vehiculos y por el árbol PATH de /reservas.
const TAIL =
  'lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]'

const RESERVAS_PATH_PAGES = [
  `app/pages/reservas/${TAIL}/index.vue`,
  `app/pages/reservas/${TAIL}/categoria/[categoria]/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/categoria/[categoria]/index.vue`,
]

const REMOVED_BUSCAR_VEHICULOS_PAGES = [
  `app/pages/[city]/buscar-vehiculos/${TAIL}/index.vue`,
  `app/pages/[city]/buscar-vehiculos/${TAIL}/categoria/[categoria]/index.vue`,
  `app/pages/[city]/buscar-vehiculos/referido/[referido]/${TAIL}/index.vue`,
  `app/pages/[city]/buscar-vehiculos/referido/[referido]/${TAIL}/categoria/[categoria]/index.vue`,
]

describe('SCEN-AL-05 — árbol PATH de /reservas monta <ReservasResults>', () => {
  it('components/reservas/Results.vue existe', () => {
    expect(exists('app/components/reservas/Results.vue')).toBe(true)
  })
  const results = () => tryRead('app/components/reservas/Results.vue')
  it('Results dispara la búsqueda por route.params (useSearchByRouteParams)', () => {
    expect(results()).toMatch(/useSearchByRouteParams\(\)/)
  })
  it('Results monta el grid CategorySelectionSection', () => {
    expect(results()).toMatch(/<CategorySelectionSection\b/)
  })
  for (const p of RESERVAS_PATH_PAGES) {
    const label = p.replace(`app/pages/reservas/`, '').replace(`/${TAIL}`, '/…')
    it(`existe la página PATH: reservas/${label}`, () => {
      expect(exists(p)).toBe(true)
    })
    it(`reservas/${label} monta <ReservasResults>`, () => {
      expect(tryRead(p)).toMatch(/<ReservasResults\s*\/>/)
    })
  }
})

describe('SCEN-AL-04 — SEO: Results noindex + canonical /reservas; /reservas limpio indexable', () => {
  const results = () => tryRead('app/components/reservas/Results.vue')
  it('Results emite robots noindex, follow (incondicional en el estado de resultados)', () => {
    expect(results()).toMatch(/robots:\s*'noindex,\s*follow'/)
  })
  it('Results canonicaliza a /reservas', () => {
    expect(results()).toMatch(/\/reservas`/)
    expect(results()).toMatch(/rel:\s*'canonical'/)
  })
  it('la /reservas limpia sigue con robots condicional (indexable sin query)', () => {
    const clean = tryRead('app/pages/reservas/index.vue')
    expect(clean).toMatch(/route\.query\.lugar_recogida\s*\?\s*'noindex, follow'\s*:\s*undefined/)
  })
})

describe('SCEN-AL-04 — sitemap: excluye paths de resultados /reservas, sin buscar-vehiculos', () => {
  const cfg = () => tryRead('nuxt.config.ts')
  // El routeRule 301 SÍ menciona buscar-vehiculos (fuente del redirect); lo que
  // desaparece es la entrada de exclusión del SITEMAP `'/*/buscar-vehiculos/**'`.
  it('el sitemap ya no lista la exclusión buscar-vehiculos', () => {
    expect(cfg()).not.toMatch(/['"]\/\*\/buscar-vehiculos\/\*\*['"]/)
  })
  it('el sitemap excluye los estados de resultados de /reservas', () => {
    expect(cfg()).toMatch(/\/reservas\/lugar-recogida\/\*\*/)
  })
})

describe('SCEN-AL-01 — 301 buscar-vehiculos → /reservas (server middleware path→path)', () => {
  const mw = () => tryRead('server/middleware/redirect-buscar-vehiculos.ts')
  it('el server middleware de redirect existe', () => {
    expect(exists('server/middleware/redirect-buscar-vehiculos.ts')).toBe(true)
  })
  it('captura /{city}/buscar-vehiculos/<resto> y redirige 301 a /reservas/<resto>', () => {
    expect(mw()).toMatch(/buscar-vehiculos/)
    expect(mw()).toMatch(/`\/reservas\$\{/)
    expect(mw()).toMatch(/sendRedirect\(\s*event\s*,\s*target\s*,\s*301\s*\)/)
  })
})

describe('SCEN-AL-05 — buscar-vehiculos eliminado + sin targets vivos', () => {
  for (const p of REMOVED_BUSCAR_VEHICULOS_PAGES) {
    const label = p.replace('app/pages/[city]/buscar-vehiculos/', '').replace(`/${TAIL}`, '/…')
    it(`la página buscar-vehiculos NO existe: ${label}`, () => {
      expect(exists(p)).toBe(false)
    })
  }
  it('validateCityParams eliminado (404 por ciudad — /reservas no tiene ciudad)', () => {
    expect(exists('app/middleware/validateCityParams.ts')).toBe(false)
  })
  it('SelectBranch.vue eliminado (dead-code)', () => {
    expect(exists('app/components/SelectBranch.vue')).toBe(false)
  })
  it('sindisponibilidad reapunta a un PATH /reservas (no reconstruye la URL buscar-vehiculos)', () => {
    const src = tryRead('app/pages/sindisponibilidad.vue')
    // La URL VIVA buscar-vehiculos siempre continuaba con `/lugar-recogida/`; el
    // comentario nuevo solo menciona la palabra suelta. Distinguimos por el sufijo.
    expect(src).not.toMatch(/buscar-vehiculos\/lugar-recogida/)
    expect(src).toMatch(/\/reservas\/lugar-recogida/)
  })
})

describe('SCEN-AL-03 — deep-link categoría (PATH) aterriza en la card, no abre slideover', () => {
  const css = () => tryRead('app/components/CategorySelectionSection.vue')
  it('la auto-apertura se gatea por query (?resumen/?reservar), no por el path categoria', () => {
    expect(css()).toMatch(/abrirSlideoverDesdeUrl/)
    expect(css()).toMatch(/if\s*\(abrirSlideoverDesdeUrl\.value\)/)
  })
  it('el path-categoria hace scroll a la card en vez de abrir', () => {
    expect(css()).toMatch(/scrollIntoView/)
  })
  it('CategoryCard expone un id scrolleable categoria-<code>', () => {
    expect(tryRead('app/components/CategoryCard.vue')).toMatch(/id="`categoria-\$\{categoryCode\}`"/)
  })
})

describe('SCEN-AL-02 — Searcher construye el PATH /reservas', () => {
  const s = () => tryRead('app/components/Searcher.vue')
  it('searchDestination arma el PATH por segmentos (referido + lugar-recogida), no query', () => {
    // El path se construye por concatenación: prefijo `/reservas`(+`/referido/…`)
    // y la cola `/lugar-recogida/${…}/…`. Verificamos ambos fragmentos y que ya no
    // exista la forma vieja de objeto-query (`path: '/reservas'` + `query:`).
    expect(s()).toMatch(/\/reservas\/referido\//)
    expect(s()).toMatch(/`\/lugar-recogida\/\$\{/)
    expect(s()).not.toMatch(/path:\s*'\/reservas'/)
  })
})
