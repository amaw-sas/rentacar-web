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
 *   - No-regression: index.vue keeps calling useHomeAggregateRating() unchanged.
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

  it('renders the REAL Google rating block (5,0 · 43 reseñas verificadas en Google)', () => {
    expect(reviews).toContain('5,0')
    expect(reviews).toMatch(/43 reseñas verificadas en Google/)
    expect(reviews).toMatch(/Verificadas con autor y fecha/)
  })

  it('links to the real Google Business reviews profile + CTA', () => {
    expect(reviews).toMatch(/google\.com\/maps\?cid=11824841242913553901/)
    expect(reviews).toMatch(/Ver reseñas en Google/)
  })

  it('renders the multicolor Google logo (real brand colors, not a brand button)', () => {
    expect(reviews).toContain('#EA4335') // red
    expect(reviews).toContain('#4285F4') // blue
    expect(reviews).toContain('#FBBC05') // yellow
    expect(reviews).toContain('#34A853') // green
  })

  it('surfaces no aggregate-rating SCHEMA composable here (debt stays in index.vue)', () => {
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
    expect(reviews).toContain('#CC022B')
    expect(reviews).not.toMatch(BROKEN_V3_GRADIENT)
  })
})

describe('Reviews — index.vue keeps AggregateRating without regression', () => {
  const index = read('app/pages/index.vue')

  it('still calls useHomeAggregateRating() (pre-existing debt, untouched)', () => {
    expect(index).toMatch(/useHomeAggregateRating\(\)/)
  })
})
