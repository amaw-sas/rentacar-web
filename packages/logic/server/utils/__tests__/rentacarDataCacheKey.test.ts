import { describe, it, expect } from 'vitest'
import { rentacarDataCacheKey } from '../rentacarDataCacheKey'

// SCEN-C1: the rentacar-data cache key is derived from the build's app.buildId,
// so a restored cross-build entry (different buildId) can never collide with the
// current build's key. An empty buildId must fail loud rather than silently
// collapse every build onto one shared key (which would re-create the leak).
describe('rentacarDataCacheKey (SCEN-C1)', () => {
  it('returns the buildId as the cache key', () => {
    expect(rentacarDataCacheKey('build-A')).toBe('build-A')
  })

  it('yields distinct keys for distinct buildIds (no cross-build collision)', () => {
    expect(rentacarDataCacheKey('build-A')).not.toBe(rentacarDataCacheKey('build-B'))
  })

  it('is stable for the same buildId (within-deploy cache reuse)', () => {
    expect(rentacarDataCacheKey('build-A')).toBe(rentacarDataCacheKey('build-A'))
  })

  it('throws on an empty buildId (refuses a shared key)', () => {
    expect(() => rentacarDataCacheKey('')).toThrow()
  })

  it('throws on a non-string buildId (defensive against a missing runtimeConfig)', () => {
    // @ts-expect-error — exercising the runtime guard for an absent buildId
    expect(() => rentacarDataCacheKey(undefined)).toThrow()
  })
})
