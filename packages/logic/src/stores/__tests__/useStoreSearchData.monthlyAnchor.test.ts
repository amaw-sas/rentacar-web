import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import type CategoryAvailabilityData from '../../utils/types/data/CategoryAvailabilityData'
import type { CategoryType } from '../../utils/types/type/CategoryType'

/**
 * The anchor's last mile (SCEN-M2). `month_anchor_gross` arrives on the ADMIN
 * category; the card reads `monthAnchorGross`. Two places carry it across and
 * both matter:
 *
 *  - createCategoryAvailability — the factory the MONTHLY search maps every
 *    category through, and the only source for a card with no availability row.
 *  - the availability merge in the `categories` computed.
 *
 * Note when reading the reds: the merge ASSIGNS onto the very objects the
 * factory built, so on a matched card the two paths overlap and removing the
 * factory line alone leaves the priced cards green. The unmatched (unable) card
 * is what isolates the factory — the merge never reaches it. Both wirings are
 * kept: the factory is the only one that covers the LLNRAG009 gray grid.
 *
 * Harness calqued from useStoreSearchData.mapLookupMerge.test.ts.
 */

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const monthlyPriced = () => ({
  '1k_kms': 3_000_000,
  '2k_kms': 3_500_000,
  '3k_kms': 4_000_000,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 400_000,
  one_day_price: 550_000,
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
  month_prices: [monthlyPriced()],
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

const stubCatalog = (categories: unknown[]) =>
  vi.stubGlobal('useState', () => ref({ categories, branches: [], extras: undefined, vehicleCategories: {} }))

describe('useStoreSearchData — monthly anchor passthrough', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-M2: a monthly search ends with the anchor on every card the grid renders', async () => {
    stubCatalog([
      makeAdminCategory('GC', { month_anchor_gross: 280_607 }),
      makeAdminCategory('LE', { month_anchor_gross: null }),
    ])

    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([availabilityRow('GC', 0), availabilityRow('LE', 0)]),
      error: ref(null),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true
    formStore.fechaRecogida = '2026-03-15'

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    await store.search()

    const anchors = store.categories.map((c) => [c.categoryCode, c.monthAnchorGross])
    expect(anchors).toContainEqual(['GC', 280_607])
    expect(anchors).toContainEqual(['LE', null])
  })

  it('SCEN-M2: the availability merge carries the anchor onto a matched card', async () => {
    stubCatalog([makeAdminCategory('GC', { month_anchor_gross: 280_607 })])

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    store.categoriesAvailabilityData = [availabilityRow('GC', 80_000)]

    expect(store.categories.find((c) => c.categoryCode === 'GC')?.monthAnchorGross).toBe(280_607)
  })

  it('SCEN-M2: an unmatched (unable) card still carries the anchor via the factory', async () => {
    stubCatalog([makeAdminCategory('GC', { month_anchor_gross: 280_607 })])

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    store.categoriesAvailabilityData = [availabilityRow('LE' as CategoryType, 80_000)]

    const gc = store.categories.find((c) => c.categoryCode === 'GC')
    expect(gc?.estimatedTotalAmount).toBe(999999999)
    expect(gc?.monthAnchorGross).toBe(280_607)
  })

  it('SCEN-M1: an admin category without the field yields null, never undefined', async () => {
    stubCatalog([makeAdminCategory('GC')])

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    store.categoriesAvailabilityData = [availabilityRow('GC', 80_000)]

    expect(store.categories.find((c) => c.categoryCode === 'GC')?.monthAnchorGross).toBeNull()
  })

  it('SCEN-M2: the merge overwrites a stale anchor already on the availability row', async () => {
    // The admin catalog is the only source of truth for the anchor; an
    // availability payload must never be able to smuggle one in.
    stubCatalog([makeAdminCategory('GC', { month_anchor_gross: 280_607 })])

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()

    store.categoriesAvailabilityData = [
      availabilityRow('GC', 80_000, { monthAnchorGross: 999_999 }),
    ]

    expect(store.categories.find((c) => c.categoryCode === 'GC')?.monthAnchorGross).toBe(280_607)
  })
})
