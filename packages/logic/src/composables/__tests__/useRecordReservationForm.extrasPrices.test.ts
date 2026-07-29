import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Extras-in-confirmation (docs/specs/2026-07-28-extras-en-confirmacion in the
// dashboard repo): checkout promises "renta + extras" but the record only
// carried booleans, so the voucher and the email showed a total $68.000 short
// of what the client accepted (real case AV1BYJK35A). These tests pin the
// wire: the agreed price of each SELECTED extra must travel with the record;
// an unselected extra travels as null; and total_price_to_pay stays renta-only
// (extras are flat own-charges added after tasa+IVA, never folded in).

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
  categoryCode: 'FX' as CategoryAvailabilityData['categoryCode'],
  categoryDescription: 'Sedán Automático',
  totalAmount: 457950,
  estimatedTotalAmount: 457950,
  vehicleDayCharge: 151975,
  numberDays: 2,
  taxFeeAmount: 45795,
  taxFeePercentage: 10,
  IVAFeeAmount: 95712,
  coverageUnitCharge: 29000,
  coverageQuantity: 2,
  coverageTotalAmount: 58000,
  totalCoverageUnitCharge: 77000,
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
  // extras: undefined → useCategory falls back to 12.000/día and 100.000/mes.
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

describe('useRecordReservationForm — extras prices travel with the record', () => {
  it('SCEN-001: daily 2-day reservation persists days×dayPrice for each selected extra', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.attribution = {}

    const cat = useCategory(makeCategory())
    cat.withExtraDriver.value = true
    cat.withBabySeat.value = true
    cat.withWash.value = true
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver_price).toBe(24000) // 2 × 12.000
    expect(body.baby_seat_price).toBe(24000)
    expect(body.wash_price).toBe(20000) // flat, not per-day
    // Extras must NOT inflate the renta total the finances derive from.
    expect(body.total_price_to_pay).toBe(cat.getActualTotalPrice.value)
  })

  it('SCEN-001b: unselected extras travel as null, never 0 (0 would read as "free")', async () => {
    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.attribution = {}

    const cat = useCategory(makeCategory())
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver_price).toBeNull()
    expect(body.baby_seat_price).toBeNull()
    expect(body.wash_price).toBeNull()
  })

  it('SCEN-002: monthly reservation persists the flat 100.000 per selected extra (mig 109 rule)', async () => {
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
    cat.withExtraDriver.value = true
    cat.withBabySeat.value = true
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.extra_driver_price).toBe(100000)
    expect(body.baby_seat_price).toBe(100000)
    expect(body.wash_price).toBeNull()
    expect(body.total_price_to_pay).toBe(1190000)
  })
})

describe('useRecordReservationForm — SCEN-H05 redondeo a peso entero', () => {
  it('un precio/día con decimales viaja redondeado (COP no tiene subunidad, issue #376)', async () => {
    vi.stubGlobal('useFetchRentacarData', () => ({
      extras: { extraDriverDayPrice: 12000.4 },
    }))

    const form = useStoreReservationForm()
    form.haveMonthlyReservation = false
    form.attribution = {}

    const cat = useCategory(makeCategory({ numberDays: 3 }))
    cat.withExtraDriver.value = true
    useStoreSearchData().selectedCategory = cat

    await useRecordReservationForm()

    // 3 × 12000.4 = 36001.2 → 36001, nunca centavos en la fila.
    expect(lastBody().extra_driver_price).toBe(36001)
  })
})
