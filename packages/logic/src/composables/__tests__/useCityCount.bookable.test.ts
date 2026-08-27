import { describe, it, expect, vi, afterEach } from 'vitest'

import { useCityCount, FALLBACK_CITY_COUNT } from '../useCityCount'

// SCEN-010 — the marketing figure counts cities we actually RENT IN, not cities that have a page.
//
// This is the one number the whole site quotes ("Operamos en N ciudades"), and it feeds thirteen
// call sites across the three brands. A city kept published so its page survives must not keep
// inflating it: saying we operate in 19 while refusing bookings in one of them is a claim we
// cannot back.

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

const nineteen = (offCount: number) =>
  Array.from({ length: 19 }, (_, i) => ({
    id: String(i),
    bookable: i >= offCount,
  }))

describe('useCityCount — bookable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leaves a switched-off city out of the figure', () => {
    stubCities(nineteen(1))
    expect(useCityCount().value).toBe(18)
  })

  it('counts every city when none is switched off', () => {
    stubCities(nineteen(0))
    expect(useCityCount().value).toBe(19)
  })

  // The hour after the deploy: the cached payload predates the column. Reading absent as "off"
  // would drop the headline figure to zero and then to the fallback — a number that contradicts
  // the city grid rendered right beside it.
  it('counts every city when the payload predates the flag', () => {
    stubCities(Array.from({ length: 19 }, (_, i) => ({ id: String(i) })))
    expect(useCityCount().value).toBe(19)
  })

  // The degraded path is about the list being UNAVAILABLE, which is not the same as every city
  // being off. Keep the two apart: an empty payload still shows the fallback, never a 0.
  it('still shows the fallback when the list never loaded', () => {
    stubCities([])
    expect(useCityCount().value).toBe(FALLBACK_CITY_COUNT)
  })

  it('still shows the fallback when the state is null', () => {
    stubCities(undefined)
    expect(useCityCount().value).toBe(FALLBACK_CITY_COUNT)
  })
})
