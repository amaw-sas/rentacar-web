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
      const appConfigSpy = vi.fn(() => ({ faqs: ['faq-1'] }))
      vi.stubGlobal('useFetchRentacarData', fetchSpy)
      vi.stubGlobal('useAppConfig', appConfigSpy)

      const { cities, faqs } = useData()

      expect(fetchSpy).toHaveBeenCalled()
      expect(appConfigSpy).toHaveBeenCalled()
      expect(cities).toBe(mockCities) // identity, not just shape
      expect(faqs).toEqual(['faq-1'])
    })
  })
})
