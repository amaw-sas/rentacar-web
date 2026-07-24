// @vitest-environment jsdom
//
// Issue #402 — evidencia de comportamiento del driver de query de /reservas.
// El test de source vecino fija que el composable LEE route.query; este monta el
// composable de verdad y observa qué escribe en el formulario y qué le dice al
// usuario. Holdout:
// docs/specs/issue-402-reservas-sin-lugar/scenarios/reservas-return-branch.scenarios.md
//
// Montaje hermético (sin Nuxt): `storeToRefs` se mockea a identidad porque los
// stores-stub ya son objetos de refs, y los auto-imports se stubean como globals.
// `useMessages` incluido: el composable pasa a emitir avisos, y sin su stub el
// fallo parecería un bug del código.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, watch } from 'vue'
import type { Ref } from 'vue'

vi.mock('pinia', () => ({
  storeToRefs: (s: Record<string, unknown>) => s,
}))

import useSearchByQueryParams from '../useSearchByQueryParams'

const PICKUP = { code: 'AABOT', slug: 'bogota-aeropuerto', city: 'bogota' }
const RETURN = { code: 'AAMDE', slug: 'medellin-centro', city: 'medellin' }

const FUTURE_PICKUP = '2099-09-15'
const FUTURE_RETURN = '2099-09-18'

/** Registro compartido: sostiene la invariante de orden de emisión. */
let calls: string[] = []
let createMessage: ReturnType<typeof vi.fn>
let doSearch: ReturnType<typeof vi.fn>
/** Refs del formulario que el composable escribe. Claves explícitas: un
 *  Record<string, …> haría que cada acceso fuese posiblemente undefined. */
type FormStub = {
  lugarRecogida: Ref<string | null>
  lugarDevolucion: Ref<string | null>
  fechaRecogida: Ref<string | null>
  fechaDevolucion: Ref<string | null>
  horaRecogida: Ref<string | null>
  horaDevolucion: Ref<string | null>
  referido: Ref<string | null>
}
let form: FormStub

type Options = {
  query: Record<string, string>
  /** Sedes que el store sabe resolver. Vacío = store sin poblar. */
  branches?: Array<{ code: string; slug: string; city: string }>
  /** Qué devuelve doSearch: false = la búsqueda no salió. */
  searchDispatched?: boolean
  /** Estado de reuse (búsqueda viva + categoría elegida). */
  reusable?: { pickup: string; dropoff: string }
}

function stubEnvironment(opts: Options) {
  const branches = opts.branches ?? [PICKUP, RETURN]

  form = {
    lugarRecogida: ref(opts.reusable?.pickup ?? null),
    lugarDevolucion: ref(opts.reusable?.dropoff ?? null),
    fechaRecogida: ref(opts.reusable ? FUTURE_PICKUP : null),
    fechaDevolucion: ref(opts.reusable ? FUTURE_RETURN : null),
    horaRecogida: ref(opts.reusable ? '10:00' : null),
    horaDevolucion: ref(opts.reusable ? '10:00' : null),
    referido: ref(null),
  }

  // El watcher espejo REAL de useSearch.ts:236-240 (`flush: 'sync'`): al escribir
  // la recogida, la devolución la sigue. Sin él en el stub, invertir el orden de
  // las dos asignaciones del composable dejaría todos los tests en verde y
  // rompería el one-way en producción.
  watch(form.lugarRecogida, (v) => (form.lugarDevolucion.value = v), {
    flush: 'sync',
  })

  doSearch = vi.fn(() => {
    calls.push('doSearch')
    return opts.searchDispatched ?? true
  })
  createMessage = vi.fn((m: { title?: string }) => {
    calls.push(`createMessage:${m?.title ?? ''}`)
  })

  vi.stubGlobal('useRoute', () => ({ query: opts.query, params: {} }))
  vi.stubGlobal('useStoreReservationForm', () => form)
  // Fiel a useStoreAdminData.ts:44-64: slug primero, y si no, código en mayúsculas.
  vi.stubGlobal('useStoreAdminData', () => ({
    searchBranchBySlug: (slug: string) => branches.find((b) => b.slug === slug),
    searchBranchBySlugOrCode: (value: string) =>
      branches.find((b) => b.slug === value) ??
      branches.find((b) => b.code === value.toUpperCase()),
  }))
  vi.stubGlobal('useStoreSearchData', () => ({
    hasAvailableCategories: ref(Boolean(opts.reusable)),
    selectedCategory: ref(opts.reusable ? { categoryCode: 'C' } : null),
  }))
  vi.stubGlobal('useSearch', () => ({ doSearch }))
  vi.stubGlobal('useMessages', () => ({ createMessage }))
}

const Host = defineComponent({
  setup() {
    useSearchByQueryParams()
    return () => h('div')
  },
})

/** Mensajes de CORRECCIÓN de sede, que es lo que este issue introduce. */
const correctionMessages = () =>
  createMessage.mock.calls.filter(
    ([m]) => m?.title === 'Sede de devolución no reconocida',
  )

const baseQuery = {
  lugar_recogida: 'bogota-aeropuerto',
  fecha_recogida: FUTURE_PICKUP,
  fecha_devolucion: FUTURE_RETURN,
  hora_recogida: '10:00',
  hora_devolucion: '10:00',
}

beforeEach(() => {
  calls = []
})
afterEach(() => vi.unstubAllGlobals())

