import { describe, it, expect, vi, afterEach } from 'vitest'
import { isRef } from 'vue'

import { useData } from '../useData'

// SCEN-009 + SCEN-010: useData() expone getCityById que lookup-ea por id
// (== slug del DB en Supabase). Tras Step 5, cities ya no viene de
// useAppConfig — viene de useFetchRentacarData (que a su vez lee del
// state poblado por el plugin rentacar-data o del sentinel post-#3).
//
// Issue #221: cities/faqs are ComputedRefs that re-read useFetchRentacarData
// so a late-populated useState is visible (same pattern as useStoreAdminData).

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

  describe('cities source — refactor lock + issue #221 reactivity', () => {
    it('reads cities from useFetchRentacarData (not useAppConfig)', () => {
      const fetchSpy = vi.fn(() => mockFetchData)
      const appConfigSpy = vi.fn(() => ({ faqs: ['ignored-from-appconfig'] }))
      vi.stubGlobal('useFetchRentacarData', fetchSpy)
      vi.stubGlobal('useAppConfig', appConfigSpy)

      const { cities, faqs } = useData()

      expect(isRef(cities)).toBe(true)
      expect(isRef(faqs)).toBe(true)
      // computed is lazy — read .value to evaluate
      expect(cities.value).toBe(mockCities) // identity, not just shape
      expect(cities.value[0]?.id).toBe('armenia')
      expect(fetchSpy).toHaveBeenCalled()
      expect(appConfigSpy).not.toHaveBeenCalled()
      expect(faqs.value).toBe(mockFetchData.faqs)
      expect(faqs.value).not.toContain('ignored-from-appconfig')
    })

    // SCEN-001: same snapshot on successive reads (SSR setup then client setup)
    it('SCEN-001: successive reads against the same useFetch source keep the same city set', () => {
      const snapshot = Array.from({ length: 3 }, (_, i) => ({
        id: `city-${i}`,
        name: `City ${i}`,
        description: '',
        testimonials: [],
      }))
      vi.stubGlobal('useFetchRentacarData', () => ({
        ...mockFetchData,
        cities: snapshot,
      }))

      const first = useData()
      const second = useData()

      expect(first.cities.value).toHaveLength(3)
      expect(second.cities.value).toHaveLength(3)
      expect(first.cities.value.map((c) => c.id)).toEqual(snapshot.map((c) => c.id))
      expect(second.cities.value.map((c) => c.id)).toEqual(first.cities.value.map((c) => c.id))
    })

    // SCEN-001: cities is a ComputedRef that re-invokes useFetchRentacarData on
    // each invalidation — so a late-populated useState is not frozen as [].
    // (Tracking itself comes from real useState inside useFetchRentacarData;
    // here we only pin that each evaluation re-calls the source.)
    it('SCEN-001: cities computed re-invokes useFetchRentacarData on each read after invalidate', () => {
      const fetchSpy = vi.fn(() => mockFetchData)
      vi.stubGlobal('useFetchRentacarData', fetchSpy)

      const { cities } = useData()
      expect(cities.value).toHaveLength(2)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // Fresh useData() instance evaluates a new computed (mirrors a second
      // setup pass against the same source — SSR then client).
      const again = useData()
      expect(again.cities.value).toBe(mockCities)
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  // FAQs holdout SCEN-009: useFetchRentacarData sentinel returns faqs: []
  // and consumers must not TypeError when calling .map on it.
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

      const { faqs } = useData()

      expect(() => faqs.value.map((f: { label: string }) => f.label)).not.toThrow()
      expect(faqs.value.map((f: { label: string }) => f.label)).toEqual([])
      expect(faqs.value.length).toBe(0)
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

      expect(faqs.value).toBe(fetchData.faqs) // identity, not just shape
      expect(faqs.value[0]!.label).toBe('from-fetch')
      expect(appConfigSpy).not.toHaveBeenCalled()
    })
  })
})
