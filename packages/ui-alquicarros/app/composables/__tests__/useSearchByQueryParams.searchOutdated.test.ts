// @vitest-environment happy-dom
//
// alquicarros A cold load of /reservas?lugar_recogida=...&fecha_recogida=<today>&hora_recogida=<h>
// must not show "Actualiza tu búsqueda". The composable instantiates useSearch()
// BEFORE writing the params; useSearch's pickupHourOptions watcher (flush 'pre')
// then clamps an unavailable pickup hour AFTER doSearch() snapshotted the params.
// If the search goes out first, the snapshot diverges from the form and the store
// flags the (valid, current) results as outdated with no user action.
//
// Real stores + real useSearch + real composable; only the network is stubbed and
// "now" is pinned so the hour is deterministically clamped.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, effectScope } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Availability requests as the form looked WHEN the request was built (same
// source the real fetch reads: fullPickupDate).
const sent = vi.hoisted(() => [] as string[])
// Read synchronously, like the real fetch builds its body before its first await.
const reader = vi.hoisted(() => ({ pickup: (() => '') as () => string }))

vi.mock('../../../../logic/src/composables/useFetchCategoriesAvailabilityData', () => ({
  default: async () => {
    sent.push(reader.pickup())
    return { data: ref([]), error: ref(null) }
  },
}))

const ADMIN_PAYLOAD = {
  categories: [],
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('useSearchByQueryParams — same-day deep link, hour handling around the search', () => {
  let toastAdd: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    sent.length = 0
    toastAdd = vi.fn()
    // Fake only Date: the 50 ms debounce of the param watcher must stay real.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2030-06-15T10:00:00-05:00')) // Bogotá, the app's timezone — CI runs in UTC
    setActivePinia(createPinia())
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: toastAdd, clear: vi.fn() }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  async function load(query: Record<string, string>) {
    const { default: useStoreReservationForm } = await import('../../../../logic/src/stores/useStoreReservationForm')
    const { default: useStoreAdminData } = await import('../../../../logic/src/stores/useStoreAdminData')
    const { default: useStoreSearchData } = await import('../../../../logic/src/stores/useStoreSearchData')
    const { default: useSearch } = await import('../../../../logic/src/composables/useSearch')
    const { default: useMessages } = await import('../../../../logic/src/composables/useMessages')
    const { default: useSearchByQueryParams } = await import('../useSearchByQueryParams')

    vi.stubGlobal('useRoute', () => ({ params: {}, query }))
    vi.stubGlobal('useStoreReservationForm', useStoreReservationForm)
    vi.stubGlobal('useStoreAdminData', useStoreAdminData)
    vi.stubGlobal('useStoreSearchData', useStoreSearchData)
    vi.stubGlobal('useSearch', useSearch)
    vi.stubGlobal('useMessages', useMessages)

    const store = useStoreSearchData()
    const form = useStoreReservationForm()
    reader.pickup = () => String(form.fullPickupDate)
    const Host = defineComponent({
      setup() {
        useSearchByQueryParams()
        return () => h('div')
      },
    })
    const scope = effectScope()
    const wrapper = scope.run(() => mount(Host))!
    await flushPromises()
    await sleep(150) // let the 50 ms debounced param watcher fire
    const { animateSearchButton } = scope.run(() => useSearch())!
    return { store, form, animateSearchButton, done: () => { wrapper.unmount(); scope.stop() } }
  }

  const baseQuery = {
    lugar_recogida: 'bogota-aeropuerto',
    fecha_recogida: '2030-06-15',
    fecha_devolucion: '2030-06-17',
  }

  it('a clamp after the search never marks results outdated; the request keeps the link hour', async () => {
    // 10:15 is not a bookable slot (half-hour grid, 60-min same-day lead), so
    // useSearch's pre-flush watcher clamps it right after doSearch.
    const { store, form, animateSearchButton, done } = await load({
      ...baseQuery, hora_recogida: '10:15', hora_devolucion: '10:15',
    })

    // Request went out with the LINK's hour (behaviour before the notice existed)…
    expect(sent).toEqual(['2030-06-15T10:15:00'])
    // …the form was clamped afterwards…
    expect(form.horaRecogida).not.toBe('10:15')
    // …and that adjustment is not a user change.
    expect(store.pending).toBe(false)
    expect(store.categoriesAvailabilityData).not.toBeNull()
    expect(store.searchOutdated).toBe(false)
    expect(animateSearchButton.value).toBe(false)
    done()
  })

  it('a pickup hour already past today still shows the toast and does not search', async () => {
    const { store, done } = await load({
      ...baseQuery, hora_recogida: '08:00', hora_devolucion: '08:00',
    })

    expect(sent).toEqual([])
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Revisa la hora de recogida' }),
    )
    expect(store.searchOutdated).toBe(false)
    done()
  })
})
