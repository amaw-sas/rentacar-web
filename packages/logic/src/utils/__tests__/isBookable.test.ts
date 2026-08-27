import { describe, it, expect } from 'vitest'
import { isBookable } from '../isBookable'

// The rule has to live in ONE place because of the cache, not because of tidiness.
//
// /api/rentacar-data is cached by Nitro for an hour. For up to an hour after the deploy every
// consumer will be reading a payload built BEFORE the field existed, so `bookable` arrives
// undefined. If any one selector spells the check as `city.bookable` instead of `!== false`,
// that selector empties out for an hour and every city disappears from the site.
describe('isBookable', () => {
  it('treats an explicit false as not on sale', () => {
    expect(isBookable({ bookable: false })).toBe(false)
  })

  it('treats an explicit true as on sale', () => {
    expect(isBookable({ bookable: true })).toBe(true)
  })

  // The hour after the deploy: the cached payload predates the column.
  it('treats a missing field as on sale, so a stale cached payload shows every city', () => {
    expect(isBookable({})).toBe(true)
  })

  it('treats a nullish subject as on sale rather than hiding it', () => {
    expect(isBookable(null)).toBe(true)
    expect(isBookable(undefined)).toBe(true)
  })
})
