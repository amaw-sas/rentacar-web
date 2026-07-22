/**
 * Reviews (issue #112) — GOLDEN PARITY contract.
 *
 * Updated from the F1 "no marketing numbers" stance: the directive confirmed the
 * Google rating block (5,0 · 43 reseñas) is REAL data — alquilame's actual Google
 * Business profile (cid=11824841242913553901). The golden #google-reviews section
 * therefore surfaces it, and these assertions encode that golden contract:
 *   - The REAL Google rating block: "5,0", "43 reseñas verificadas en Google",
 *     the multicolor Google logo, and the "Ver reseñas en Google" CTA → the
 *     google.com/maps CID link is the legitimate brand destination.
 *   - The 3 featured cards STILL render the REAL testimonials
 *     (franchiseTestimonials[brandCode] via useFetchRentacarData), never a
 *     hardcoded testimonial array.
 *   - The section background is the golden's flat gray-100 (no gradient).
 *   - Issue #312: the AggregateRating SCHEMA (fabricated 4,9★/5★ markup) was
 *     removed site-wide — self-serving review markup is ineligible per Google's
 *     review-snippet guidelines even with real reviews. The VISUAL Google block
 *     above stays: the prohibition covers structured data, not on-page display.
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

describe('Reviews.vue — golden #google-reviews parity', () => {
  const reviews = read('app/components/home/Reviews.vue')
  // The rating/logo/CTA moved into the shared HomeGoogleRating so the city
  // testimonials sections show the same proof. Same assertions, new subject.
  const rating = read('app/components/home/GoogleRating.vue')

  it('sources the featured cards from franchiseTestimonials[brandCode] via useFetchRentacarData (same as legacy)', () => {
    expect(reviews).toMatch(/useFetchRentacarData\(\)/)
    expect(reviews).toMatch(/franchiseTestimonials\[brandCode\]/)
    expect(reviews).toMatch(/rentacarFranchise/)
  })

  it('iterates the real testimonials — no hardcoded testimonial array', () => {
    expect(reviews).toMatch(/v-for="testimonio in testimonios"/)
    expect(reviews).toMatch(/testimonio\.quote/)
    expect(reviews).toMatch(/testimonio\.user/)
  })

  it('headlines the Google block WITHOUT a review count', () => {
    // The count left the heading: it only ever grows, so a hardcoded literal
    // goes stale and reads as neglect. The 5,0 rating and the verification line
    // carry the credibility on their own.
    expect(rating).toMatch(/>\s*\{\{ heading \}\}\s*</)
    expect(rating).toMatch(/heading\?:\s*string/)
    expect(rating).toContain("'Reseñas verificadas en Google'")
    expect(rating).not.toMatch(/\d+\s+reseñas/i)
    expect(rating).toContain('5,0')
    expect(rating).toMatch(/Verificadas con autor y fecha/)
  })

  it('links to the real Google Business reviews profile + CTA', () => {
    expect(rating).toMatch(/google\.com\/maps\?cid=11824841242913553901/)
    expect(rating).toMatch(/Ver reseñas en Google/)
    // The testimonial cards still deep-link to the same profile.
    expect(reviews).toMatch(/google\.com\/maps\?cid=11824841242913553901/)
  })

  it('renders the multicolor Google logo (real brand colors, not a brand button)', () => {
    expect(rating).toContain('#EA4335') // red
    expect(rating).toContain('#4285F4') // blue
    expect(rating).toContain('#FBBC05') // yellow
    expect(rating).toContain('#34A853') // green
  })

  it('surfaces no aggregate-rating SCHEMA composable here (removed site-wide, #312)', () => {
    expect(reviews).not.toMatch(/useHomeAggregateRating/)
    expect(reviews).not.toMatch(/AggregateRating/)
  })

  it('renders the golden card look (white rounded-2xl bordered cards with star row + initials avatar)', () => {
    expect(reviews).toMatch(/rounded-2xl/)
    expect(reviews).toMatch(/<StarIcon\b/)
    expect(reviews).toMatch(/circulo-rojo\.svg/)
    expect(reviews).toMatch(/initials\(/)
  })

  it('uses the golden flat gray-100 background and the brand red token #CC022B (no gradient)', () => {
    expect(reviews).toMatch(/bg-gray-100/)
    // The CTA moved to the shared block and now uses the brand TOKEN
    // (bg-brand-600 === #CC022B) instead of the raw hex.
    expect(rating).toMatch(/bg-brand-600/)
    expect(reviews).not.toMatch(BROKEN_V3_GRADIENT)
  })
})

describe('Reviews — index.vue no longer emits AggregateRating (issue #312)', () => {
  const index = read('app/pages/index.vue')

  it('does NOT call useHomeAggregateRating() (fabricated-rating schema removed)', () => {
    expect(index).not.toMatch(/useHomeAggregateRating/)
    expect(index).not.toMatch(/AggregateRating/)
  })
})
