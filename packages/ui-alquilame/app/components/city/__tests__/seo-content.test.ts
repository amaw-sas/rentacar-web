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
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CITY = join(__dirname, '..')
const INTRO = readFileSync(join(__dirname, '..', 'Intro.vue'), 'utf-8')
const SEO = readFileSync(join(__dirname, '..', 'SeoContent.vue'), 'utf-8')
const CHICA = readFileSync(
  join(__dirname, '..', '..', 'Images', 'Ciudades', 'Chica.vue'),
  'utf-8',
)

describe('F2 city Intro — #descripcion + #introduccion preserved (SCEN-F2-02)', () => {
  it('keeps #descripcion, and #introduccion moved to the SEO block', () => {
    // #introduccion now sits directly ABOVE #destinos in SeoContent.vue: the two
    // read as one story (why a car here → where to go), and the operator asked
    // for them stacked rather than merged, so BOTH headings survive.
    expect(INTRO).toContain('id="descripcion"')
    expect(INTRO).not.toContain('id="introduccion"')
    expect(SEO).toContain('id="introduccion"')
  })

  it('places #introduccion immediately before #destinos', () => {
    const intro = SEO.indexOf('id="introduccion"')
    const destinos = SEO.indexOf('id="destinos"')
    expect(intro).toBeGreaterThan(-1)
    expect(destinos).toBeGreaterThan(intro)
    // Nothing else between them.
    const between = SEO.slice(intro, destinos)
    expect(between).not.toMatch(/id="(ventajas|consejos-conduccion|mejor-temporada|ciudades-cercanas)"/)
  })

  it('keeps the #descripcion poster copy verbatim', () => {
    expect(INTRO).toContain('En {{ franchise.shortname }}')
    // alquilame-specific tagline (deliberately differs from alquilatucarro's
    // "la libertad / de moverte / a tu manera / es realidad" — same message,
    // distinct wording so the city page no longer mirrors the sister brand).
    expect(INTRO).toContain('muévete')
    expect(INTRO).toContain('a tu ritmo')
    expect(INTRO).toContain('sin')
    expect(INTRO).toContain('límites')
    // and must NOT regress to the shared alquilatucarro phrasing
    expect(INTRO).not.toContain('a tu manera')
    // city.description still rendered (indexable per-city copy)
    expect(INTRO).toMatch(/v-text="city\?\.description"/)
  })

  it('keeps the #introduccion heading + intro paragraph, guarded by expandedContent', () => {
    // Same contract, now owned by SeoContent.vue.
    expect(SEO).toContain('Explora {{ city?.name }}')
    expect(SEO).toContain('con tu carro de alquiler')
    expect(SEO).toContain('expandedContent.intro')
    expect(SEO).toMatch(/v-if="expandedContent"/)
  })

  it('renders the city illustration (CLS-safe reserved box)', () => {
    expect(INTRO).toContain('LazyImagesCiudadesChica')
    expect(INTRO).toMatch(/aspect-square/)
  })
})

