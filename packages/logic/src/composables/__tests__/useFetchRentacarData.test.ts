import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import useFetchRentacarData from '../useFetchRentacarData'

// SCEN-003 + SCEN-006: when useState('rentacar-data') is null (anomalous
// case e.g. dev HMR or hydration mismatch), useFetchRentacarData() must
// return a frozen empty sentinel instead of throwing. The throw used to
// corrupt the Pinia factory of useStoreAdminData (issue #3) and crash
// every direct consumer (useCategory, useLocalBusiness, useCityProductSchema,
// ReservationResume.vue, CategorySelectionSection.vue).

describe('useFetchRentacarData', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('SCEN-003: sentinel when state is null', () => {
    it('returns empty sentinel without throwing when useState value is null', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const result = useFetchRentacarData()

      expect(result).toEqual({
        categories: [],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
        franchiseTestimonials: {},
      })
    })

    it('returns the same sentinel reference across invocations (constant)', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const a = useFetchRentacarData()
      const b = useFetchRentacarData()

      expect(a).toBe(b)
    })

    it('returns the populated value when useState value is non-null', () => {
      const populated = {
        categories: [{ id: 'B' }],
        branches: [{ code: 'BOG-01' }],
        extras: { extraDriverDayPrice: 12000 },
        vehicleCategories: { B: {} },
      }
      vi.stubGlobal('useState', () => ({ value: populated }))

      const result = useFetchRentacarData()

      expect(result).toBe(populated)
    })
  })

  describe('SCEN-006: sentinel is immutable', () => {
    it('Object.isFrozen returns true on the sentinel', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const result = useFetchRentacarData()

      expect(Object.isFrozen(result)).toBe(true)
    })

    it('mutating sentinel.branches.push throws TypeError in strict mode (ESM default)', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const result = useFetchRentacarData()

      expect(() => {
        result.branches.push({ id: 99 } as never)
      }).toThrow(TypeError)
    })
  })
})
