import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Issue #314 — the IVA that gets PERSISTED into the reservation record must come
// from the correct source, not a magic literal. These are behavioral tests: we
// mock ofetch's $fetch to capture the exact formData sent to the record
// endpoint, then assert on the persisted fields (SCEN-04 total_price, SCEN-06
// iva_fee). This is the heart of the issue — the number that enters the record.

const CAPTURE = vi.fn()

vi.mock('ofetch', () => ({
  $fetch: (...args: unknown[]) => CAPTURE(...args),
}))

// Imported AFTER vi.mock so the mocked ofetch is bound.
import useRecordReservationForm from '../useRecordReservationForm'
import useCategory from '../useCategory'
import useStoreReservationForm from '../../stores/useStoreReservationForm'
import useStoreSearchData from '../../stores/useStoreSearchData'

const makeCategory = (
  overrides: Partial<CategoryAvailabilityData> = {},
): CategoryAvailabilityData => ({
  categoryCode: 'C' as CategoryAvailabilityData['categoryCode'],
  categoryDescription: 'Compacto',
  totalAmount: 100000,
  estimatedTotalAmount: 100000,
  vehicleDayCharge: 0,
  numberDays: 1,
  taxFeeAmount: 0,
  taxFeePercentage: 10,
  IVAFeeAmount: 45000,
  coverageUnitCharge: 0,
  coverageQuantity: 1,
  coverageTotalAmount: 0,
  totalCoverageUnitCharge: 0,
  referenceToken: 'tok',
  rateQualifier: 'rq',
  ...overrides,
})

const lastBody = (): Record<string, unknown> => {
  expect(CAPTURE).toHaveBeenCalled()
  const call = CAPTURE.mock.calls.at(-1)!
  return (call[1] as { body: Record<string, unknown> }).body
}

beforeEach(() => {
  setActivePinia(createPinia())
  CAPTURE.mockReset()
  CAPTURE.mockResolvedValue({ code: 'E2ECODE' })
  vi.stubGlobal('useFetchRentacarData', () => ({ extras: undefined }))
  // useStoreSearchData's setup reaches useMessages → useToast and useState
  // (admin data). Stub both so instantiating the store in node doesn't throw.
  vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
  vi.stubGlobal('useState', () => ({ value: null }))
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
      rentacarApiReservasFormRecordEndpoint: '/api/reservations/record',
      rentacarFranchise: 'test',
    },
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useRecordReservationForm — persisted IVA source of truth (issue #314)', () => {
  it('SCEN-314-06: regular reservation persists iva_fee recomputed with the dashboard 21%', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.haveTotalInsurance = true
    form.attribution = {} // short-circuit readStoredAttribution

    const cat = useCategory(makeCategory({ IVAFeePercentage: 21 }))
    cat.withTotalCoverage.value = true
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    // getIVAFeePrice = round((100000 + 10000) * 21 / 100) = 23100
    expect(lastBody().iva_fee).toBe(23100)
  })

  it('SCEN-314-04: monthly reservation derives total_price from the named percentage, not a magic 1.19', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = true
    form.selectedMonthlyMileage = '1k_kms'
    form.fechaRecogida = '2026-08-15'
    form.attribution = {}

    const cat = useCategory(
      makeCategory({
        categoryMonthPrices: [
          {
            '1k_kms': 1190000,
            '2k_kms': 1190000,
            '3k_kms': 1190000,
            init_date: '2026-01-01',
            end_date: '2026-12-31',
            total_insurance_price: 0,
            one_day_price: 0,
            status: 'active',
          },
        ],
      }),
    )
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    const body = lastBody()
    // total_price_to_pay = getActualTotalPrice (monthly) = 1_190_000
    // total_price = round(1_190_000 / (1 + 19/100)) = 1_000_000
    expect(body.total_price_to_pay).toBe(1190000)
    expect(body.total_price).toBe(1000000)
  })
})
