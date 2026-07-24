import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #366 D7 — el código nuevo se limpia con el lock.
// Holdout: docs/specs/issue-366-cta-confirmar-reserva/scenarios/
//          cta-confirmar-reserva.scenarios.md (SCEN-366-05, última cláusula)
//
// `search()` baja `formSubmitLocked` en cada búsqueda nueva (SCEN-322-E03: nueva
// búsqueda = nueva reserva potencial). Si `unknownStatusReserveCode` no se limpia en
// ese mismo punto, la búsqueda siguiente desbloquea el submit pero deja colgado el
// código de la reserva ANTERIOR, listo para reaparecer en el próximo estado
// desconocido identificando una reserva que no es. El lock y el código tienen que
// tener exactamente la misma vida.

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

const SERVER_ERROR = {
  error: 'server_error' as const,
  message: 'Error del servidor',
  shortText: 'X',
}

describe('useStoreSearchData — una búsqueda nueva limpia el código del estado desconocido (issue #366, D7)', () => {
  beforeEach(() => {
    vi.resetModules()
    FETCH_AVAILABILITY.mockReset()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('limpia el código junto al lock, en el mismo punto de search()', async () => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const { default: useStoreSearchData } = await import('../useStoreSearchData')
    const formStore = useStoreReservationForm()
    const searchStore = useStoreSearchData()

    // Estado que deja un submit con status desconocido.
    formStore.formSubmitLocked = true
    formStore.unknownStatusReserveCode = 'VIEJO123'

    FETCH_AVAILABILITY.mockResolvedValue({ data: ref(null), error: ref({ ...SERVER_ERROR }) })
    await searchStore.search()

    expect(formStore.formSubmitLocked).toBe(false)
    expect(formStore.unknownStatusReserveCode).toBeNull()
  })
})
