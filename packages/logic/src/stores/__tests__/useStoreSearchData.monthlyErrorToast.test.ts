import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #10 SCEN-002: when /availability returns a Localiza error other than
// no_available_categories_error AND the URL produces a 30-day duration, the
// search store entered its monthly branch which silently set a flag and never
// invoked createErrorMessage. Result: no toast, no inline block, no feedback.
//
// Root cause is independent of the primary fix (v-if + isInventoryEmpty); the
// monthly branch's error handling was simply asymmetric with the non-monthly
// branch. This test pins the symmetric behaviour at the unit level so the
// regression cannot return.

const TOAST_ADD = vi.fn()
const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const ADMIN_PAYLOAD = {
  categories: [
    {
      id: 'B',
      code: 'B',
      identification: 'B',
      description: 'Económico',
      name: 'B',
      category: 'BÁSICO B',
      models: [],
      month_prices: {},
      total_coverage_unit_charge: 0,
    },
  ],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

const OUT_OF_SCHEDULE = {
  error: 'out_of_schedule_pickup_date_error' as const,
  message: 'La fecha de recogida está fuera del horario',
  shortText: 'LLNRRE010',
}

const NO_AVAILABILITY = {
  error: 'no_available_categories_error' as const,
  message: 'No se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
}

describe('useStoreSearchData monthly branch error handling (SCEN-002)', () => {
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

  it('SCEN-002: monthly + non-no_available error → toast surfaces specific message', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref(OUT_OF_SCHEDULE),
    })

    // The form store's haveMonthlyReservation is set to true by useSearch when
    // selectedDays === 30. We bypass useSearch entirely and flip the form-store
    // ref directly so the failing assertion isolates the search store's
    // monthly branch.
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(TOAST_ADD).toHaveBeenCalledTimes(1)
    const toastArg = TOAST_ADD.mock.calls[0][0]
    expect(toastArg.description).toBe(OUT_OF_SCHEDULE.message)
    expect(toastArg.color).toBe('error')
  })

  it('regression guard: monthly + no_available_categories_error → NO toast (inline block handles UX)', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref(NO_AVAILABILITY),
    })

    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const formStore = useStoreReservationForm()
    formStore.haveMonthlyReservation = true

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(TOAST_ADD).not.toHaveBeenCalled()
  })

  it('regression guard: non-monthly + non-no_available error → toast still surfaces (existing behaviour)', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref(OUT_OF_SCHEDULE),
    })

    // haveMonthlyReservation defaults to false in useStoreReservationForm.
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(TOAST_ADD).toHaveBeenCalledTimes(1)
    expect(TOAST_ADD.mock.calls[0][0].description).toBe(OUT_OF_SCHEDULE.message)
  })
})
