import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// SCEN-U1, U2, U4: when Localiza responds with no_available_categories_error
// (LLNRAG009), the search store must surface ALL admin categories as unable
// (sentinel 999999999) regardless of haveMonthlyReservation. The monthly
// branch was leaving categoriesAvailabilityData = null and the categories
// computed required it truthy, so monthly + LLNRAG009 returned [] — no grid
// of grayed cards under the inline "¡Oops!" block.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

// Issue #28 Ola A: monthly exclusion is derived from pricing. B, C, D all offer
// monthly (positive active row), so monthly + LLNRAG009 surfaces all three as
// unable cards (SCEN-U2). An active row cleared to 0 would be the non-monthly
// shape (mig. 042).
const monthlyRow = (kms: number) => ({
  '1k_kms': kms,
  '2k_kms': kms,
  '3k_kms': kms,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 0,
  one_day_price: 0,
  status: 'active' as const,
})

const baseCategory = (id: string, name: string, category: string) => ({
  id,
  code: id,
  identification: id,
  description: name,
  name,
  category,
  models: [],
  month_prices: [monthlyRow(900000)],
  total_coverage_unit_charge: 0,
  image: '',
  ad: '',
  extra_km_charge: 0,
})

const ADMIN_PAYLOAD = {
  categories: [
    baseCategory('B', 'Económico', 'BÁSICO B'),
    baseCategory('C', 'Compacto', 'COMPACTO C'),
    baseCategory('D', 'Intermedio', 'INTERMEDIO D'),
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

describe('useStoreSearchData unable cards on LLNRAG009 (SCEN-U1, U2, U4)', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-U2: monthly + LLNRAG009 → categories surfaces ALL N admin categories as unable (currently returns [])', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref({ ...NO_AVAILABILITY_ERROR }),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(searchStore.categories.length).toBe(ADMIN_PAYLOAD.categories.length)
    expect(searchStore.categories.every((c) => c.estimatedTotalAmount === 999999999)).toBe(true)
    expect(searchStore.filteredCategories.length).toBe(ADMIN_PAYLOAD.categories.length)
  })

  it('SCEN-U1 regression guard: non-monthly + LLNRAG009 → categories surfaces ALL N admin categories as unable', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref({ ...NO_AVAILABILITY_ERROR }),
    })

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(searchStore.categories.length).toBe(ADMIN_PAYLOAD.categories.length)
    expect(searchStore.categories.every((c) => c.estimatedTotalAmount === 999999999)).toBe(true)
    expect(searchStore.filteredCategories.length).toBe(ADMIN_PAYLOAD.categories.length)
  })

  it('SCEN-U4 regression guard: non-monthly + partial Localiza coverage → mix of available + unable', async () => {
    // Localiza returns only B with a real price; C and D remain unable.
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([
        {
          categoryCode: 'B',
          estimatedTotalAmount: 250000,
          totalAmount: 250000,
          numberDays: 3,
          referenceToken: 'tok',
          rateQualifier: 'rq',
          returnFeeAmount: 0,
          vehicleDayCharge: 80000,
          taxFeeAmount: 0,
          taxFeePercentage: 0,
          IVAFeeAmount: 0,
          coverageUnitCharge: 0,
          coverageQuantity: 0,
          coverageTotalAmount: 0,
        },
      ]),
      error: ref(null),
    })

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(searchStore.categories.length).toBe(3)
    const available = searchStore.categories.filter((c) => c.estimatedTotalAmount !== 999999999)
    const unable = searchStore.categories.filter((c) => c.estimatedTotalAmount === 999999999)
    expect(available.length).toBe(1)
    expect(available[0].categoryCode).toBe('B')
    expect(unable.length).toBe(2)
    expect(unable.map((c) => c.categoryCode).sort()).toEqual(['C', 'D'])
  })
})
