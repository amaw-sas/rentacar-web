import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { getCityFAQs, getCityPickupAnswer, getCityPriceAnswer } from '../composables/useCityFAQs'
import { slugify } from '../utils/slugify'
import type BranchData from '../utils/types/data/BranchData'

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const
const TITLE_PAGES = [
  'app/pages/blog/index.vue',
  'app/pages/blog/[...slug].vue',
  'app/pages/gana/index.vue',
  'app/pages/gana/politicas-privacidad.vue',
  'app/pages/gana/terminos-condiciones.vue',
  'app/pages/politica-privacidad.vue',
  'app/pages/terminos-condiciones.vue',
  'app/pages/pendiente.vue',
  'app/pages/sindisponibilidad.vue',
  'app/pages/reservado/[reserveCode]/index.vue',
] as const

const readBrandFile = (brand: string, relativePath: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../${brand}/${relativePath}`, import.meta.url)),
    'utf8',
  )

const readRootFile = (relativePath: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../${relativePath}`, import.meta.url)),
    'utf8',
  )

const ACTIVE_BRANCH_NAMES = {
  Armenia: ['Armenia Aeropuerto'],
  Barranquilla: ['Barranquilla Aeropuerto', 'Barranquilla Norte'],
  Bogotá: [
    'Bogotá Aeropuerto',
    'Bogotá Fontibón',
    'Bogotá Almacén Éxito del Country',
    'Bogotá Centro Nuestro',
    'Bogotá Almacen Yumbo Calle 170',
  ],
  Bucaramanga: ['Bucaramanga Aeropuerto'],
  Cali: ['Cali Aeropuerto', 'Cali Sur Camino Real', 'Cali Norte Chipichape'],
  Cartagena: ['Cartagena Aeropuerto'],
  Cúcuta: ['Cúcuta Aeropuerto'],
  Floridablanca: ['Floridablanca'],
  Ibagué: ['Ibagué'],
  Manizales: ['Manizales'],
  Medellín: [
    'Medellín Aeropuerto José María Córdoba',
    'Medellín Centro Éxito Colombia',
    'Rionegro',
    'Medellín El Poblado',
  ],
  Montería: ['Montería Aeropuerto', 'Montería Ciudad'],
  Neiva: ['Neiva Aeropuerto'],
  Palmira: ['Palmira'],
  Pereira: ['Pereira Aeropuerto'],
  'Santa Marta': ['Santa Marta Aeropuerto', 'Santa Marta Barrio El prado'],
  Soledad: ['Soledad Aeropuerto'],
  Valledupar: ['Valledupar Aeropuerto'],
  Villavicencio: ['Villavicencio'],
} as const

const ACTIVE_BRANCHES: BranchData[] = Object.entries(ACTIVE_BRANCH_NAMES).flatMap(
  ([cityName, names]) => names.map((name, index) => ({
    id: index + 1,
    code: `TEST-${cityName}-${index}`,
    name,
    city: cityName,
  })),
)

interface StaticCityContent {
  id: string
  description: string
  testimonials: Array<{ quote: string }>
}

const AIRPORT_PICKUP_CLAIM = /(?:recog\w*|retir\w*|entreg\w*|alquil\w*)[^.!?]{0,120}aeropuerto|aeropuerto[^.!?]{0,120}(?:recog\w*|retir\w*|entreg\w*|alquil\w*)/i
const LEGACY_DAILY_PRICE = '$' + '32'

