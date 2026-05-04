import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'

import useStoreAdminData from '../useStoreAdminData'

// SCEN-004: when useState('rentacar-data') is null, useStoreAdminData()
// factory must NOT throw. Pre-fix the throw inside useFetchRentacarData
// corrupted the Pinia registry — once the factory threw, the store was
// never registered, so every subsequent access also threw. Sentinel
// from useFetchRentacarData (SCEN-003) lets the factory complete.

describe('useStoreAdminData', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('SCEN-004: factory does not throw with empty state', () => {
    it('creates the store without throwing', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      expect(() => useStoreAdminData()).not.toThrow()
    })

    it('sortedBranches is an empty array when state is null', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const store = useStoreAdminData()

      expect(store.sortedBranches).toEqual([])
    })

    it('searchBranchByCode returns undefined for any input when state is null', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const store = useStoreAdminData()

      expect(store.searchBranchByCode('XYZ')).toBeUndefined()
      expect(store.searchBranchByCode('BOG-01')).toBeUndefined()
    })

    it('searchBranchBySlugOrCode returns undefined for any input when state is null', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const store = useStoreAdminData()

      expect(store.searchBranchBySlugOrCode('bogota-aeropuerto')).toBeUndefined()
      expect(store.searchBranchBySlugOrCode('any-slug')).toBeUndefined()
    })

    it('isBranchCode and isBranchSlug return false for any input when state is null', () => {
      vi.stubGlobal('useState', () => ({ value: null }))

      const store = useStoreAdminData()

      expect(store.isBranchCode('XYZ')).toBe(false)
      expect(store.isBranchSlug('any-slug')).toBe(false)
    })
  })

  describe('SCEN-004: factory works correctly with populated state (regression guard)', () => {
    it('sortedBranches contains populated branches sorted by name', () => {
      const populated = {
        categories: [],
        branches: [
          { id: 1, code: 'MED-01', name: 'Medellín Centro', city: 'medellin', slug: 'medellin-centro', schedule: '' },
          { id: 2, code: 'BOG-01', name: 'Bogotá Aeropuerto', city: 'bogota', slug: 'bogota-aeropuerto', schedule: '' },
        ],
        extras: undefined,
        vehicleCategories: {},
      }
      vi.stubGlobal('useState', () => ({ value: populated }))

      const store = useStoreAdminData()

      expect(store.sortedBranches).toHaveLength(2)
      expect(store.sortedBranches[0].name).toBe('Bogotá Aeropuerto')
      expect(store.sortedBranches[1].name).toBe('Medellín Centro')
    })

    it('searchBranchByCode finds populated branches', () => {
      const populated = {
        categories: [],
        branches: [
          { id: 1, code: 'BOG-01', name: 'Bogotá Aeropuerto', city: 'bogota', slug: 'bogota-aeropuerto', schedule: '' },
        ],
        extras: undefined,
        vehicleCategories: {},
      }
      vi.stubGlobal('useState', () => ({ value: populated }))

      const store = useStoreAdminData()

      expect(store.searchBranchByCode('BOG-01')?.name).toBe('Bogotá Aeropuerto')
      expect(store.searchBranchByCode('XYZ')).toBeUndefined()
    })
  })
})