describe('useSearchByQueryParams — sede de devolución (#402, alquicarros)', () => {
  it('SCEN-402-01: sin lugar_devolucion devuelve en la sede de recogida, sin avisar', () => {
    stubEnvironment({ query: { ...baseQuery } })
    mount(Host)

    expect(form.lugarDevolucion.value).toBe('AABOT')
    expect(doSearch).toHaveBeenCalledTimes(1)
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('SCEN-402-02: un lugar_devolucion que no resuelve cotiza igual y avisa una vez', () => {
    stubEnvironment({
      query: { ...baseQuery, lugar_devolucion: 'sede-que-no-existe' },
    })
    mount(Host)

    expect(form.lugarDevolucion.value).toBe('AABOT')
    expect(doSearch).toHaveBeenCalledTimes(1)
    expect(correctionMessages()).toHaveLength(1)
  })

  it('SCEN-402-03: un one-way legítimo conserva su sede y no avisa', () => {
    stubEnvironment({
      query: { ...baseQuery, lugar_devolucion: 'medellin-centro' },
    })
    mount(Host)

    expect(form.lugarDevolucion.value).toBe('AAMDE')
    // El holdout dice «0 llamadas a createMessage», absoluto — no «0 con este
    // título». Afirmarlo así cubre también un segundo aviso que alguien añada.
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('SCEN-402-04: con la recogida irresoluble no se añade un segundo mensaje', () => {
    stubEnvironment({
      query: { ...baseQuery, lugar_recogida: 'sede-que-no-existe' },
      branches: [],
    })
    mount(Host)

    expect(form.lugarDevolucion.value).toBeNull()
    expect(correctionMessages()).toHaveLength(0)
  })

  it('SCEN-402-05: recogida irresoluble Y devolución inválida sigue sin avisar de corrección', () => {
    stubEnvironment({
      query: {
        ...baseQuery,
        lugar_recogida: 'sede-que-no-existe',
        lugar_devolucion: 'tampoco-existe',
      },
      branches: [],
    })
    mount(Host)

    expect(form.lugarDevolucion.value).toBeNull()
    expect(correctionMessages()).toHaveLength(0)
  })

  it('SCEN-402-06: al reusar una búsqueda viva no se busca ni se avisa', () => {
    stubEnvironment({
      query: { ...baseQuery },
      reusable: { pickup: 'AABOT', dropoff: 'AABOT' },
    })
    mount(Host)

    expect(doSearch).not.toHaveBeenCalled()
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('SCEN-402-07: si doSearch no llegó a buscar, el aviso de sede se calla', () => {
    stubEnvironment({
      query: { ...baseQuery, lugar_devolucion: 'sede-que-no-existe' },
      searchDispatched: false,
    })
    mount(Host)

    expect(doSearch).toHaveBeenCalledTimes(1)
    expect(correctionMessages()).toHaveLength(0)
    // Y la corrección TAMPOCO se aplica: una sede pisada sin avisar deja al
    // usuario reservando ida y vuelta cuando pidió one-way, y el aviso ya no
    // vuelve porque el Searcher re-busca desde el store, no desde la URL.
    expect(form.lugarDevolucion.value).toBeNull()
  })

  // Los tres siguientes salieron del gate de calidad (edge-case-detector), no
  // del holdout. Son huecos que los 8 escenarios no cubrían.

  it('una devolución rota NO se cuela por el atajo de reuse: busca y avisa', () => {
    // La corrección hace que la firma nueva coincida con la del store, así que
    // el atajo de reuse absorbería un cambio REAL de la URL: ni búsqueda ni
    // aviso, y la pantalla seguiría mostrando precios de ida y vuelta.
    stubEnvironment({
      query: { ...baseQuery, lugar_devolucion: 'sede-que-no-existe' },
      reusable: { pickup: 'AABOT', dropoff: 'AABOT' },
    })
    mount(Host)

    expect(doSearch).toHaveBeenCalledTimes(1)
    expect(correctionMessages()).toHaveLength(1)
  })

  it('un código de sede legacy en lugar_devolucion conserva el one-way', () => {
    // La superficie PATH acepta código además de slug (validateSearchParams usa
    // searchBranchBySlugOrCode). Sin esto, ?lugar_devolucion=AAMDE degradaba a
    // ida y vuelta con un aviso, en vez de respetar el itinerario pedido.
    stubEnvironment({ query: { ...baseQuery, lugar_devolucion: 'AAMDE' } })
    mount(Host)

    expect(form.lugarDevolucion.value).toBe('AAMDE')
    expect(correctionMessages()).toHaveLength(0)
  })

  it('un lugar_devolucion en blanco es ausencia, no una sede rota', () => {
    stubEnvironment({ query: { ...baseQuery, lugar_devolucion: '  ' } })
    mount(Host)

    expect(form.lugarDevolucion.value).toBe('AABOT')
    expect(correctionMessages()).toHaveLength(0)
  })

  it('invariante: ningún createMessage precede a doSearch (lo borraría el flush)', () => {
    stubEnvironment({
      query: { ...baseQuery, lugar_devolucion: 'sede-que-no-existe' },
    })
    mount(Host)

    const firstMessage = calls.findIndex((c) => c.startsWith('createMessage'))
    const search = calls.indexOf('doSearch')

    expect(search).toBeGreaterThanOrEqual(0)
    expect(firstMessage).toBeGreaterThan(search)
  })
})
