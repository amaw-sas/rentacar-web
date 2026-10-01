import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// `searchOutdated` marks "form params differ from the last search". The
// useSearch watcher calls invalidateIfParamsChanged(); search() snapshots the
// params and recomputes the flag when it resolves, so a param change mid-flight
// keeps the notice and a no-op change never invents it.

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

const LLNRAG009 = {
  error: 'no_available_categories_error' as const,
  message: 'Lo sentimos, no se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
}

describe('useStoreSearchData searchOutdated flag', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is false by default', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    expect(useStoreSearchData().searchOutdated).toBe(false)
  })

  it('is cleared when a search resolves', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()
    store.searchOutdated = true
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref([]), error: ref(null) })
    await store.search()
    expect(store.searchOutdated).toBe(false)
  })

  it('is cleared when a search resolves with LLNRAG009', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const store = useStoreSearchData()
    store.searchOutdated = true
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref(null), error: ref({ ...LLNRAG009 }) })
    await store.search()
    expect(store.searchOutdated).toBe(false)
  })

  const setParams = async (date: string) => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const form = useStoreReservationForm()
    form.lugarRecogida = 'bogota-aeropuerto'
    form.lugarDevolucion = 'bogota-aeropuerto'
    form.fechaRecogida = date
    form.fechaDevolucion = '2026-10-30'
    return form
  }

  it('a param change mid-flight keeps the notice after the (stale) results arrive', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const form = await setParams('2026-10-20')
    const store = useStoreSearchData()
    let resolveFetch!: (v: unknown) => void
    FETCH_AVAILABILITY.mockReturnValue(new Promise((r) => { resolveFetch = r }))
    const inFlight = store.search()
    form.fechaRecogida = '2026-10-21'
    expect(store.invalidateIfParamsChanged()).toBe(true)
    resolveFetch({ data: ref([]), error: ref(null) })
    await inFlight
    expect(store.searchOutdated).toBe(true)
    expect(store.pending).toBe(false)
  })

  it('change-then-revert keeps the flag true (data was already nulled)', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const form = await setParams('2026-10-20')
    const store = useStoreSearchData()
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref([]), error: ref(null) })
    await store.search()
    expect(store.searchOutdated).toBe(false)

    form.fechaRecogida = '2026-10-21'
    expect(store.invalidateIfParamsChanged()).toBe(true)
    form.fechaRecogida = '2026-10-20'
    expect(store.invalidateIfParamsChanged()).toBe(true)
    expect(store.searchOutdated).toBe(true)
    expect(store.categoriesAvailabilityData).toBeNull()
  })

  it('invalidate with unchanged params after a completed search is a no-op', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    await setParams('2026-10-20')
    const store = useStoreSearchData()
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref([]), error: ref(null) })
    await store.search()
    expect(store.categoriesAvailabilityData).toEqual([])

    expect(store.invalidateIfParamsChanged()).toBe(false)
    expect(store.searchOutdated).toBe(false)
    expect(store.categoriesAvailabilityData).toEqual([])
  })

  it('invalidate before any search nulls data and flags outdated', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    await setParams('2026-10-20')
    const store = useStoreSearchData()
    store.categoriesAvailabilityData = []
    expect(store.invalidateIfParamsChanged()).toBe(true)
    expect(store.searchOutdated).toBe(true)
    expect(store.categoriesAvailabilityData).toBeNull()
  })

  it('a superseded response does not touch the flag; the newer search decides it', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const form = await setParams('2026-10-20')
    const store = useStoreSearchData()
    let resolveFirst!: (v: unknown) => void
    let resolveSecond!: (v: unknown) => void
    FETCH_AVAILABILITY
      .mockReturnValueOnce(new Promise((r) => { resolveFirst = r }))
      .mockReturnValueOnce(new Promise((r) => { resolveSecond = r }))
    const first = store.search()
    form.fechaRecogida = '2026-10-21'
    const second = store.search()
    store.searchOutdated = true
    resolveFirst({ data: ref([]), error: ref(null) })
    await first
    expect(store.searchOutdated).toBe(true)
    resolveSecond({ data: ref([]), error: ref(null) })
    await second
    expect(store.searchOutdated).toBe(false)
  })
})
