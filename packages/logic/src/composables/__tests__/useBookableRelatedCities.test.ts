import { describe, it, expect, vi, afterEach } from 'vitest'

import { useBookableRelatedCities } from '../useBookableRelatedCities'

// SCEN-008 — the notice on a switched-off city page invites the customer somewhere else.
//
// "Somewhere else" has to be somewhere we actually rent. `useRelatedCities` is a hand-written
// proximity map with no idea which cities are on sale, so sending someone from Pereira to another
// switched-off city would repeat the exact dead end the notice exists to resolve.

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

// Pereira's real neighbours, in the order the map defines them.
const CATALOG = [
  { id: 'armenia', name: 'Armenia', bookable: true },
  { id: 'manizales', name: 'Manizales', bookable: true },
  { id: 'cali', name: 'Cali', bookable: true },
  { id: 'medellin', name: 'Medellín', bookable: true },
  { id: 'pereira', name: 'Pereira', bookable: false },
]

describe('useBookableRelatedCities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('offers the two nearest cities we still rent in, with their drive times', () => {
    stubCities(CATALOG)

    expect(useBookableRelatedCities('pereira').value).toEqual([
      { id: 'armenia', name: 'Armenia', distance: '30 minutos' },
      { id: 'manizales', name: 'Manizales', distance: '45 minutos' },
    ])
  })

  it('skips a neighbour that is also switched off and takes the next one', () => {
    stubCities(CATALOG.map((c) => (c.id === 'armenia' ? { ...c, bookable: false } : c)))

    expect(useBookableRelatedCities('pereira').value.map((c) => c.id)).toEqual([
      'manizales',
      'cali',
    ])
  })

  it('returns nothing when no neighbour is on sale, so the notice keeps only its title', () => {
    stubCities(CATALOG.map((c) => ({ ...c, bookable: false })))

    expect(useBookableRelatedCities('pereira').value).toEqual([])
  })

  // A neighbour the catalog does not carry at all cannot be offered — the map is hand-written and
  // may name a city that was never published.
  it('ignores a neighbour missing from the catalog', () => {
    stubCities([{ id: 'armenia', name: 'Armenia', bookable: true }])

    expect(useBookableRelatedCities('pereira').value.map((c) => c.id)).toEqual(['armenia'])
  })

  // The hour after the deploy: the cached payload predates the column.
  it('offers neighbours normally when the payload predates the flag', () => {
    stubCities(CATALOG.map(({ bookable, ...rest }) => { void bookable; return rest }))

    expect(useBookableRelatedCities('pereira').value.map((c) => c.id)).toEqual([
      'armenia',
      'manizales',
    ])
  })

  it('returns nothing for a city with no neighbours defined', () => {
    stubCities(CATALOG)

    expect(useBookableRelatedCities('ciudad-inventada').value).toEqual([])
  })
})
