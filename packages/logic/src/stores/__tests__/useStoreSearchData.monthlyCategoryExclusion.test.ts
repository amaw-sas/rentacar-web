import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// SCEN-A: monthly reservation (haveMonthlyReservation === true) must filter
// out the categories listed in noMonthlyCategories before populating
// categoriesAvailabilityData. Pre-fix the filter used `value in array` which
// only matches numeric indices/`length`, never the category code, so all
// categories leaked through.
//
// SCEN-B: non-monthly path is not affected — admin payload passes through
// untouched so the search store reflects the availability response as-is.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const makeAdminCategory = (code: string) => ({
  id: code,
  code,
  identification: code,
  description: `Gama ${code}`,
  name: code,
  category: `${code} Demo`,
  models: [],
  month_prices: [],
  total_coverage_unit_charge: 0,
  extra_km_charge: 0,
})

const ADMIN_PAYLOAD = {
  categories: ['C', 'FU', 'FL', 'GL', 'LU', 'LE'].map(makeAdminCategory),
  branches: [
    { id: 1, code: 'AABOT', name: 'Bogotá Aeropuerto', city: 'bogota', slug: 'bogota-aeropuerto', schedule: '' },
  ],
  extras: undefined,
  vehicleCategories: {},
}

const TOAST_ADD = vi.fn()

describe('useStoreSearchData monthly category exclusion (SCEN-A)', () => {
  beforeEach(() => {
    TOAST_ADD.mockClear()
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: TOAST_ADD, clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-A: monthly reservation excludes FU, FL, GL, LU from categoriesAvailabilityData', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([]),
      error: ref(null),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    const codes = (searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode)
    expect(codes).not.toContain('FU')
    expect(codes).not.toContain('FL')
    expect(codes).not.toContain('GL')
    expect(codes).not.toContain('LU')
    expect(codes).toContain('C')
    expect(codes).toContain('LE')
  })

  it('SCEN-B: non-monthly path is unaffected — payload passes through', async () => {
    const passthroughPayload = ['C', 'FU', 'LU'].map((code) => ({
      categoryCode: code,
      categoryDescription: '',
      totalAmount: 100000,
      estimatedTotalAmount: 100000,
      vehicleDayCharge: 50000,
      numberDays: 3,
      taxFeeAmount: 0,
      taxFeePercentage: 0,
      IVAFeeAmount: 0,
      coverageUnitCharge: 29000,
      coverageQuantity: 3,
      coverageTotalAmount: 87000,
      totalCoverageUnitCharge: 0,
      referenceToken: 't',
      rateQualifier: 'r',
    }))

    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(passthroughPayload),
      error: ref(null),
    })

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    const codes = (searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode)
    expect(codes).toEqual(['C', 'FU', 'LU'])
  })
})
