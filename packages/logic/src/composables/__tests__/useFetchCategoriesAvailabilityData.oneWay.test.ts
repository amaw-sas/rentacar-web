import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Integration seam for the one-way LLNRRE003 mapping (issue rentacar-dashboard#205).
// Exercises the REAL wire in useFetchCategoriesAvailabilityData's catch:
// classifyOneWayDistanceError(mapAvailabilityFetchError(e), pickup, return).
// The helper and the copy mapping are unit-tested separately; this pins that the
// composable composes them with the store's branch codes, end to end.

// $fetch is imported from 'ofetch' (not a Nuxt auto-import), so we mock the module.
const $fetchMock = vi.fn()
vi.mock('ofetch', () => ({ $fetch: (...args: unknown[]) => $fetchMock(...args) }))

const llnrre003Rejection = () =>
  Object.assign(new Error('500'), {
    status: 500,
    data: {
      error: 'unknown_error',
      message: 'Ha ocurrido un error inesperado, por favor contacte a nuestros asesores',
      shortText: 'LLNRRE003',
    },
  })

// Sets the four required search params + the two branch codes so the composable
// passes its missing-parameters guard and reaches the fetch/catch path.
const seedForm = async (pickup: string, ret: string) => {
  const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
  const form = useStoreReservationForm()
  form.lugarRecogida = pickup
  form.lugarDevolucion = ret
  form.fechaRecogida = '2026-07-01'
  form.fechaDevolucion = '2026-07-08'
  form.horaRecogida = '12:00'
  form.horaDevolucion = '12:00'
}

const runFetch = async () => {
  const { default: useFetchCategoriesAvailabilityData } = await import('../useFetchCategoriesAvailabilityData')
  return useFetchCategoriesAvailabilityData()
}

describe('useFetchCategoriesAvailabilityData — one-way LLNRRE003 wire', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    $fetchMock.mockReset()
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        rentacarApiReservasCategoriesAvailabilityEndpoint: '/api/reservations/availability',
        rentacarFranchise: 'alquilatucarro',
      },
    }))
    vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
    vi.stubGlobal('navigateTo', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reclassifies the backend LLNRRE003 to one_way_not_available on a one-way search (pickup ≠ return) — SCEN-OW-01', async () => {
    $fetchMock.mockRejectedValueOnce(llnrre003Rejection())
    await seedForm('ACBAN', 'AABAN')

    const { error } = await runFetch()

    expect(error.value?.error).toBe('one_way_not_available')
    // original Localiza context preserved for downstream/forward-compat
    expect(error.value?.shortText).toBe('LLNRRE003')
  })

  it('leaves the same backend error as unknown_error on a round-trip search (pickup === return) — SCEN-OW-02', async () => {
    $fetchMock.mockRejectedValueOnce(llnrre003Rejection())
    await seedForm('ACBAN', 'ACBAN')

    const { error } = await runFetch()

    expect(error.value?.error).toBe('unknown_error')
  })
})
