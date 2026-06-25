/**
 * F2 step05 — city Faq.vue + Testimonios.vue (issue #112).
 *
 * Static-source assertions encoding the observable contract (full runtime/visual
 * check deferred to the F2 preview verification):
 *   - SCEN-F2-02: the city FAQ accordion keeps the CITY-SPECIFIC data
 *     (useCityFAQs(city.name) — pico y placa, El Dorado, etc.), NOT the
 *     brand-level useData().faqs that HomeFaq renders. Reusing HomeFaq would
 *     regress the city's indexable SEO content.
 *   - The FAQPage schema is NOT inlined here: it stays in useCityFAQSchema /
 *     useCityPageSEO (in [city]/index.vue), untouched.
 *   - The testimonials cards keep the CITY-SPECIFIC data (props.city.testimonials
 *     — the same array that feeds useCityAggregateRating in CityPage), NOT the
 *     brand-level franchiseTestimonials that HomeReviews renders. The heading is
 *     city-targeted ("…en {city.name}").
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

  it('does NOT inline the FAQPage schema (stays in useCityPageSEO, untouched)', () => {
    expect(faq).not.toMatch(/FAQPage/)
    expect(faq).not.toMatch(/useSchemaOrg/)
    expect(faq).not.toMatch(/defineQuestion/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(faq).toMatch(/heading-(section|card|hero)/)
  })

  it('keeps the city name in the heading (city-targeted)', () => {
    expect(faq).toMatch(/city\?\.name/)
  })
})

describe('F2 step05 — city/Testimonios.vue', () => {
  const testimonios = read('app/components/city/Testimonios.vue')

  it('sources the cards from props.city.testimonials — city-specific', () => {
    expect(testimonios).toMatch(/props\.city\?\.testimonials/)
    expect(testimonios).toMatch(/v-for="testimonio in testimonios"/)
    expect(testimonios).toMatch(/testimonio\.quote/)
  })

  it('does NOT source from the brand-level franchiseTestimonials (would swap city→brand)', () => {
    expect(testimonios).not.toMatch(/franchiseTestimonials/)
    expect(testimonios).not.toMatch(/useFetchRentacarData/)
  })

  it('uses a city-targeted heading ("…en {city.name}")', () => {
    expect(testimonios).toMatch(/en\s*\{\{\s*city\?\.name\s*\}\}/)
  })

  it('does NOT surface the mockup marketing numbers ("43 reseñas" / "5,0")', () => {
    expect(testimonios).not.toMatch(/43\s*reseñas/i)
    expect(testimonios).not.toContain('5,0')
    expect(testimonios).not.toMatch(/google\.com\/maps/)
  })

  it('does NOT inline the AggregateRating schema (stays in CityPage, untouched)', () => {
    expect(testimonios).not.toMatch(/useCityAggregateRating/)
    expect(testimonios).not.toMatch(/AggregateRating/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(testimonios).toMatch(/bg-linear-to-[a-z]/)
    expect(testimonios).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(testimonios).toMatch(/heading-(section|card|hero)/)
  })
})
