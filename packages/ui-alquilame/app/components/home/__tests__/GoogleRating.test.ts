/**
 * GoogleRating — the 5,0 + stars + Google logo trust block, extracted so the
 * home reviews section and every CITY testimonials section show the same proof.
 *
 * Why it matters: the 19 city landings are the pages competing for "alquiler de
 * carros en {ciudad}" and they carried NO Google signal at all — the strongest
 * social proof we have was missing exactly where it is most needed.
 *
 * Contract:
 *   - real data only: the 5,0 rating and the real Business profile link;
 *   - NO review count (it goes stale — same decision as the heading and footer);
 *   - one source of truth: home and city both mount this, neither re-inlines it.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

const rating = read('app/components/home/GoogleRating.vue')
const reviews = read('app/components/home/Reviews.vue')
const cityTestimonios = read('app/components/city/Testimonios.vue')

describe('GoogleRating.vue — shared trust block', () => {
  it('shows the real rating and links the real Business profile', () => {
    expect(rating).toContain('5,0')
    expect(rating).toMatch(/google\.com\/maps\?cid=11824841242913553901/)
    expect(rating).toMatch(/Ver reseñas en Google/)
  })

  it('carries NO review count', () => {
    expect(rating).not.toMatch(/\d+\s+reseñas/)
  })

  it('lets the caller title it, so a city can name itself', () => {
    expect(rating).toMatch(/heading/)
  })
})

describe('both surfaces mount the shared block — no second copy', () => {
  it('the home reviews section uses it instead of inlining the rating', () => {
    expect(reviews).toMatch(/<HomeGoogleRating\b/)
    expect(reviews).not.toContain('5,0')
  })

  it('the city testimonials section shows it too', () => {
    expect(cityTestimonios).toMatch(/<HomeGoogleRating\b/)
  })
})
