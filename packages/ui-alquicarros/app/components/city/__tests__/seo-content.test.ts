/**
 * F2 step03 — City SEO content restyle (issue #112, SCEN-F2-02).
 *
 * Static-source assertions over city/Intro.vue + city/SeoContent.vue. The
 * runtime/visual check (rendered text on the preview, contrast, CLS) is
 * deferred to the preview pass; here we pin the CONTRACT that matters for SEO:
 *
 *   - every original indexable section is present (descripcion / introduccion /
 *     ventajas / destinos / consejos-conduccion / mejor-temporada /
 *     ciudades-cercanas) with its key heading + key copy VERBATIM.
 *   - no SEO copy was dropped (benefit blurbs, driving-tip labels,
 *     related-cities prompt all still present).
 *   - design styling lessons: headings use a .heading-* utility (Plus Jakarta),
 *     gradients never use the broken v3 bg-gradient-to- alias.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const INTRO = readFileSync(join(__dirname, '..', 'Intro.vue'), 'utf-8')
const SEO = readFileSync(join(__dirname, '..', 'SeoContent.vue'), 'utf-8')

describe('F2 city Intro — #descripcion + #introduccion preserved (SCEN-F2-02)', () => {
  it('keeps both section ids', () => {
    expect(INTRO).toContain('id="descripcion"')
    expect(INTRO).toContain('id="introduccion"')
  })

  it('keeps the #descripcion poster copy verbatim', () => {
    expect(INTRO).toContain('En {{ franchise.shortname }}')
    expect(INTRO).toContain('la libertad')
    expect(INTRO).toContain('de moverte')
    expect(INTRO).toContain('a tu manera')
    expect(INTRO).toContain('es realidad')
    // city.description still rendered (indexable per-city copy)
    expect(INTRO).toMatch(/v-text="city\?\.description"/)
  })

  it('keeps the #introduccion heading + intro paragraph, guarded by expandedContent', () => {
    expect(INTRO).toContain('Explora {{ city?.name }}')
    expect(INTRO).toContain('con tu carro de alquiler')
    expect(INTRO).toContain('expandedContent.intro')
    expect(INTRO).toMatch(/v-if="expandedContent"/)
  })

  it('renders the city illustration (CLS-safe reserved box)', () => {
    expect(INTRO).toContain('LazyImagesCiudadesChica')
    expect(INTRO).toMatch(/aspect-square/)
  })
})

describe('F2 city SeoContent — sections preserved (SCEN-F2-02)', () => {
  it('keeps every section id', () => {
    for (const id of [
      'ventajas',
      'destinos',
      'consejos-conduccion',
      'mejor-temporada',
      'ciudades-cercanas',
    ]) {
      expect(SEO).toContain(`id="${id}"`)
    }
  })

  it('keeps the #ventajas heading + all four benefit blurbs verbatim', () => {
    expect(SEO).toContain('Ventajas de alquilar carro')
    expect(SEO).toContain('Precios transparentes')
    expect(SEO).toContain('Sin cargos ocultos ni sorpresas.')
    expect(SEO).toContain('Flota variada')
    expect(SEO).toContain('Desde económicos hasta SUVs y camionetas.')
    expect(SEO).toContain('Entrega flexible')
    expect(SEO).toContain('Recoge y devuelve tu carro en diferentes puntos de')
    expect(SEO).toContain('Atención personalizada')
    expect(SEO).toContain('Soporte en español las 24 horas.')
  })

  it('keeps the #destinos heading + the destination data binding', () => {
    expect(SEO).toContain('Destinos para recorrer con carro rentado')
    expect(SEO).toContain('desde {{ city?.name }}')
    expect(SEO).toContain('expandedContent.destinations')
    expect(SEO).toContain('destination.name')
    expect(SEO).toContain('destination.time')
    expect(SEO).toContain('destination.description')
  })

  it('keeps the #consejos-conduccion heading + the 3 driving-tip labels/bindings', () => {
    expect(SEO).toContain('para alquilar carro en {{ city?.name }}')
    expect(SEO).toContain('Pico y Placa')
    expect(SEO).toContain('Peajes')
    expect(SEO).toContain('Parqueaderos')
    expect(SEO).toContain('drivingTips.picoPlaca')
    expect(SEO).toContain('drivingTips.tolls')
    expect(SEO).toContain('drivingTips.parking')
  })

  it('keeps the #mejor-temporada heading + bestSeason binding', () => {
    expect(SEO).toContain('Mejor época')
    expect(SEO).toContain('para alquilar carro y viajar a {{ city?.name }}')
    expect(SEO).toContain('expandedContent.bestSeason')
  })

  it('keeps the #ciudades-cercanas heading, prompt + internal links', () => {
    expect(SEO).toContain('Alquiler de carros')
    expect(SEO).toContain('en ciudades cercanas')
    expect(SEO).toContain('¿Planeas un viaje más largo?')
    expect(SEO).toContain('relatedCities')
    expect(SEO).toMatch(/:to="`\/\$\{related\.id\}`"/)
    expect(SEO).toContain('related.distance')
  })
})

describe('F2 city SEO content — design styling lessons', () => {
  it('headings adopt a .heading-* utility (Plus Jakarta, F0-03)', () => {
    expect(INTRO).toMatch(/heading-(section|sub|card)/)
    expect(SEO).toMatch(/heading-section/)
  })

  it('never uses the broken v3 bg-gradient-to- alias', () => {
    expect(INTRO).not.toContain('bg-gradient-to-')
    expect(SEO).not.toContain('bg-gradient-to-')
  })

  it('uses the design red accent bar on the SEO sections', () => {
    expect(INTRO).toMatch(/h-1 w-10 rounded-full bg-brand-600/)
    expect(SEO).toMatch(/h-1 w-10 rounded-full bg-brand-600/)
  })
})
