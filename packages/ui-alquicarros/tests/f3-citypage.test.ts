/**
 * F3 — CityPage mode-aware + flujo de reserva + blog (alquicarros, identidad naranja).
 *
 * Encoda los escenarios ESTÁTICOS del holdout f3-citypage (los runtime/E2E —
 * SCEN-F3-13/14 — se verifican con dev server + Playwright, no aquí):
 *   - SCEN-F3-01/02: wiring mode-aware de las páginas ([city] landing / buscar results).
 *   - SCEN-F3-03: city/* branded naranja, sin rojo hardcoded ni hex rojo de alquilame.
 *   - SCEN-F3-04: pin #41 inerte/aria-hidden reubicado a city/Hero.vue.
 *   - SCEN-F3-05/06: /reservas — Searcher, gate de búsqueda por query, robots noindex.
 *   - SCEN-F3-07/08: submit context-aware (searchDestination + guard + city-derivation).
 *   - SCEN-F3-09: badges del Searcher naranja, sin lime (#a3f78b) ni rojo.
 *   - SCEN-F3-10: estados de reserva con design-system, naranja, sin azul residual.
 *   - SCEN-F3-11: blog branded naranja, sin rojo/azul ni "Alquilame".
 *   - SCEN-F3-12: cero "Alquilame" en las superficies F3.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const tryRead = (rel: string): string => {
  const p = join(ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf-8') : ''
}

const RED_HEX = /#cc022b|#cb032c|#a00425|#93070b|#7a001a|#c71a16|#e53a1f|#ff294d|#ff7a45/i
const RED_CLASS = /\b(bg|text|border|from|to|via|ring|shadow|hover:bg|hover:text)-red-\d/
const LIME_RESIDUAL = /#a3f78b/i
// Azul residual de MARCA = azul usado como texto/borde/acento/anillo (el patrón de
// "enlace stale" de alquilame). NO incluye `bg-blue-*`, que es el color SEMÁNTICO
// de los botones "Compartir en Facebook" (igual en ambas marcas) — ver SCEN-F3-11.
const BLUE_RESIDUAL = /\b(text|border|ring|from|to)-blue-(5|6|7|8|9)\d{2}/

const CITY_DIR = 'app/components/city'
const CITY_FILES = ['Hero.vue', 'Intro.vue', 'SeoContent.vue', 'DeliveryPoints.vue', 'Testimonios.vue', 'Faq.vue']

describe('F3 — city/* components: branded naranja, sin rojo, sin marca ajena', () => {
  for (const f of CITY_FILES) {
    const src = () => tryRead(`${CITY_DIR}/${f}`)
    it(`city/${f}: existe`, () => {
      expect(existsSync(join(ROOT, CITY_DIR, f))).toBe(true)
    })
    it(`city/${f}: sin clases Tailwind red-*`, () => {
      expect(src()).not.toMatch(RED_CLASS)
    })
    it(`city/${f}: sin hex rojo de alquilame`, () => {
      expect(src()).not.toMatch(RED_HEX)
    })
    it(`city/${f}: no contiene literal "Alquilame"`, () => {
      expect(src()).not.toMatch(/Alquilame/i)
    })
  }
})

describe('F3 — SCEN-F3-04: pin #41 inerte/aria-hidden reubicado a city/Hero.vue', () => {
  const hero = () => tryRead(`${CITY_DIR}/Hero.vue`)
  it('el pin es un <span aria-hidden> con @click, no un <button>', () => {
    const inertSpan = /<span\b[^>]*aria-hidden="true"[^>]*@click="copySearchToWhatsapp"|<span\b[^>]*@click="copySearchToWhatsapp"[^>]*aria-hidden="true"/
    expect(hero()).toMatch(inertSpan)
  })
  it('no expone el secreto vía aria-label ni title', () => {
    expect(hero()).not.toMatch(/aria-label="Copiar datos de búsqueda para WhatsApp"/)
    expect(hero()).not.toMatch(/title="Copiar datos de búsqueda para WhatsApp"/)
  })
  it('mantiene el binding useShareSearchParams', () => {
    expect(hero()).toMatch(/copyToWhatsapp:\s*copySearchToWhatsapp\s*\}\s*=\s*useShareSearchParams\(\)/)
  })
})

describe('F3 — SCEN-F3-01/02: hero de ciudad mode-aware', () => {
  const hero = () => tryRead(`${CITY_DIR}/Hero.vue`)
  it('acepta el prop mode (landing | results)', () => {
    expect(hero()).toMatch(/mode\?:\s*'landing'\s*\|\s*'results'/)
  })
  it('landing: CTA "Reservar ahora" que enlaza a /reservas', () => {
    expect(hero()).toMatch(/to="\/reservas"/)
  })
  it('results: monta el Searcher (gate por mode === "results")', () => {
    expect(hero()).toMatch(/mode === 'results'/)
    expect(hero()).toMatch(/<Searcher\s*\/>/)
  })
})

describe('F3 — CityPage orquestador (reemplaza el monolito rojo viejo)', () => {
  const cp = () => tryRead('app/components/CityPage.vue')
  it('delega en componentes city/* (CityHero/CityIntro/CitySeoContent/…)', () => {
    expect(cp()).toMatch(/<CityHero\b/)
    expect(cp()).toMatch(/<CityIntro\b/)
    expect(cp()).toMatch(/<CitySeoContent\b/)
    expect(cp()).toMatch(/<CityDeliveryPoints\b/)
  })
  it('reusa marketing F1 con gate SSR-estable por mode (no onMounted)', () => {
    expect(cp()).toMatch(/mode !== 'results'/)
    expect(cp()).toMatch(/<HomeFleet\b/)
  })
  it('acepta el prop mode y lo reenvía al hero', () => {
    expect(cp()).toMatch(/mode\?:\s*'landing'\s*\|\s*'results'/)
    expect(cp()).toMatch(/:mode="mode"|:mode/)
  })
  it('ya NO contiene las secciones rojas inline del monolito viejo', () => {
    expect(cp()).not.toMatch(RED_CLASS)
  })
  // BUG (fuga de resultados): resultsActive era solo-store (pending||results||error).
  // El store Pinia es singleton de la SPA, así que tras una búsqueda CON resultados
  // una navegación SPA a un landing /[city] dejaba el store poblado y el bloque de
  // resultados (#seleccion-categorias) se renderizaba BAJO el hero de marketing. El
  // gate debe AND-ear mode === 'results' (simétrico al gate de marketing).
  it('SCEN-F3-01b: resultados solo en mode results — landing no filtra estado viejo', () => {
    expect(cp()).toMatch(
      /const resultsActive\s*=\s*computed\([\s\S]*?mode\s*===\s*['"]results['"]/,
    )
  })
})

describe('F3 — SCEN-F3-01/02: wiring de mode en las páginas', () => {
  const landing = tryRead('app/pages/[city]/index.vue')
  const RESULTS_PAGES = [
    'app/pages/[city]/buscar-vehiculos/lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]/index.vue',
    'app/pages/[city]/buscar-vehiculos/lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]/categoria/[categoria]/index.vue',
    'app/pages/[city]/buscar-vehiculos/referido/[referido]/lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]/index.vue',
    'app/pages/[city]/buscar-vehiculos/referido/[referido]/lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]/categoria/[categoria]/index.vue',
  ]
  it('[city]/index.vue pasa mode="landing"', () => {
    expect(landing).toMatch(/<CityPage[^>]*mode="landing"/)
  })
  for (const p of RESULTS_PAGES) {
    it(`results page pasa mode="results": ${p.split('/').slice(-2)[0]}/...`, () => {
      expect(tryRead(p)).toMatch(/<CityPage[^>]*mode="results"/)
    })
  }
})

describe('F3 — SCEN-F3-05/06: /reservas centralizada', () => {
  const r = () => tryRead('app/pages/reservas/index.vue')
  it('existe', () => {
    expect(existsSync(join(ROOT, 'app/pages/reservas/index.vue'))).toBe(true)
  })
  it('monta el Searcher', () => {
    expect(r()).toMatch(/<Searcher\s*\/>/)
  })
  it('dispara búsqueda desde el query string (useSearchByQueryParams)', () => {
    expect(r()).toMatch(/useSearchByQueryParams\(\)/)
  })
  it('SCEN-F3-06: estado de resultados es noindex,follow; limpia indexable', () => {
    expect(r()).toMatch(/noindex,?\s*follow/)
    expect(r()).toMatch(/route\.query\.lugar_recogida/)
  })
  it('sin rojo hardcoded', () => {
    expect(r()).not.toMatch(RED_CLASS)
  })
})

describe('F3 — SCEN-F3-05/07: composable alquilame-local portado', () => {
  it('app/composables/useSearchByQueryParams.ts existe', () => {
    expect(existsSync(join(ROOT, 'app/composables/useSearchByQueryParams.ts'))).toBe(true)
  })
  it('exporta default useSearchByQueryParams', () => {
    expect(tryRead('app/composables/useSearchByQueryParams.ts')).toMatch(
      /export default function useSearchByQueryParams/,
    )
  })
})

describe('F3 — SCEN-F3-07/08/09: Searcher submit context-aware + badges naranja', () => {
  const s = () => tryRead('app/components/Searcher.vue')
  it('SCEN-F3-07: define searchDestination (ciudad deep-link / reservas query string)', () => {
    expect(s()).toMatch(/searchDestination/)
    expect(s()).toMatch(/path:\s*'\/reservas'/)
  })
  it('SCEN-F3-07: guard de submit context-aware (searchDisabledGuardSatisfied)', () => {
    expect(s()).toMatch(/searchDisabledGuardSatisfied/)
  })
  it('SCEN-F3-08: deriva la ciudad efectiva desde la sucursal de recogida', () => {
    expect(s()).toMatch(/syncSearchLinkParams|effectiveCity/)
  })
  it('SCEN-F3-09: badges sin lime residual (#a3f78b)', () => {
    expect(s()).not.toMatch(LIME_RESIDUAL)
  })
  it('SCEN-F3-09: badges sin rojo de alquilame (bg-red-600 text-white)', () => {
    expect(s()).not.toMatch(/bg-red-600\s+text-white/)
  })
})

describe('F3 — SCEN-F3-10: páginas de estado de reserva, design-system + naranja', () => {
  const STATE_PAGES = [
    'app/pages/pendiente.vue',
    'app/pages/sindisponibilidad.vue',
    'app/pages/reservado/[reserveCode]/index.vue',
  ]
  for (const p of STATE_PAGES) {
    const name = p.split('/').slice(-1)[0] === 'index.vue' ? 'reservado' : p.split('/').slice(-1)[0]
    const src = () => tryRead(p)
    it(`${name}: usa el design-system nuevo (heading-*)`, () => {
      expect(src()).toMatch(/heading-(page|sub|hero)/)
    })
    it(`${name}: sin azul residual de alquilame (blue-900/700)`, () => {
      expect(src()).not.toMatch(BLUE_RESIDUAL)
    })
    it(`${name}: sin clases red-* hardcoded`, () => {
      expect(src()).not.toMatch(RED_CLASS)
    })
  }
  it('sindisponibilidad: CTA naranja con texto oscuro (AA), no bg-white text-blue-900', () => {
    const src = tryRead('app/pages/sindisponibilidad.vue')
    expect(src).not.toMatch(/bg-white\s+text-blue-900/)
    expect(src).toMatch(/bg-brand-(500|600)/)
  })
})

describe('F3 — SCEN-F3-11: blog branded naranja, sin rojo/azul ni marca ajena', () => {
  const BLOG_PAGES = ['app/pages/blog/index.vue', 'app/pages/blog/[...slug].vue']
  for (const p of BLOG_PAGES) {
    const name = p.split('/').slice(-1)[0]
    const src = () => tryRead(p)
    it(`blog/${name}: acentos de marca (brand-*)`, () => {
      expect(src()).toMatch(/\b(bg|text|border|from|to)-brand-\d/)
    })
    it(`blog/${name}: sin clases red-* hardcoded`, () => {
      expect(src()).not.toMatch(RED_CLASS)
    })
    it(`blog/${name}: sin azul de marca residual (texto/borde/acento); bg-blue de Facebook permitido`, () => {
      // SCEN-F3-11 (corregido en impl): el azul de marca residual sería azul usado
      // como texto/borde/acento. El `bg-blue-*` de los botones "Compartir en
      // Facebook" es semántico (igual en ambas marcas) y queda fuera del invariante.
      expect(src()).not.toMatch(BLUE_RESIDUAL)
    })
    it(`blog/${name}: no contiene literal "Alquilame"`, () => {
      expect(src()).not.toMatch(/Alquilame/i)
    })
  }
})
