/**
 * Operator correction #7 — google-reviews section padding holdout guard.
 *
 * Encodes SCEN-003 of
 * docs/specs/reviews-section-padding/scenarios/reviews-section-padding.scenarios.md:
 * the #google-reviews section must use defined padding utilities, not the
 * undefined `section-padding` class that rendered 0px padding and left the CTA
 * flush against the next section on desktop.
 *
 * The runtime geometry (SCEN-001/002/004) is verified in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REVIEWS = join(__dirname, '..', 'app/components/home/Reviews.vue')

describe('SCEN-003: reviews section uses defined padding, not the phantom class', () => {
  const src = readFileSync(REVIEWS, 'utf-8')

  it('does not reference the undefined `section-padding` utility', () => {
    // Match the class only as a CSS utility token (in a class="..." list),
    // not the word inside an explanatory comment.
    expect(src).not.toMatch(/class="[^"]*\bsection-padding\b/)
  })

  it('the #google-reviews section uses the project py-12 md:py-16 rhythm', () => {
    const sectionTag = src.match(/<section id="google-reviews"[^>]*>/)
    expect(sectionTag, 'google-reviews section tag not found').not.toBeNull()
    expect(sectionTag![0]).toMatch(/\bpy-12\b/)
    expect(sectionTag![0]).toMatch(/\bmd:py-16\b/)
  })
})
