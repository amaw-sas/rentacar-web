import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'
import { CHAT_REF_STORAGE_KEY } from '@rentacar-main/logic/utils'

// Holdout: docs/specs/chat-ref-reserva/scenarios/chat-ref-reserva.scenarios.md
// SCEN-001/002/003/007/011 — the body handed to $fetch is captured and inspected
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

const UUID = '4f2a91ce-1234-4abc-9def-0123456789ab'

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

describe('SCEN-001: a captured chat id travels as chat_ref', () => {
  it('sends the exact value as a top-level field on the regular branch', async () => {
    const { form } = arrangeReservation()
    form.chatRef = UUID

    await useRecordReservationForm()

    expect(lastBody().chat_ref).toBe(UUID)
  })

  it('rides along on the monthly branch too', async () => {
    const { form } = arrangeReservation()
    form.chatRef = UUID
    form.haveMonthlyReservation = true
    form.selectedMonthlyMileage = '2k_kms'

    await useRecordReservationForm()

    const body = lastBody()
    expect(body.monthly_mileage).toBe('2k_kms')
    expect(body.chat_ref).toBe(UUID)
  })

  it('adds chat_ref and changes nothing else in the key set', async () => {
    arrangeReservation()
    await useRecordReservationForm()
    const withoutChat = Object.keys(lastBody()).sort()

    const { form } = arrangeReservation()
    form.chatRef = UUID
    await useRecordReservationForm()
    const withChat = Object.keys(lastBody()).sort()

    expect(withChat).toEqual([...withoutChat, 'chat_ref'].sort())
  })
})

describe('SCEN-002: without a chat id the key is absent', () => {
  it('omits the key entirely — not null, not empty string', async () => {
    const { form } = arrangeReservation()
    expect(form.chatRef).toBeNull()

    await useRecordReservationForm()

    const body = lastBody()
    expect('chat_ref' in body).toBe(false)
    expect(JSON.stringify(body)).not.toContain('chat_ref')
  })

  it('an empty string in the store still omits the key', async () => {
    const { form } = arrangeReservation()
    form.chatRef = ''

    await useRecordReservationForm()

    expect('chat_ref' in lastBody()).toBe(false)
  })
})

describe('SCEN-003: a store re-created after a reload falls back to storage', () => {
  it('reads localStorage when the in-memory ref is empty', async () => {
    localStorage.setItem(
      CHAT_REF_STORAGE_KEY,
      JSON.stringify({ value: UUID, ts: Date.now() - 1_000 }),
    )
    const { form } = arrangeReservation()
    expect(form.chatRef).toBeNull()

    await useRecordReservationForm()

    expect(lastBody().chat_ref).toBe(UUID)
  })

  it('prefers the in-memory value over an older stored one', async () => {
    localStorage.setItem(
      CHAT_REF_STORAGE_KEY,
      JSON.stringify({ value: 'aaaa-1111', ts: Date.now() - 1_000 }),
    )
    const { form } = arrangeReservation()
    form.chatRef = 'bbbb-2222'

    await useRecordReservationForm()

    expect(lastBody().chat_ref).toBe('bbbb-2222')
  })
})

describe('SCEN-007: the web does not validate the format', () => {
  it('forwards arbitrary text verbatim', async () => {
    const { form } = arrangeReservation()
    form.chatRef = 'lo-que-sea-123'

    await useRecordReservationForm()

    expect(lastBody().chat_ref).toBe('lo-que-sea-123')
  })
})

describe('SCEN-011: the wire name is chat_ref, never chat_conversation_id', () => {
  it('never emits the ignored legacy name', async () => {
    const { form } = arrangeReservation()
    form.chatRef = UUID

    await useRecordReservationForm()

    const body = lastBody()
    expect(Object.keys(body)).toContain('chat_ref')
    expect(Object.keys(body)).not.toContain('chat_conversation_id')
  })
})
