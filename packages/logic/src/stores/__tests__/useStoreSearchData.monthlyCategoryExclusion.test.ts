import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #28 Ola A: monthly availability is derived from each category's pricing
// (month_prices), not a hardcoded code list. A category is offered monthly when
// the pricing row applicable to the pickup date carries a positive 1k/2k monthly
// price. The dashboard clears those to NULL (→ 0 in the payload) for the gamas
// that don't offer monthly (FU/FL/GL/LU today, mig. 042).
//
// SCEN-A01: monthly reservation hides categories whose applicable pricing has no
//   positive monthly price; keeps the ones that do.
// SCEN-A02: non-monthly path passes the availability payload through untouched.
// SCEN-A03: the decision comes from the data, not list membership — a brand-new
//   code with zero monthly pricing is excluded without any code change.
// SCEN-A06: the decision respects the pickup date.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

type Row = {
  '1k_kms': number
  '2k_kms': number
  '3k_kms': number
  init_date: string
  end_date: string
  total_insurance_price: number
  one_day_price: number
  status: 'active' | 'inactive'
}

// An active pricing row that offers monthly (positive 1k/2k).
const monthlyPriced = (overrides: Partial<Row> = {}): Row => ({
  '1k_kms': 900000,
  '2k_kms': 1200000,
  '3k_kms': 1500000,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 0,
  one_day_price: 0,
  status: 'active',
  ...overrides,
})

// An active pricing row with monthly cleared (the mig. 042 shape for the gamas
// that don't offer monthly).
const noMonthly = (overrides: Partial<Row> = {}): Row =>
  monthlyPriced({ '1k_kms': 0, '2k_kms': 0, '3k_kms': 0, ...overrides })

const makeAdminCategory = (code: string, month_prices: Row[]) => ({
  id: code,
  code,
  identification: code,
  description: `Gama ${code}`,
  name: code,
  category: `${code} Demo`,
  models: [],
  month_prices,
  total_coverage_unit_charge: 0,
  extra_km_charge: 0,
})

// C, LE offer monthly; FU does not (cleared pricing). ZZ is a brand-new code,
// never present in the legacy ['FU','FL','GL','LU'] list, also with cleared
// monthly pricing — it must be excluded purely because of its data.
const ADMIN_PAYLOAD = {
  categories: [
    makeAdminCategory('C', [monthlyPriced()]),
    makeAdminCategory('FU', [noMonthly()]),
    makeAdminCategory('LE', [monthlyPriced()]),
    makeAdminCategory('ZZ', [noMonthly()]),
  ],
  branches: [
    { id: 1, code: 'AABOT', name: 'Bogotá Aeropuerto', city: 'bogota', slug: 'bogota-aeropuerto', schedule: '' },
  ],
  extras: undefined,
  vehicleCategories: {},
}

const TOAST_ADD = vi.fn()

describe('useStoreSearchData monthly availability derived from pricing (Ola A)', () => {
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

  it('SCEN-A01: monthly reservation excludes categories without monthly pricing (FU), keeps priced ones (C, LE)', async () => {
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
    expect(codes).toContain('C')
    expect(codes).toContain('LE')
    expect(codes).not.toContain('FU')
  })

  it('SCEN-A03: a brand-new code with zero monthly pricing (ZZ) is excluded — derived from data, not a list', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([]),
      error: ref(null),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    useStoreReservationForm().haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    const codes = (searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode)
    expect(codes).not.toContain('ZZ')
    expect(codes).toContain('C')
  })

  it('SCEN-A06: monthly availability respects the pickup date (priced in H1, cleared in H2)', async () => {
    const SX_PAYLOAD = {
      ...ADMIN_PAYLOAD,
      categories: [
        makeAdminCategory('SX', [
          monthlyPriced({ init_date: '2026-01-01', end_date: '2026-06-30' }),
          noMonthly({ init_date: '2026-07-01', end_date: '2026-12-31' }),
        ]),
      ],
    }
    vi.stubGlobal('useState', () => ref(SX_PAYLOAD))

    FETCH_AVAILABILITY.mockResolvedValue({ data: ref([]), error: ref(null) })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    formStore.fechaRecogida = '2026-03-15'
    await searchStore.search()
    expect((searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode)).toContain('SX')

    formStore.fechaRecogida = '2026-08-15'
    await searchStore.search()
    expect((searchStore.categoriesAvailabilityData ?? []).map((c) => c.categoryCode)).not.toContain('SX')
  })

  it('SCEN-A02: non-monthly path is unaffected — payload passes through', async () => {
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