describe('SEO content hygiene across brands (F5/F9)', () => {
  it('uses one factual city price answer without a numeric from-price', () => {
    const answer = getCityPriceAnswer('Bogotá')

    expect(answer).toContain('Bogotá')
    expect(answer).toContain('fechas')
    expect(answer).toContain('disponibilidad')
    expect(answer).not.toMatch(/\$|USD|COP|\d+[.,]?\d*/)
  })

  it('uses that same price answer in every city FAQ and its FAQPage schema input', () => {
    for (const cityName of Object.keys(ACTIVE_BRANCH_NAMES)) {
      const priceFAQ = getCityFAQs(cityName).find((faq) => faq.label.startsWith('¿Cuánto cuesta'))
      expect(priceFAQ?.content).toBe(getCityPriceAnswer(cityName))
      expect(priceFAQ?.content).not.toMatch(/\$|USD|COP|\d+[.,]?\d*/)
    }
  })

  it('builds all 19 pickup answers from active branch names without invented airport or centre claims', () => {
    for (const [cityName, expectedNames] of Object.entries(ACTIVE_BRANCH_NAMES)) {
      const pickupFAQ = getCityFAQs(cityName, ACTIVE_BRANCHES).find((faq) =>
        faq.label.startsWith('¿Dónde puedo recoger')
      )

      expect(pickupFAQ, cityName).toBeDefined()
      for (const branchName of expectedNames) {
        expect(pickupFAQ?.content, cityName).toContain(branchName)
      }

      const inventoryText = expectedNames.join(' ')
      if (!/aeropuerto/i.test(inventoryText)) {
        expect(pickupFAQ?.content, cityName).not.toMatch(/aeropuerto/i)
      }
      if (!/centro/i.test(inventoryText)) {
        expect(pickupFAQ?.content, cityName).not.toMatch(/centro/i)
      }
    }
  })

  it('fails soft when branch inventory is unavailable instead of promising a pickup location', () => {
    const answer = getCityPickupAnswer('Manizales')

    expect(answer).toContain('puntos de recogida activos')
    expect(answer).toContain('buscador')
    expect(answer).not.toMatch(/aeropuerto|centro|La Nubia/i)
  })

  for (const brand of BRANDS) {
    it(`${brand} derives home and social price metadata instead of storing a numeric claim`, () => {
      const configSource = readBrandFile(brand, 'app/app.config.ts')
      const homeSource = readBrandFile(brand, 'app/pages/index.vue')

      expect(configSource).not.toMatch(/\$\d[\d.,]*\s*COP\/día/)
      expect(configSource).not.toContain(LEGACY_DAILY_PRICE)

      expect(homeSource).toContain('const homeSEO = useHomeSEO()')
      expect(homeSource).toMatch(/useBaseSEO\(\{\s*title:\s*homeSEO\.title,\s*description:\s*homeSEO\.description/s)
      expect(homeSource).toMatch(/ogTitle:\s*homeSEO\.title/)
      expect(homeSource).toMatch(/twitterTitle:\s*homeSEO\.title/)
      expect(homeSource).toMatch(/ogDescription:\s*homeSEO\.description/)
      expect(homeSource).toMatch(/twitterDescription:\s*homeSEO\.description/)
    })
  }

  it('removes generic airport/centre promises from all three city benefit surfaces', () => {
    const files = [
      ['ui-alquilatucarro', 'app/components/CityPage.vue'],
      ['ui-alquilame', 'app/components/city/SeoContent.vue'],
      ['ui-alquicarros', 'app/components/city/SeoContent.vue'],
    ] as const

    for (const [brand, path] of files) {
      const source = readBrandFile(brand, path)
      expect(source).toContain('puntos de recogida activos')
      expect(source).not.toContain('Aeropuerto, centro de la ciudad o donde te resulte más cómodo')
    }
  })

  it('checks build-time pickup claims for all 19 cities against active airport inventory', () => {
    for (const brand of BRANDS) {
      const source = readBrandFile(brand, 'nuxt.config.ts')
      for (const [cityName, branchNames] of Object.entries(ACTIVE_BRANCH_NAMES)) {
        const escapedCityName = cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const entry = source.match(
          new RegExp(`title: '${escapedCityName}',\\s+description: '([^']+)'`),
        )

        expect(entry, `${brand}: missing ${cityName} build-time description`).not.toBeNull()
        if (!branchNames.some((name) => /aeropuerto/i.test(name))) {
          expect(entry?.[1], `${brand}: unsupported airport pickup in ${cityName}`).not.toMatch(
            AIRPORT_PICKUP_CLAIM,
          )
        }
      }
    }
  })

  it('checks descriptions and testimonials for all 19 cities against active airport inventory', () => {
    const cities = JSON.parse(readRootFile('scripts/cities-data.json')) as StaticCityContent[]

    expect(cities).toHaveLength(Object.keys(ACTIVE_BRANCH_NAMES).length)
    for (const [cityName, branchNames] of Object.entries(ACTIVE_BRANCH_NAMES)) {
      const city = cities.find((candidate) => candidate.id === slugify(cityName))
      expect(city, `missing static content for ${cityName}`).toBeDefined()

      if (!branchNames.some((name) => /aeropuerto/i.test(name))) {
        const publicCopy = [city?.description, ...(city?.testimonials.map(({ quote }) => quote) ?? [])]
        for (const copy of publicCopy) {
          expect(copy, `unsupported airport pickup in ${cityName}`).not.toMatch(AIRPORT_PICKUP_CLAIM)
        }
      }
    }
  })

  it('keeps footer city navigation lightweight and sends real CTAs to their final surface', () => {
    for (const brand of BRANDS) {
      const layout = readBrandFile(brand, 'app/layouts/default.vue')
      expect(layout).toContain(':to="`/${city.id}`"')
      expect(layout).not.toContain('buildCityReservationURL')
    }
    expect(readBrandFile('ui-alquilatucarro', 'app/pages/tiktok.vue')).toContain(
      "}, 'city-search')",
    )
  })

  for (const brand of BRANDS) {
    it(`${brand} page titles leave the brand suffix to the global template`, () => {
      for (const page of TITLE_PAGES) {
        const source = readBrandFile(brand, page)
        expect(source, `${brand}/${page}`).not.toMatch(
          /^\s*title:\s*(?:`|'|")[^\n]*\|\s*(?:\$\{franchise\.(?:shortname|title)\}|Alquilatucarro|Alquilame|Alquicarros)/im,
        )
      }
    })
  }

  it('keeps the Alquilatucarro TikTok title bare as well', () => {
    const source = readBrandFile('ui-alquilatucarro', 'app/pages/tiktok.vue')
    expect(source).toContain("title: 'Alquila tu carro en tu ciudad'")
    expect(source).not.toContain("title: 'Alquila tu carro en tu ciudad |")
  })
})
