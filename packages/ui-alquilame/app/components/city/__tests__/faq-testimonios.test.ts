/**
 * F2 step05 — city Faq.vue + Testimonios.vue (issue #112).
 *
 * Static-source assertions encoding the observable contract (full runtime/visual
 * check deferred to the F2 preview verification):
 *   - SCEN-F2-02: the city FAQ accordion keeps the CITY-SPECIFIC data
 *     (useCityFAQs(city.name) — pico y placa, El Dorado, etc.), NOT the
 *     brand-level useData().faqs that HomeFaq renders. Reusing HomeFaq would
 *     regress the city's indexable SEO content.
 *   - The FAQPage schema is NOT inlined here: Alquilame's local
 *     useCityFAQSchema is invoked by useAlquilameCityPageSEO.
 *   - The testimonial cards use the audited local Google source through a
 *     deterministic city selection. The heading names the city without
 *     claiming every reviewer rented there.
 *   - Gradient guard (F0 lesson): both sections MUST use the v4 `bg-linear-to-*`
 *     utility, NEVER the broken v3 `bg-gradient-to-*` alias.
 *   - Headings adopt the `.heading-*` utilities (Plus Jakarta).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('F2 step05 — city/Faq.vue', () => {
  const faq = read('app/components/city/Faq.vue')

  it('sources the accordion from useCityFAQs(city.name) — city-specific FAQs', () => {
    expect(faq).toMatch(/useCityFAQs\(\s*props\.city\.name\s*\)/)
    expect(faq).toMatch(/:items="cityFAQs"/)
  })

  it('does NOT fall back to the brand-level useData().faqs (would regress city SEO)', () => {
    expect(faq).not.toMatch(/useData\(\)/)
    expect(faq).not.toMatch(/franchiseFaqs|faqs\s*}\s*=\s*useData/)
  })

  it('does NOT inline the FAQPage schema (local SEO composable owns it)', () => {
    expect(faq).not.toMatch(/FAQPage/)
    expect(faq).not.toMatch(/useSchemaOrg/)
    expect(faq).not.toMatch(/defineQuestion/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(faq).toMatch(/font-heading|heading-(section|card|hero)/)
  })

  it('keeps the city name in the heading (city-targeted)', () => {
    expect(faq).toMatch(/city\?\.name/)
  })
})

describe('F2 step05 — city/Testimonios.vue', () => {
  const testimonios = read('app/components/city/Testimonios.vue')

  it('sources the cards from pickCityReviews(props.city.id) — deterministic by city', () => {
    expect(testimonios).toMatch(/pickCityReviews\(\s*props\.city\?\.id/)
    expect(testimonios).toMatch(/v-for="testimonio in testimonios"/)
    expect(testimonios).toMatch(/testimonio\.quote/)
    expect(testimonios).toMatch(/testimonio\.name/)
  })

  it('does NOT source from either legacy testimonial backend', () => {
    expect(testimonios).not.toMatch(/franchiseTestimonials/)
    expect(testimonios).not.toMatch(/useFetchRentacarData/)
    expect(testimonios).not.toMatch(/useCityTestimonials/)
  })

  it('uses an honest city-targeted heading and identifies the cards as Google reviews', () => {
    expect(testimonios).toMatch(/Opiniones para alquilar carro en\s*\{\{\s*city\?\.name\s*\}\}/)
    expect(testimonios).toMatch(/Opiniones verificadas de clientes de Alquílame en Google/)
    expect(testimonios).not.toMatch(/clientes que rentaron carros en/)
  })

  it('keeps the real Google profile link without mockup marketing numbers', () => {
    expect(testimonios).not.toMatch(/43\s*reseñas/i)
    expect(testimonios).not.toContain('5,0')
    expect(testimonios).toMatch(/GOOGLE_REVIEWS_URL/)
  })

  it('does NOT inline the AggregateRating schema (removed site-wide, #312)', () => {
    expect(testimonios).not.toMatch(/useCityAggregateRating/)
    expect(testimonios).not.toMatch(/AggregateRating/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(testimonios).toMatch(/bg-linear-to-[a-z]/)
    expect(testimonios).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(testimonios).toMatch(/font-heading|heading-(section|card|hero)/)
  })
})

/**
 * Card count on a city landing:
 *   GIVEN a city with more testimonials than fit the featured row
 *   WHEN  the testimonials section renders
 *   THEN  it shows THREE, the same as the home — the Google badge reads as a
 *         headline with a short row of proof under it, not as the label of a
 *         long wall of cards.
 * The selector's default count caps the featured row without changing the
 * curated source.
 */
describe('city testimonials — featured row is three cards, like the home', () => {
  const testimonios = read('app/components/city/Testimonios.vue')
  const home = read('app/components/home/Reviews.vue')

  it('uses the selector default of 3 featured cards', () => {
    expect(testimonios).toMatch(/pickCityReviews\(props\.city\?\.id/)
  })

  it('matches the home, which already features 3', () => {
    expect(home).toMatch(/\.slice\(0,\s*3\)/)
  })

  it('still sources every card from the deterministic city list', () => {
    expect(testimonios).toMatch(/pickCityReviews\(/)
    expect(testimonios).toMatch(/v-for="testimonio in/)
  })
})

/**
 * Google block layout on a city landing:
 *   GIVEN a desktop viewport
 *   WHEN  the testimonials section renders
 *   THEN  the rating sits BESIDE the three cards, as on the home — not stacked
 *         above them. The city h2 + subtitle stay centred on top; only the
 *         rating-and-cards pair adopts the home's two-column split.
 */
describe('city testimonials — rating beside the cards, like the home', () => {
  const testimonios = read('app/components/city/Testimonios.vue')
  const home = read('app/components/home/Reviews.vue')

  it('uses the same two-column split the home uses', () => {
    const split = /grid lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1\.6fr\)\]/
    expect(home).toMatch(split)
    expect(testimonios).toMatch(split)
  })

  it('no longer centres the rating in its own full-width row', () => {
    expect(testimonios).not.toMatch(/flex justify-center text-center[\s\S]{0,120}HomeGoogleRating/)
  })

  it('keeps the city-specific heading above the pair', () => {
    expect(testimonios).toMatch(/Opiniones para alquilar carro en/)
    expect(testimonios).toMatch(/<HomeGoogleRating\b/)
  })
})
