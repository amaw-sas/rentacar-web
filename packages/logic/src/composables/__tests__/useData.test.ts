import { describe, it, expect, vi, afterEach } from 'vitest'

import { useData } from '../useData'

// SCEN-009 + SCEN-010: useData() expone getCityById que lookup-ea por id
// (== slug del DB en Supabase). Tras Step 5, cities ya no viene de
// useAppConfig — viene de useFetchRentacarData (que a su vez lee del
// state poblado por el plugin rentacar-data o del sentinel post-#3).
//
// El test mock-ea useFetchRentacarData con cities pobladas y useAppConfig
// con faqs. Si useData siguiera leyendo cities de useAppConfig
// (pre-refactor), las cities estarían undefined → TypeError en
// cities.find → test fail.

const mockCities = [
  { id: 'armenia', name: 'Armenia', description: 'capital del Quindío', testimonials: [] },
  { id: 'bogota', name: 'Bogotá', description: 'capital de Colombia', testimonials: [] },
]

const mockFetchData = {
  categories: [],
  branches: [],
  extras: undefined,
  vehicleCategories: {},
  cities: mockCities,
  faqs: [],
}

describe('useData', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('SCEN-009: getCityById resolves exact slug match', () => {
    it('returns the city matching id case-sensitively', () => {
      vi.stubGlobal('useFetchRentacarData', () => mockFetchData)
      vi.stubGlobal('useAppConfig', () => ({ faqs: [] }))

      const { getCityById } = useData()
      const result = getCityById('armenia')

      expect(result).toBeDefined()
      expect(result?.id).toBe('armenia')
      expect(result?.name).toBe('Armenia')
    })

    it('returns the second city when looked up by its id', () => {
      vi.stubGlobal('useFetchRentacarData', () => mockFetchData)
      vi.stubGlobal('useAppConfig', () => ({ faqs: [] }))

      const { getCityById } = useData()
      const result = getCityById('bogota')

      expect(result?.name).toBe('Bogotá')
    })
  })

  describe('SCEN-010: getCityById returns undefined on case mismatch', () => {
    it('does not resolve when id casing differs from canonical slug', () => {
      vi.stubGlobal('useFetchRentacarData', () => mockFetchData)
      vi.stubGlobal('useAppConfig', () => ({ faqs: [] }))

      const { getCityById } = useData()
      const result = getCityById('Armenia')

      expect(result).toBeUndefined()
    })

    it('returns undefined for non-existent slug', () => {
      vi.stubGlobal('useFetchRentacarData', () => mockFetchData)
      vi.stubGlobal('useAppConfig', () => ({ faqs: [] }))

      const { getCityById } = useData()
      const result = getCityById('xanadu')

      expect(result).toBeUndefined()
    })
  })

  describe('cities source — refactor lock', () => {
    it('reads cities from useFetchRentacarData (not useAppConfig)', () => {
      const fetchSpy = vi.fn(() => mockFetchData)
      const appConfigSpy = vi.fn(() => ({ faqs: ['ignored-from-appconfig'] }))
      vi.stubGlobal('useFetchRentacarData', fetchSpy)
      vi.stubGlobal('useAppConfig', appConfigSpy)

      const { cities, faqs } = useData()

      expect(fetchSpy).toHaveBeenCalled()
      expect(cities).toBe(mockCities) // identity, not just shape
      expect(cities[0]?.id).toBe('armenia')
      // useAppConfig is no longer called by useData (faqs migrated to
      // useFetchRentacarData in #12 step 5). Cities never came from it.
      expect(appConfigSpy).not.toHaveBeenCalled()
      // Strengthens the contract: faqs comes from useFetchRentacarData,
      // never from the appConfig stub.
      expect(faqs).toBe(mockFetchData.faqs)
      expect(faqs).not.toContain('ignored-from-appconfig')
    })
  })

  // FAQs holdout SCEN-009: useFetchRentacarData sentinel returns faqs: []
  // and consumers must not TypeError when calling .map on it. This pins
  // both that faqs source is useFetchRentacarData (not useAppConfig) AND
  // that the sentinel shape is consumable safely.
  describe('FAQs SCEN-009: sentinel safety — faqs:[] does not TypeError', () => {
    it('returns frozen empty array from sentinel without throwing on .map', () => {
      const sentinel = {
        categories: Object.freeze([]),
        branches: Object.freeze([]),
        extras: undefined,
        vehicleCategories: Object.freeze({}),
        cities: Object.freeze([]),
        faqs: Object.freeze([]),
      }
      vi.stubGlobal('useFetchRentacarData', () => sentinel)
      // Do NOT mock useAppConfig — post-refactor, useData should not depend on it.

      const { faqs } = useData()

      expect(() => faqs.map((f: { label: string }) => f.label)).not.toThrow()
      expect(faqs.map((f: { label: string }) => f.label)).toEqual([])
      expect(faqs.length).toBe(0)
    })

    it('reads faqs from useFetchRentacarData (not useAppConfig) — refactor lock', () => {
      const fetchData = {
        categories: [],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
        faqs: [{ label: 'from-fetch', content: 'expected source' }],
      }
      const appConfigFaqs = [{ label: 'from-appconfig', content: 'wrong source' }]
      const fetchSpy = vi.fn(() => fetchData)
      const appConfigSpy = vi.fn(() => ({ faqs: appConfigFaqs }))
      vi.stubGlobal('useFetchRentacarData', fetchSpy)
      vi.stubGlobal('useAppConfig', appConfigSpy)

      const { faqs } = useData()

      expect(faqs).toBe(fetchData.faqs) // identity, not just shape
      expect(faqs[0].label).toBe('from-fetch')
      expect(appConfigSpy).not.toHaveBeenCalled()
    })
  })
})
