import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import type CategoryAvailabilityData from '../../utils/types/data/CategoryAvailabilityData'
import type { CategoryType } from '../../utils/types/type/CategoryType'

// Issue #15: the merge of admin rows with availability rows in the `categories`
// computed and in the monthly branch of search() used `Array.find()` inside a
// `.map()` (O(n·m)). The refactor swaps it for a Map<categoryCode, row> lookup
// (O(n+m)) and simplifies the comparator. These specs are the holdout — the
// merged output and ordering must be identical before and after.
//
// SCEN-001: categories merges availability by code, unmatched → unable card,
//   sorted ascending by estimatedTotalAmount.
// SCEN-002: duplicate availability codes resolve to the FIRST occurrence — a
//   naive new Map(entries) would keep the LAST and silently regress.
// SCEN-003: the monthly branch copies returnFeeAmount from the matching row by
//   code.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const monthlyPriced = () => ({
  '1k_kms': 900000,
  '2k_kms': 1200000,
  '3k_kms': 1500000,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 0,
  one_day_price: 0,
  status: 'active',
})

const makeAdminCategory = (code: string, overrides = {}) => ({
  id: code,
  code,
  identification: code,
  description: `Gama ${code}`,
  name: code,
  category: `${code} Demo`,
  models: [{ name: `model-${code}` }],
  month_prices: [],
  total_coverage_unit_charge: 0,
  extra_km_charge: 0,
  ...overrides,
})

const availabilityRow = (
  code: CategoryType,
  estimatedTotalAmount: number,
  overrides: Partial<CategoryAvailabilityData> = {},
): CategoryAvailabilityData => ({
  categoryCode: code,
  categoryDescription: '',
  totalAmount: estimatedTotalAmount,
  estimatedTotalAmount,
  vehicleDayCharge: 0,
  numberDays: 3,
  taxFeeAmount: 0,
  taxFeePercentage: 0,
  IVAFeeAmount: 0,
  coverageUnitCharge: 0,
  coverageQuantity: 0,
  coverageTotalAmount: 0,
  totalCoverageUnitCharge: 0,
  returnFeeAmount: 0,
  referenceToken: 't',
  rateQualifier: 'r',
  ...overrides,
})

describe('useStoreSearchData Map-lookup merge (issue #15)', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-001: merges availability by code, unmatched → unable card, sorted ascending', async () => {
    vi.stubGlobal('useState', () => ref({
      categories: [makeAdminCategory('C'), makeAdminCategory('LE'), makeAdminCategory('GR')],
      branches: [],
      extras: undefined,
      vehicleCategories: {},
    }))

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    // GR has no availability row → must surface as an unable card (999999999).
    store.categoriesAvailabilityData = [
      availabilityRow('LE', 120000),
      availabilityRow('C', 80000),
    ]

    expect(store.categories.map((c) => [c.categoryCode, c.estimatedTotalAmount])).toEqual([
      ['C', 80000],
      ['LE', 120000],
      ['GR', 999999999],
    ])

    // Matched entries inherit admin metadata via the merge.
    const c = store.categories.find((x) => x.categoryCode === 'C')
    expect(c?.categoryModels).toEqual([{ name: 'model-C' }])
  })

  it('SCEN-002: duplicate availability codes resolve to the FIRST occurrence', async () => {
    vi.stubGlobal('useState', () => ref({
      categories: [makeAdminCategory('C')],
      branches: [],
      extras: undefined,
      vehicleCategories: {},
    }))

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    store.categoriesAvailabilityData = [
      availabilityRow('C', 50000),
      availabilityRow('C', 90000),
    ]

    expect(store.categories.find((c) => c.categoryCode === 'C')?.estimatedTotalAmount).toBe(50000)
  })

  it('SCEN-003: monthly branch copies returnFeeAmount from the matching row by code', async () => {
    vi.stubGlobal('useState', () => ref({
      categories: [
        makeAdminCategory('C', { month_prices: [monthlyPriced()] }),
        makeAdminCategory('LE', { month_prices: [monthlyPriced()] }),
      ],
      branches: [],
      extras: undefined,
      vehicleCategories: {},
    }))

    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([
        availabilityRow('LE', 0, { returnFeeAmount: 45000 }),
        availabilityRow('C', 0, { returnFeeAmount: 30000 }),
      ]),
      error: ref(null),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true
    formStore.fechaRecogida = '2026-03-15'

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    await store.search()

    const fees = (store.categoriesAvailabilityData ?? []).map((c) => [c.categoryCode, c.returnFeeAmount])
    expect(fees).toContainEqual(['C', 30000])
    expect(fees).toContainEqual(['LE', 45000])
  })

  // SCEN-002 invariant applied to the monthly call site: it shares indexByCode
  // with the computed, so first-occurrence must hold here too. Locks the
  // monthly path against a future divergence even if the sites stop sharing
  // the helper (code-reviewer issue #15, Minor 2).
  it('SCEN-003b: monthly branch picks the FIRST occurrence on duplicate availability codes', async () => {
    vi.stubGlobal('useState', () => ref({
      categories: [makeAdminCategory('C', { month_prices: [monthlyPriced()] })],
      branches: [],
      extras: undefined,
      vehicleCategories: {},
    }))

    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([
        availabilityRow('C', 0, { returnFeeAmount: 11111 }),
        availabilityRow('C', 0, { returnFeeAmount: 99999 }),
      ]),
      error: ref(null),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true
    formStore.fechaRecogida = '2026-03-15'

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    await store.search()

    const c = (store.categoriesAvailabilityData ?? []).find((x) => x.categoryCode === 'C')
    expect(c?.returnFeeAmount).toBe(11111)
  })
})
