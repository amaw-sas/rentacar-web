import { describe, it, expect, vi, afterEach } from 'vitest'

import { useCityCount } from '../useCityCount'
import { SERVICE_CITIES } from '../../utils/serviceCities'

// AMENDED for issue #221 (see the AMEND note in
// docs/specs/city-count-derivation/scenarios/city-count-derivation.scenarios.md).
// The count is now derived from the deterministic SERVICE_CITIES source of truth,
// not live Supabase data — live derivation caused intermittent hydration
// mismatches on ISR pages. The durable operator-#3 invariant is preserved: the
// figure comes from ONE guarded source, never a scattered hardcoded literal.

describe('useCityCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the SERVICE_CITIES count (deterministic, 19)', () => {
    expect(useCityCount().value).toBe(SERVICE_CITIES.length)
    expect(useCityCount().value).toBe(19)
  })

  it('does NOT read live rentacar-data (drift-proof for SSR/ISR hydration)', () => {
    // If the count still read the live list, this stub would change the result.
    // It must be ignored now — the value tracks SERVICE_CITIES only.
    vi.stubGlobal('useFetchRentacarData', () => ({
      categories: [],
      branches: [],
      extras: undefined,
      vehicleCategories: {},
      cities: Array.from({ length: 3 }, (_, i) => ({ id: String(i) })),
      faqs: [],
      franchiseTestimonials: {},
    }))
    expect(useCityCount().value).toBe(SERVICE_CITIES.length)
  })

  it('is always a positive plural count (never 0 "ciudades")', () => {
    expect(useCityCount().value).toBeGreaterThan(1)
  })
})
