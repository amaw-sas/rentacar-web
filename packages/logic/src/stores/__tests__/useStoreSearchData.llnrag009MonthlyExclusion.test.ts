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

// Issue #28 Ola A: monthly exclusion is derived from pricing, so fixtures carry
// realistic month_prices. An active row with positive 1k/2k offers monthly; a
// row cleared to 0 (the mig. 042 shape) does not.
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

const baseCategory = (id: string, name: string, category: string, offersMonthly: boolean) => ({
  id,
  code: id,
  identification: id,
  description: name,
  name,
  category,
  models: [],
  month_prices: [monthlyRow(offersMonthly ? 900000 : 0)],
  total_coverage_unit_charge: 0,
  image: '',
  ad: '',
  extra_km_charge: 0,
})

// B and C offer monthly; FU does not (cleared pricing) — the data-driven
// equivalent of the old hardcoded exclusion.
const ADMIN_PAYLOAD = {
  categories: [
    baseCategory('B', 'Económico', 'BÁSICO B', true),
    baseCategory('C', 'Compacto', 'COMPACTO C', true),
    baseCategory('FU', 'Furgón', 'FURGÓN FU', false),
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

  it('monthly + LLNRAG009 → monthly gamas are AVAILABLE (priced from DB), not "agotado" (#201)', async () => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    useStoreReservationForm().haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()
    await searchStore.search()

    // #201: LLNRAG009 from Localiza is non-blocking for monthly — the price comes
    // from category_pricing, so the monthly gamas (B, C) surface as AVAILABLE.
    // The old behaviour rendered every category as an unable "agotado" card.
    const available = searchStore.categories
      .filter((c) => c.estimatedTotalAmount !== 999999999)
      .map((c) => c.categoryCode)
      .sort()
    expect(available).toEqual(['B', 'C'])
    // #54 preserved: the non-monthly gama (FU) is never offered as priced.
    expect((searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode).sort()).toEqual(['B', 'C'])
    // and the search is not flagged "agotado".
    expect(searchStore.noAvailableCategories).toBe(false)
  })

  it('non-monthly + LLNRAG009 still surfaces every admin category (regression guard)', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()
    await searchStore.search()

    const codes = searchStore.categories.map((c) => c.categoryCode).sort()
    expect(codes).toEqual(['B', 'C', 'FU'])
  })
})
