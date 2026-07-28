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
const googleReviewsSource = readFileSync(
  fileURLToPath(new URL('../googleReviews.ts', import.meta.url)),
  'utf8',
)

const REMOVED_REVIEWERS = [
  'Cindy Perez',
  'Jorge MAL',
  'Jesús Arias',
  'Roberto Liguori',
] as const

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
  it('contains 24 unique, five-star customer reviews', () => {
    expect(googleReviews).toHaveLength(24)
    expect(new Set(googleReviews.map(({ name }) => name)).size).toBe(googleReviews.length)
    expect(googleReviews.every(({ rating }) => rating === 5)).toBe(true)
    expect(googleReviews.map(({ name }) => name)).not.toContain('Raul Ramirez')
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

  it('excludes the four reviews removed during adversarial curation', () => {
    const curatedNames = googleReviews.map(({ name }) => name)

    for (const name of REMOVED_REVIEWERS) {
      expect(curatedNames).not.toContain(name)
    }
  })

  it('types pinned names from the curated array so stale pins fail compilation', () => {
    expect(googleReviewsSource).toMatch(
      /type CuratedGoogleReviewName\s*=\s*\(typeof googleReviews\)\[number\]\['name'\]/,
    )
    expect(googleReviewsSource).toMatch(
      /satisfies Readonly<Record<string, CuratedGoogleReviewName>>/,
    )
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

  it('keeps every pair of known cities to at most one shared reviewer', () => {
    const selections = CITY_SLUGS.map((slug) => ({
      slug,
      names: new Set(pickCityReviews(slug).map(({ name }) => name)),
    }))

    for (let left = 0; left < selections.length; left += 1) {
      for (let right = left + 1; right < selections.length; right += 1) {
        const first = selections[left]!
        const second = selections[right]!
        const overlap = [...first.names].filter((name) => second.names.has(name))

        expect(
          overlap.length,
          `${first.slug} and ${second.slug} share ${overlap.join(', ')}`,
        ).toBeLessThanOrEqual(1)
      }
    }
  })
})
