import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Scenarios: docs/specs/issue-396-conductor-adicional/scenarios/conductor-adicional-datos.scenarios.md
//
// SCEN-396-05/06/07 — the record payload carries the extra driver's name and ID
// document only while the add-on is contracted. Behavioural: the body handed to
// $fetch is captured and inspected, following the harness of the rounding suite.

const CAPTURE = vi.fn()

vi.mock('ofetch', () => ({
  $fetch: (...args: unknown[]) => CAPTURE(...args),
}))

// Imported AFTER vi.mock so the mocked ofetch is bound.
import useRecordReservationForm from '../useRecordReservationForm'
import useCategory from '../useCategory'
import useStoreReservationForm from '../../stores/useStoreReservationForm'
import useStoreSearchData from '../../stores/useStoreSearchData'

const makeCategory = (): CategoryAvailabilityData =>
  ({
    categoryCode: 'C' as CategoryAvailabilityData['categoryCode'],
    categoryDescription: 'Compacto',
    totalAmount: 100000,
    estimatedTotalAmount: 100000,
    vehicleDayCharge: 0,
    numberDays: 1,
    taxFeeAmount: 0,
    taxFeePercentage: 10,
    IVAFeeAmount: 0,
    coverageUnitCharge: 0,
    coverageQuantity: 1,
    coverageTotalAmount: 0,
    totalCoverageUnitCharge: 0,
    referenceToken: 'tok',
    rateQualifier: 'rq',
  }) as CategoryAvailabilityData

const lastBody = (): Record<string, unknown> => {
  expect(CAPTURE).toHaveBeenCalled()
  const call = CAPTURE.mock.calls.at(-1)!
  return (call[1] as { body: Record<string, unknown> }).body
}

/** Sets up a submittable regular reservation and returns the category composable. */
function arrangeReservation({ withExtraDriver }: { withExtraDriver: boolean }) {
  const form = useStoreReservationForm()
  form.haveMonthlyReservation = false
  form.haveTotalInsurance = false
  form.attribution = {} // short-circuit readStoredAttribution

  const cat = useCategory(makeCategory())
  cat.withExtraDriver.value = withExtraDriver
  useStoreSearchData().selectedCategory = cat
  return { form, cat }
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

describe('SCEN-396-05: the contracted add-on sends the extra driver data', () => {
  it('sends name and document, trimmed', async () => {
    const { form } = arrangeReservation({ withExtraDriver: true })
    form.conductorAdicionalNombre = '  Ana Pérez  '
    form.conductorAdicionalIdentificacion = '  1020304050  '

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver).toBe(1)
    expect(body.extra_driver_name).toBe('Ana Pérez')
    expect(body.extra_driver_document).toBe('1020304050')
  })

  it('rides along on the monthly branch too', async () => {
    const { form } = arrangeReservation({ withExtraDriver: true })
    form.haveMonthlyReservation = true
    form.selectedMonthlyMileage = '2k_kms'
    form.conductorAdicionalNombre = 'Ana Pérez'
    form.conductorAdicionalIdentificacion = 'AB123456'

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.monthly_mileage).toBe('2k_kms')
    expect(body.extra_driver_name).toBe('Ana Pérez')
    expect(body.extra_driver_document).toBe('AB123456')
  })
})

describe('SCEN-396-06: un-contracting the add-on drops the keys', () => {
  it('omits both keys entirely when the flag is off, even with leftover store data', async () => {
    const { form } = arrangeReservation({ withExtraDriver: false })
    form.conductorAdicionalNombre = 'Ana Pérez'
    form.conductorAdicionalIdentificacion = '1020304050'

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver).toBe(0)
    // Absent, not empty — an empty string would persist a blank extra driver.
    expect('extra_driver_name' in body).toBe(false)
    expect('extra_driver_document' in body).toBe(false)
  })
})

describe('SCEN-396-07: without the add-on the payload is unchanged', () => {
  it('keeps exactly the same key set as before the change', async () => {
    arrangeReservation({ withExtraDriver: false })

    await useRecordReservationForm()

    // Frozen key set of the regular branch, captured before issue #396.
    // extras-en-confirmación (28-jul) legitimately added the three *_price
    // keys (always present, null when unselected) — this list guards against
    // the #396 add-on leaking ITS keys, so it grows with unrelated features.
    const expectedKeys = [
      'fullname', 'identification_type', 'identification', 'phone', 'email',
      'category', 'pickup_location', 'pickup_date', 'pickup_hour',
      'return_location', 'return_date', 'return_hour', 'return_fee',
      'selected_days', 'coverage_days', 'coverage_price', 'franchise',
      'total_insurance', 'reference_token', 'rate_qualifier', 'extra_driver',
      'baby_seat', 'wash', 'flight', 'attribution', 'extra_hours',
      'extra_hours_price', 'tax_fee', 'iva_fee', 'total_price',
      'total_price_to_pay', 'extra_driver_price', 'baby_seat_price',
      'wash_price',
    ].sort()

    expect(Object.keys(lastBody()).sort()).toEqual(expectedKeys)
  })

  it('sends the reservation even though the store refs are still null', async () => {
    const { form } = arrangeReservation({ withExtraDriver: false })
    expect(form.conductorAdicionalNombre).toBeNull()
    expect(form.conductorAdicionalIdentificacion).toBeNull()

    await useRecordReservationForm()

    expect(CAPTURE).toHaveBeenCalledTimes(1)
  })
})

describe('the add-on with empty store refs still sends the keys', () => {
  // Defence in depth: the schema blocks this path, but if a brand ever forgets
  // the mirror the payload must still be self-describing rather than silently
  // dropping the fields — an empty string reaching the dashboard is visible,
  // a missing key is not.
  it('sends empty strings rather than omitting the keys', async () => {
    arrangeReservation({ withExtraDriver: true })

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver_name).toBe('')
    expect(body.extra_driver_document).toBe('')
  })
})
