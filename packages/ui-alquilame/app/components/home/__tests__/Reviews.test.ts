/**
 * F1 step05 — Reviews (issue #112).
 *
 * Static-source assertions encoding the observable reviews contract (full
 * runtime/visual check deferred to the F1 preview verification):
 *   - SCEN-F1-05: the section renders the REAL testimonials
 *     (franchiseTestimonials[brandCode] via useFetchRentacarData) in the design's
 *     review-card look, and contains NONE of the mockup's hardcoded marketing
 *     numbers ("43 reseñas", "5,0").
 *   - The data source is identical to the legacy #testimonios — never a
 *     hardcoded testimonial array.
 *   - Gradient guard (F0 lesson): the section MUST use the v4 `bg-linear-to-*`
 *     utility, NEVER the broken v3 `bg-gradient-to-*` alias.
 *   - Headings adopt the `.heading-*` utilities (Plus Jakarta).
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

describe('F1 step05 — Reviews.vue', () => {
  const reviews = read('app/components/home/Reviews.vue')

  it('sources testimonials from franchiseTestimonials[brandCode] via useFetchRentacarData (same as legacy)', () => {
    expect(reviews).toMatch(/useFetchRentacarData\(\)/)
    expect(reviews).toMatch(/franchiseTestimonials\[brandCode\]/)
    expect(reviews).toMatch(/rentacarFranchise/)
  })

  it('iterates the real testimonials — no hardcoded testimonial array', () => {
    expect(reviews).toMatch(/v-for="testimonio in testimonios"/)
    expect(reviews).toMatch(/testimonio\.quote/)
    expect(reviews).toMatch(/testimonio\.user/)
  })

  it('does NOT reproduce the mockup marketing numbers ("43 reseñas" / "5,0")', () => {
    expect(reviews).not.toMatch(/43\s*reseñas/i)
    expect(reviews).not.toContain('5,0')
    // No Google-maps CID review links nor "Local Guide" fiction from the build.
    expect(reviews).not.toMatch(/google\.com\/maps/)
    expect(reviews).not.toMatch(/Local Guide/i)
  })

  it('surfaces no aggregate-rating number (debt stays in index.vue, untouched)', () => {
    expect(reviews).not.toMatch(/useHomeAggregateRating/)
    expect(reviews).not.toMatch(/AggregateRating/)
  })

  it('renders the design review-card look (white rounded-2xl bordered cards with star row)', () => {
    expect(reviews).toMatch(/rounded-2xl/)
    expect(reviews).toMatch(/<StarIcon\b/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(reviews).toMatch(/bg-linear-to-[a-z]/)
    expect(reviews).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(reviews).toMatch(/heading-(section|card)/)
  })

  it('reserves avatar space (CLS) before the lazy avatar loads', () => {
    expect(reviews).toMatch(/min-h-\[48px\]/)
  })
})

describe('F1 step05 — index.vue keeps AggregateRating without regression', () => {
  const index = read('app/pages/index.vue')

  it('still calls useHomeAggregateRating() (pre-existing debt, untouched by F1)', () => {
    expect(index).toMatch(/useHomeAggregateRating\(\)/)
  })
})
