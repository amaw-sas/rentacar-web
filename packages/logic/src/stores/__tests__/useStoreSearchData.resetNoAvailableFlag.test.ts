import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #20: search() resets error/pending/categoriesAvailabilityData at the
// top but never resets noAvailableCategories. After a search returns LLNRAG009
// (flag → true), a subsequent search that resolves to a DIFFERENT terminal
// error (server_error, out_of_schedule_*, …) never touches the flag, so it
// stays stuck at true from the previous run.

const FETCH_AVAILABILITY = vi.fn()

vi.mock('../../composables/useFetchCategoriesAvailabilityData', () => ({
  default: () => FETCH_AVAILABILITY(),
}))

const baseCategory = (id: string, name: string, category: string) => ({
  id,
  code: id,
  identification: id,
  description: name,
  name,
  category,
  models: [],
  month_prices: {},
  total_coverage_unit_charge: 0,
  image: '',
  ad: '',
  extra_km_charge: 0,
})

const ADMIN_PAYLOAD = {
  categories: [baseCategory('B', 'Económico', 'BÁSICO B')],
  branches: [],
  extras: undefined,
  vehicleCategories: {},
}

const LLNRAG009 = {
  error: 'no_available_categories_error' as const,
  message: 'Lo sentimos, no se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
}

const SERVER_ERROR = {
  error: 'server_error' as const,
  message: 'Error del servidor',
  shortText: 'X',
}

describe('useStoreSearchData reset noAvailableCategories flag (#20)', () => {
  beforeEach(() => {
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clears the flag when a later search resolves to a different terminal error', async () => {
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const searchStore = useStoreSearchData()

    // First search → LLNRAG009 sets the flag.
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref(null), error: ref({ ...LLNRAG009 }) })
    await searchStore.search()
    expect(searchStore.noAvailableCategories).toBe(true)

    // Second search → a different terminal error. This path never assigns the
    // flag, so it must have been reset at the top of search().
    FETCH_AVAILABILITY.mockResolvedValue({ data: ref(null), error: ref({ ...SERVER_ERROR }) })
    await searchStore.search()
    expect(searchStore.noAvailableCategories).toBe(false)
  })
})
