import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { googleReviews, pickCityReviews } from '../googleReviews'

interface ExportedGoogleReview {
  name: string
  stars: string
  when: string
  text: string
}

const exportPath = fileURLToPath(
  new URL('../../../../../docs/seo/alquilame/data/gmaps-reviews-2026-07-27.json', import.meta.url),
)
const exportedReviews = JSON.parse(
  readFileSync(exportPath, 'utf8'),
) as ExportedGoogleReview[]

const CITY_SLUGS = [
  'armenia',
  'barranquilla',
  'bogota',
  'bucaramanga',
  'cali',
  'cartagena',
  'cucuta',
  'floridablanca',
  'ibague',
  'manizales',
  'medellin',
  'monteria',
  'neiva',
  'palmira',
  'pereira',
  'santa-marta',
  'soledad',
  'valledupar',
  'villavicencio',
] as const

describe('Google reviews — audited source (S2)', () => {
  it('contains a curated set of 20–25 unique, five-star customer reviews', () => {
    expect(googleReviews.length).toBeGreaterThanOrEqual(20)
    expect(googleReviews.length).toBeLessThanOrEqual(25)
    expect(new Set(googleReviews.map(({ name }) => name)).size).toBe(googleReviews.length)
    expect(googleReviews.every(({ rating }) => rating === 5)).toBe(true)
  })

  it('keeps every customer name, quote and relative date verbatim from the export', () => {
    for (const review of googleReviews) {
      const exported = exportedReviews.find(({ name }) => name === review.name)

      expect(exported, `missing exported review for ${review.name}`).toBeDefined()
      expect(exported!.stars.replace(/\s/g, ' ')).toBe('5 estrellas')
      expect(review.quote).toBe(exported!.text)
      expect(review.relativeDate).toBe(exported!.when)
    }
  })

  it('excludes owner replies accidentally captured as review text', () => {
    const ownerReplyStart = /^(?:¡Gracias|¡Hola|Gracias por calificarnos|¡Buenos dias|Hola Liliana|¡Muchas gracias por tu excelente calificación)/
    const ownerReplyNames = new Set(
      exportedReviews
        .filter(({ text }) => ownerReplyStart.test(text))
        .map(({ name }) => name),
    )

    expect(ownerReplyNames.size).toBe(13)
    expect(googleReviews.some(({ name }) => ownerReplyNames.has(name))).toBe(false)
  })
})

describe('Google reviews — deterministic city selection (S7)', () => {
  it('returns three stable reviews and a different trio for every city', () => {
    const signatures = CITY_SLUGS.map((slug) => {
      const first = pickCityReviews(slug)
      const second = pickCityReviews(slug)

      expect(first).toHaveLength(3)
      expect(second).toEqual(first)
      return first.map(({ name }) => name).sort().join('|')
    })

    expect(new Set(signatures).size).toBe(CITY_SLUGS.length)
  })

  it('pins the two reviews that explicitly mention their rental city', () => {
    expect(pickCityReviews('santa-marta').map(({ name }) => name)).toContain(
      'Gael Joaquín Vargas Moreno',
    )
    expect(pickCityReviews('monteria').map(({ name }) => name)).toContain(
      'Daniela Madrid',
    )
  })

  it('does not present those location-specific reviews on another city page', () => {
    const otherCities = CITY_SLUGS.filter(
      (slug) => slug !== 'santa-marta' && slug !== 'monteria',
    )
    const otherNames = otherCities.flatMap((slug) =>
      pickCityReviews(slug).map(({ name }) => name),
    )

    expect(otherNames).not.toContain('Gael Joaquín Vargas Moreno')
    expect(otherNames).not.toContain('Daniela Madrid')
  })
})
