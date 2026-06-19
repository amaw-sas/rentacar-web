import { describe, it, expect, vi, afterEach } from 'vitest'

import { useCityCount, FALLBACK_CITY_COUNT } from '../useCityCount'

// SCEN-003 (city-count-derivation): the marketing "N ciudades" figure must be
// DERIVED from the live active-cities list (Supabase via useFetchRentacarData),
// not a hardcoded literal — so it self-corrects when operators add/remove a
// city. The fallback guards a degraded/empty state so the site never renders
// "0 ciudades".

function stubCities(cities: unknown) {
  vi.stubGlobal('useFetchRentacarData', () => ({
    categories: [],
    branches: [],
    extras: undefined,
    vehicleCategories: {},
    cities,
    faqs: [],
    franchiseTestimonials: {},
  }))
}

describe('useCityCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the live active-city count (20)', () => {
    stubCities(Array.from({ length: 20 }, (_, i) => ({ id: String(i) })))
    expect(useCityCount().value).toBe(20)
  })

  it('self-updates when a city is added (21)', () => {
    stubCities(Array.from({ length: 21 }, (_, i) => ({ id: String(i) })))
    expect(useCityCount().value).toBe(21)
  })

  it('falls back to a positive count (never 0) when cities is empty', () => {
    stubCities([])
    expect(useCityCount().value).toBe(FALLBACK_CITY_COUNT)
    expect(useCityCount().value).toBeGreaterThan(0)
  })

  it('falls back when data is unavailable (cities undefined)', () => {
    stubCities(undefined)
    expect(useCityCount().value).toBe(FALLBACK_CITY_COUNT)
  })
})
