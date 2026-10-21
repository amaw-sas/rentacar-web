import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Holdout: docs/specs/cotizacion-por-asesor/scenarios/cotizacion-por-asesor.scenarios.md
// SCEN-013 — the body handed to $fetch is captured and inspected
// (same harness as the extraDriver suite). Behavioural, not a regex on the source.

const CAPTURE = vi.fn()

vi.mock('ofetch', () => ({
  $fetch: (...args: unknown[]) => CAPTURE(...args),
}))

// Imported AFTER vi.mock so the mocked ofetch is bound.
import useRecordReservationForm from '../useRecordReservationForm'
import useCategory from '../useCategory'
import useStoreReservationForm from '../../stores/useStoreReservationForm'
import useStoreSearchData from '../../stores/useStoreSearchData'


function createStorageMock(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage
}

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

function arrangeReservation() {
  const form = useStoreReservationForm()
  form.haveMonthlyReservation = false
  form.haveTotalInsurance = false
  form.attribution = {} // short-circuit readStoredAttribution
  const cat = useCategory(makeCategory())
  const search = useStoreSearchData()
  // Pinia unwraps the nested refs in the store's type; the runtime value is the
  // same composable the app assigns (see the extraDriver suite).
  search.selectedCategory = cat as unknown as typeof search.selectedCategory
  return { form, cat }
}

beforeEach(() => {
  setActivePinia(createPinia())
  CAPTURE.mockReset()
  CAPTURE.mockResolvedValue({ code: 'E2ECODE' })
  vi.stubGlobal('localStorage', createStorageMock())
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

const ADVISOR_KEY = 'rentacar:asesor'
const storeAdvisor = () =>
  localStorage.setItem(ADVISOR_KEY, JSON.stringify({ code: 'daniela', name: 'Daniela' }))

describe('SCEN-013: the reservation is recorded under the active advisor', () => {
  it('(a) advisor stored, no referido -> user = daniela', async () => {
    storeAdvisor()
    arrangeReservation()
    await useRecordReservationForm()
    expect(lastBody().user).toBe('daniela')
  })

  it('(b) advisor stored beats the route referido', async () => {
    storeAdvisor()
    const { form } = arrangeReservation()
    form.referido = 'otro'
    await useRecordReservationForm()
    expect(lastBody().user).toBe('daniela')
  })

  it('(c) no advisor, referido -> referido (unchanged)', async () => {
    const { form } = arrangeReservation()
    form.referido = 'otro'
    await useRecordReservationForm()
    expect(lastBody().user).toBe('otro')
  })

  it('(d) neither -> key absent', async () => {
    arrangeReservation()
    await useRecordReservationForm()
    expect('user' in lastBody()).toBe(false)
  })

  it('(e) monthly branch with advisor -> user = daniela', async () => {
    storeAdvisor()
    const { form } = arrangeReservation()
    form.referido = 'otro'
    form.haveMonthlyReservation = true
    form.selectedMonthlyMileage = '2k_kms'
    await useRecordReservationForm()
    const body = lastBody()
    expect(body.monthly_mileage).toBe('2k_kms')
    expect(body.user).toBe('daniela')
  })

  it('(f) storage throwing behaves as no advisor', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    const { form } = arrangeReservation()
    form.referido = 'otro'
    await useRecordReservationForm()
    expect(lastBody().user).toBe('otro')
  })
})
