import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #54: on monthly + no_available_categories_error (LLNRAG009) the
// `categories` computed surfaced ALL admin categories as unable cards,
// including the monthly-excluded ones (FU/FL/GL/LU). The monthly *success*
// path already filters them out (useStoreSearchData.ts), but the LLNRAG009
// branch did not. Non-monthly must keep surfacing every category.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const baseCategory = (id: string, name: string, category: string) => ({
  id,
  code: id,
  identification: id,
  description: name,
  name,
  category,
  models: [],
  month_prices: {},
  total_coverage_unit_charge: 0,
  image: '',
  ad: '',
  extra_km_charge: 0,
})

// Includes FU, a monthly-excluded code, alongside two regular ones.
const ADMIN_PAYLOAD = {
  categories: [
    baseCategory('B', 'Económico', 'BÁSICO B'),
    baseCategory('C', 'Compacto', 'COMPACTO C'),
    baseCategory('FU', 'Furgón', 'FURGÓN FU'),
  ],
  branches: [],
  extras: undefined,
  vehicleCategories: {},
}

const LLNRAG009 = {
  error: 'no_available_categories_error' as const,
  message: 'Lo sentimos, no se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
}

describe('useStoreSearchData LLNRAG009 monthly exclusion (#54)', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref(null), error: ref({ ...LLNRAG009 }) })
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('monthly + LLNRAG009 excludes monthly-only categories (FU) from unable cards', async () => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    useStoreReservationForm().haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()
    await searchStore.search()

    const codes = searchStore.categories.map((c) => c.categoryCode).sort()
    expect(codes).toEqual(['B', 'C'])
    expect(searchStore.categories.every((c) => c.estimatedTotalAmount === 999999999)).toBe(true)
  })

  it('non-monthly + LLNRAG009 still surfaces every admin category (regression guard)', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()
    await searchStore.search()

    const codes = searchStore.categories.map((c) => c.categoryCode).sort()
    expect(codes).toEqual(['B', 'C', 'FU'])
  })
})
