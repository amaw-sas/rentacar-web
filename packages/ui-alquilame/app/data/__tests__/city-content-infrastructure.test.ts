import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  useCityExpandedContent as useSharedCityExpandedContent,
} from '@rentacar-main/logic/composables/useCityContent'
import {
  getCityFAQs as getSharedCityFAQs,
} from '@rentacar-main/logic/composables/useCityFAQs'
import type { BranchData } from '@rentacar-main/logic/utils'
import { describe, expect, it } from 'vitest'

import {
  cityContentEntries,
  getCityMetaDescription,
  useCityExpandedContent,
} from '../cityContent'
import {
  buildCityFAQSchema,
  cityFAQEntries,
  getCityFAQs,
} from '../cityFAQs'
import { googleReviews, pickCityReviews } from '../googleReviews'

const root = join(__dirname, '..', '..', '..')
const cityPage = readFileSync(join(root, 'app/components/CityPage.vue'), 'utf8')
const faqComponent = readFileSync(join(root, 'app/components/city/Faq.vue'), 'utf8')
const cityRoute = readFileSync(join(root, 'app/pages/[city]/index.vue'), 'utf8')
const catalogSource = readFileSync(join(root, '..', '..', 'scripts/cities-data.json'), 'utf8')

const branches: BranchData[] = [
  { id: 1, code: 'BOG-1', name: 'Aeropuerto El Dorado', city: 'Bogotá' },
  { id: 2, code: 'BOG-2', name: 'Chapinero', city: 'Bogotá' },
]

describe('Alquilame city content scaffold', () => {
  it('contains exactly the 19 catalog cities and resolves by name or slug', () => {
    expect(cityContentEntries).toHaveLength(19)
    expect(new Set(cityContentEntries.map((entry) => entry.cityName)).size).toBe(19)
    expect(new Set(cityContentEntries.map((entry) => entry.citySlug)).size).toBe(19)

    for (const entry of cityContentEntries) {
      expect(useCityExpandedContent(entry.cityName)).toEqual(entry.content)
      expect(getCityMetaDescription(entry.citySlug)).toBe(entry.metaDescription)
    }
  })

  it('keeps every W1 expanded-content placeholder equal to shared logic', () => {
    for (const entry of cityContentEntries) {
      expect(entry.content).toEqual(useSharedCityExpandedContent(entry.cityName))
    }
  })

  it('keeps every W1 meta placeholder equal to the current city catalog', () => {
    const descriptions = new Map(
      [...catalogSource.matchAll(/"id": "([^"]+)",\n    "description": "([^"]*)"/g)]
        .map(([, slug, description]) => [slug, description]),
    )
    expect(descriptions.size).toBe(19)

    for (const entry of cityContentEntries) {
      expect(entry.metaDescription).toBe(descriptions.get(entry.citySlug))
    }
  })
})

describe('Alquilame city FAQ scaffold and schema parity (S3)', () => {
  it('contains 19 local FAQ files with placeholders equal to shared logic', () => {
    expect(cityFAQEntries).toHaveLength(19)

    for (const entry of cityFAQEntries) {
      expect(getCityFAQs(entry.cityName, branches)).toEqual(
        getSharedCityFAQs(entry.cityName, branches),
      )
    }

    expect(getCityFAQs('Ciudad de prueba', branches)).toEqual(
      getSharedCityFAQs('Ciudad de prueba', branches),
    )
  })

  it('builds FAQPage from exactly the same visible label/content list', () => {
    for (const entry of cityFAQEntries) {
      const visibleFAQs = getCityFAQs(entry.cityName, branches)
      const schema = buildCityFAQSchema(visibleFAQs)
      expect(schema.mainEntity.map((question) => ({
        label: question.name,
        content: question.acceptedAnswer.text,
      }))).toEqual(visibleFAQs)
    }
  })
})

describe('Alquilame-only wiring', () => {
  it('loads long content and visible FAQs from local modules', () => {
    expect(cityPage).toMatch(/from ['"]~\/data\/cityContent['"];/)
    expect(faqComponent).toMatch(/from ['"]~\/data\/cityFAQs['"];/)
  })

  it('uses local city SEO so meta copy and FAQ schema share local data', () => {
    expect(cityRoute).toMatch(/useAlquilameCityPageSEO/)
    expect(cityRoute).not.toMatch(/\buseCityPageSEO\(\)/)
  })

  it('leaves W5 review selection deterministic and empty for current fallback', () => {
    expect(googleReviews).toEqual([])
    expect(pickCityReviews('bogota')).toEqual([])
    expect(pickCityReviews('bogota')).toEqual(pickCityReviews('bogota'))
  })
})
