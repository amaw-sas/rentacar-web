import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #322 PR8 — SCEN-322-V03.
// Holdout: docs/specs/issue-322-pr8-deeplink-validation/scenarios/deeplink-validation.scenarios.md
//
// `missing_parameters` used to be swallowed silently ("not a real error, just
// missing information"): a deep-link without hours (or with an unknown branch
// slug that resolved to a null code) left the results page BLANK — no toast,
// no inline error, nothing. But search() only ever runs on a real search
// intent (submit click, route/query param hydration, same-URL retry), never on
// an idle mount — so missing parameters always mean a broken deep-link the
// user needs to hear about. The error now flows through the standard path:
// error.value is set (inline state renders) and createErrorMessage raises the
// toast with the friendly copy mapped in useMessages.

const TOAST_ADD = vi.fn()
const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const ADMIN_PAYLOAD = {
  categories: [],
  branches: [],
  extras: undefined,
  vehicleCategories: {},
}

const MISSING_PARAMETERS = {
  error: 'missing_parameters' as const,
  message: 'Faltan parámetros requeridos para la búsqueda',
}

describe('useStoreSearchData — missing_parameters is a visible UI error (SCEN-322-V03)', () => {
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

  it('search() with missing_parameters raises a toast, sets error, and ends pending=false', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref(null),
      error: ref(MISSING_PARAMETERS),
    })

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    // Visible UI message — not silence.
    expect(TOAST_ADD).toHaveBeenCalledTimes(1)
    const toastArg = TOAST_ADD.mock.calls[0]![0]
    expect(toastArg.color).toBe('error')
    // Friendly copy (useMessages), not the raw technical message.
    expect(toastArg.title).toBe('Enlace de búsqueda incompleto')

    // The inline error state renders (page is not blank without explanation)…
    expect(searchStore.error).toBeTruthy()
    expect(searchStore.error!.error).toBe('missing_parameters')
    // …and the loading state terminates.
    expect(searchStore.pending).toBe(false)
  })

  it('regression guard: a successful search still raises NO toast (happy flow untouched)', async () => {
    FETCH_AVAILABILITY.mockResolvedValue({
      data: ref([]),
      error: ref(null),
    })

    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    await searchStore.search()

    expect(TOAST_ADD).not.toHaveBeenCalled()
    expect(searchStore.error).toBeNull()
    expect(searchStore.pending).toBe(false)
  })
})
