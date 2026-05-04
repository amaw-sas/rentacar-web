import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, type Ref } from 'vue'

import useStoreSearchData from '../useStoreSearchData'

// SCEN-004: store refleja admin data reactivamente tras init.
//
// Issue #10 root cause: useStoreSearchData destructures `categoriesAdminData`
// from useStoreAdminData at store init. If the rentacar-data plugin has not
// populated useState('rentacar-data') by then, the admin store captures the
// frozen sentinel ([]) — and the search store keeps that empty reference even
// after the plugin completes. The `categories` computed never recovers, so
// the no_available_categories_error path can't surface admin categories as
// "unable" placeholders, and the inline "¡Oops! Nos quedamos sin carritos…"
// block fails to render because `filteredCategories.length > 0` stays false.

const ADMIN_PAYLOAD_3_CATEGORIES = {
  categories: [
    {
      id: 'B',
      code: 'B',
      description: 'Económico',
      name: 'B',
      category: 'BÁSICO B',
      models: [],
      month_prices: {},
      total_coverage_unit_charge: 0,
    },
    {
      id: 'C',
      code: 'C',
      description: 'Compacto',
      name: 'C',
      category: 'COMPACTO C',
      models: [],
      month_prices: {},
      total_coverage_unit_charge: 0,
    },
    {
      id: 'D',
      code: 'D',
      description: 'Intermedio',
      name: 'D',
      category: 'INTERMEDIO D',
      models: [],
      month_prices: {},
      total_coverage_unit_charge: 0,
    },
  ],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

const NO_AVAILABILITY_ERROR = {
  error: 'no_available_categories_error' as const,
  message: 'Lo sentimos, No se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
}

describe('useStoreSearchData admin data reactivity (SCEN-004)', () => {
  let stateRef: Ref<typeof ADMIN_PAYLOAD_3_CATEGORIES | null>

  beforeEach(() => {
    stateRef = ref(null)
    vi.stubGlobal('useState', () => stateRef)
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('regression guard: when state is populated BEFORE init, categories surface admin data on no_available_categories_error', () => {
    stateRef.value = ADMIN_PAYLOAD_3_CATEGORIES

    const store = useStoreSearchData()
    store.error = { ...NO_AVAILABILITY_ERROR }
    store.categoriesAvailabilityData = []

    expect(store.categories.length).toBe(3)
    expect(store.categories.every((c) => c.estimatedTotalAmount === 999999999)).toBe(true)
    expect(store.filteredCategories.length).toBeGreaterThan(0)
  })

  it('SCEN-004: when state is populated AFTER init (late plugin), categories still surface admin data on no_available_categories_error', () => {
    const store = useStoreSearchData()

    stateRef.value = ADMIN_PAYLOAD_3_CATEGORIES

    store.error = { ...NO_AVAILABILITY_ERROR }
    store.categoriesAvailabilityData = []

    expect(store.categories.length).toBe(3)
    expect(store.categories.every((c) => c.estimatedTotalAmount === 999999999)).toBe(true)
    expect(store.filteredCategories.length).toBeGreaterThan(0)
  })
})
