import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { getCityFAQs, getCityPriceAnswer } from '../composables/useCityFAQs'

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

describe('SEO content hygiene across brands (F5/F9)', () => {
  it('uses one factual city price answer without a numeric from-price', () => {
    const answer = getCityPriceAnswer('Bogotá')

    expect(answer).toContain('Bogotá')
    expect(answer).toContain('fechas')
    expect(answer).toContain('disponibilidad')
    expect(answer).not.toMatch(/\$|USD|COP|\d+[.,]?\d*/)
  })

  it('uses that same price answer in every city FAQ and its FAQPage schema input', () => {
    const cityNames = [
      'Armenia', 'Barranquilla', 'Bogotá', 'Bucaramanga', 'Cali', 'Cartagena',
      'Cúcuta', 'Floridablanca', 'Ibagué', 'Manizales', 'Medellín', 'Montería',
      'Neiva', 'Palmira', 'Pereira', 'Santa Marta', 'Soledad', 'Valledupar',
      'Villavicencio',
    ]

    for (const cityName of cityNames) {
      const priceFAQ = getCityFAQs(cityName).find((faq) => faq.label.startsWith('¿Cuánto cuesta'))
      expect(priceFAQ?.content).toBe(getCityPriceAnswer(cityName))
      expect(priceFAQ?.content).not.toMatch(/\$|USD|COP|\d+[.,]?\d*/)
    }
  })

  it('makes each brand CTA request its final reservation surface', () => {
    expect(readBrandFile('ui-alquilatucarro', 'app/layouts/default.vue')).toContain(
      '}, "city-search");',
    )
    expect(readBrandFile('ui-alquilatucarro', 'app/pages/tiktok.vue')).toContain(
      "}, 'city-search')",
    )
    expect(readBrandFile('ui-alquilame', 'app/layouts/default.vue')).toContain(
      '}, "reservas");',
    )
    expect(readBrandFile('ui-alquicarros', 'app/layouts/default.vue')).toContain(
      '}, "reservas");',
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