describe('City #descripcion illustration — brand-specific (not the shared chica.webp)', () => {
  // The #descripcion illustration used to be /images/ciudades/chica.webp, served
  // from the logic layer and IDENTICAL across the three brands — which made the
  // alquilame city page look like alquilatucarro. alquilame now ships its own
  // illustration. These assertions are the regression sentinel: never revert to
  // the shared asset.
  it('points at the alquilame-owned image, not the shared logic-layer asset', () => {
    expect(CHICA).toContain('/images/cities/descripcion.webp')
    expect(CHICA).not.toContain('/images/ciudades/chica.webp')
  })

  it('keeps the SEO alt text per-city (city name + alquiler keyword)', () => {
    expect(CHICA).toMatch(/alt="`[^`]*\$\{cityName\}/)
    expect(CHICA).toContain('carro de alquiler')
  })

  it('keeps the CLS-safe 800x800 NuxtImg contract', () => {
    expect(CHICA).toContain('width="800"')
    expect(CHICA).toContain('height="800"')
    expect(CHICA).toMatch(/aspect-square/)
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

  it('keeps the #ventajas heading + factual inventory-backed benefit blurbs', () => {
    expect(SEO).toContain('Ventajas de alquilar carro')
    expect(SEO).toContain('Precios transparentes')
    expect(SEO).toContain('Sin cargos ocultos ni sorpresas.')
    expect(SEO).toContain('Flota variada')
    expect(SEO).toContain('Desde económicos hasta SUVs y camionetas.')
    expect(SEO).toContain('Puntos de recogida')
    expect(SEO).toContain('puntos de recogida activos en')
    expect(SEO).not.toContain('Aeropuerto, centro de la ciudad o donde te resulte más cómodo')
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
    expect(INTRO).toMatch(/h-1 w-10 rounded-full bg-red-600/)
    expect(SEO).toMatch(/h-1 w-10 rounded-full bg-red-600/)
  })
})

/**
 * SUPERSEDED by the two-width rule (see section-widths.test.ts).
 *
 * This block briefly matched #introduccion to its neighbours at 1024px to kill
 * a narrow-wide-narrow jump. The operator then chose a rule that decides width
 * by CONTENT instead: grids full width, running prose capped. Under that rule
 * the intro is deliberately narrower than the card sections around it — the
 * consistency comes from every grid agreeing on 1280px, not from prose
 * stretching to meet them. What remains here is the part that still holds:
 * the intro is prose and must stay capped.
 */
describe('SEO block — #introduccion is prose and stays capped', () => {
  const widthOf = (id: string): string | null => {
    const at = SEO.indexOf(`id="${id}"`)
    if (at < 0) return null
    const m = SEO.slice(at, at + 600).match(/max-w-(\w+)\s+mx-auto/)
    return m ? m[1]! : null
  }

  it('caps the intro at the reading width, not the grid width', () => {
    expect(widthOf('introduccion')).toBe('3xl')
  })

  it('its neighbouring CARD sections are the ones that run full width', () => {
    expect(widthOf('ventajas')).toBe('7xl')
    expect(widthOf('destinos')).toBe('7xl')
  })

  it('mejor-temporada is now full width (it gained an accompanying image)', () => {
    // No longer pure prose: text + road photo side by side, so it matches the
    // card sections' width instead of the narrow reading cap.
    expect(widthOf('mejor-temporada')).toBe('7xl')
  })
})

/**
 * All-cities pill grid on a city page:
 *   GIVEN a city landing
 *   WHEN  the nearby-cities section renders
 *   THEN  below the featured nearby cards it lists EVERY active city as a pill
 *         button, the same treatment the home uses — internal links that help
 *         both the visitor and search crawlers reach every city page.
 * The current city is excluded (no self-link), and the section now shows even
 * when a city has no curated "nearby" mapping, so all 19 pages get the grid.
 */
describe('city nearby section — all-cities pill grid, like the home', () => {
  it('sources every active city from useData()', () => {
    expect(SEO).toMatch(/useData\(\)/)
    expect(SEO).toMatch(/const\s*\{\s*cities\s*\}\s*=\s*useData\(\)/)
  })

  it('renders a wrapping pill grid over the cities, excluding the current one', () => {
    expect(SEO).toMatch(/flex flex-wrap/)
    expect(SEO).toMatch(/rounded-full/)
    // Iterates a list that filters out the current city id.
    expect(SEO).toMatch(/otherCities|c\.id !== city\?\.id|city\.id !== props\.city/)
  })

  it('links each pill internally to /{city.id}', () => {
    expect(SEO).toMatch(/:to="`\/\$\{[a-z]+\.id\}`"/)
  })

  it('shows the section even without curated nearby cities', () => {
    // The section no longer hides when relatedCities is empty — the all-cities
    // pills are always worth rendering for internal linking.
    const at = SEO.indexOf('id="ciudades-cercanas"')
    const openTag = SEO.slice(SEO.lastIndexOf('<section', at), at + 200)
    expect(openTag).not.toMatch(/v-if="relatedCities\.length > 0"\s*\n?\s*id="ciudades-cercanas"/)
  })
})

/**
 * "Mejor época" gets an accompanying image:
 *   GIVEN a desktop viewport
 *   WHEN  the best-season section renders
 *   THEN  a small road photo sits BESIDE the paragraph, not above it, so it does
 *         not add to the section's height. The image is object-cover (zoom-crop)
 *         inside a fixed box, lazy, and webp.
 * The photo is decorative and generic (a car on a scenic road), shared across
 * all city pages — mejor-temporada is one component for all 19 cities.
 */
describe('best-season section — accompanying road image', () => {
  const at = SEO.indexOf('id="mejor-temporada"')
  const seg = SEO.slice(at, at + 2400)

  it('renders the road photo as a lazy NuxtImg (webp)', () => {
    expect(seg).toMatch(/<NuxtImg\b/)
    expect(seg).toContain('/images/cities/carretera-viaje.webp')
    expect(seg).toMatch(/loading="lazy"/)
    expect(seg).toMatch(/format="webp"|\.webp/)
  })

  it('lays text and image side by side on desktop, so height is unchanged', () => {
    expect(seg).toMatch(/lg:grid-cols-/)
  })

  it('zoom-crops the image with object-cover in a reserved box', () => {
    expect(seg).toMatch(/object-cover/)
    expect(seg).toMatch(/aspect-\[|h-full/)
  })

  it('ships the referenced asset', () => {
    const asset = join(CITY, '..', '..', '..', 'public/images/cities/carretera-viaje.webp')
    expect(existsSync(asset), 'carretera-viaje.webp missing').toBe(true)
  })
})
