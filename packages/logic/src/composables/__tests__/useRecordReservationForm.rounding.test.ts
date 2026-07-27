import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Issue #376 — the daily (regular) branch persisted tax_fee / iva_fee /
// total_price straight from the availability getters, which — without Seguro
// Total — return the raw upstream amounts unrounded (e.g. tax_fee 88179.735).
// The monthly branch already rounds to whole pesos; these are behavioral tests
// that capture the exact formData sent to the record endpoint and assert the
// three persisted money fields are integer COP, matching the monthly branch.

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

describe('useRecordReservationForm — daily branch rounds money to whole pesos (issue #376)', () => {
  it('SCEN-376-01: a daily reservation persists tax_fee / iva_fee / total_price as integer COP', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.haveTotalInsurance = false // regular branch, no Seguro Total → raw amounts
    form.attribution = {} // short-circuit readStoredAttribution

    // Decimal upstream amounts reproducing the reported payload (reserva AVD5YCWXP):
    // total_price = getSubtotal + getTaxFeePrice = 678797.35 + 88179.735 = 766977.085
    const cat = useCategory(
      makeCategory({
        totalAmount: 678797.35,
        taxFeeAmount: 88179.735,
        IVAFeeAmount: 184295.64615,
      }),
    )
    useStoreSearchData().selectedCategory = cat

    // Guard: this scenario exercises the non-total-coverage path.
    expect(cat.withTotalCoverage.value).toBe(false)

    await useRecordReservationForm()

    const body = lastBody()
    expect(Number.isInteger(body.tax_fee)).toBe(true)
    expect(Number.isInteger(body.iva_fee)).toBe(true)
    expect(Number.isInteger(body.total_price)).toBe(true)
    expect(body.tax_fee).toBe(88180) // round(88179.735)
    expect(body.iva_fee).toBe(184296) // round(184295.64615)
    // total_price = round(subtotal) + round(taxFee) = 678797 + 88180 = 766977
    expect(body.total_price).toBe(766977)
  })

  it('SCEN-376-02: total_price is derived from the rounded parts, keeping total_price - tax_fee exact', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.haveTotalInsurance = false
    form.attribution = {}

    // Chosen so round(subtotal + taxFee) diverges from round(subtotal) + round(taxFee):
    //   subtotal = 100.6, taxFee = 50.6
    //   round(sum)   = round(151.2) = 151   ← the rejected approach
    //   round(parts) = 101 + 51     = 152   ← the persisted identity
    const cat = useCategory(
      makeCategory({
        totalAmount: 100.6, // getSubtotal (no coverage, no return fee) = 100.6
        taxFeeAmount: 50.6,
        IVAFeeAmount: 0,
      }),
    )
    useStoreSearchData().selectedCategory = cat
    expect(cat.withTotalCoverage.value).toBe(false)

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.tax_fee).toBe(51) // round(50.6)
    expect(body.total_price).toBe(152) // round(100.6) + round(50.6), NOT round(151.2)=151
    // The invariant the fix protects: total_price - tax_fee === round(subtotal).
    expect((body.total_price as number) - (body.tax_fee as number)).toBe(101)
  })
})
