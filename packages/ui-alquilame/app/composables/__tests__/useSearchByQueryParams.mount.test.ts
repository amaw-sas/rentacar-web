// @vitest-environment jsdom
//
// Issue #402 — SCEN-402-08: alquilame se comporta igual que alquicarros ante un
// enlace /reservas sin sede de devolución, o con una que no resuelve. El archivo
// diverge (aquí las asignaciones van antes del parseo de horas y no hay rama de
// reuse), pero lo que el usuario vive es idéntico. Holdout:
// docs/specs/issue-402-reservas-sin-lugar/scenarios/reservas-return-branch.scenarios.md
//
// Montaje hermético (sin Nuxt): `storeToRefs` a identidad porque los stores-stub
// ya son objetos de refs; los auto-imports se stubean como globals.
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
  branches?: Array<{ code: string; slug: string; city: string }>
  searchDispatched?: boolean
}

function stubEnvironment(opts: Options) {
  const branches = opts.branches ?? [PICKUP, RETURN]

  form = {
    lugarRecogida: ref(null),
    lugarDevolucion: ref(null),
    fechaRecogida: ref(null),
    fechaDevolucion: ref(null),
    horaRecogida: ref(null),
    horaDevolucion: ref(null),
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
  vi.stubGlobal('useSearch', () => ({ doSearch }))
  vi.stubGlobal('useMessages', () => ({ createMessage }))
}

const Host = defineComponent({
  setup() {
    useSearchByQueryParams()
    return () => h('div')
  },
})

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

describe('useSearchByQueryParams — sede de devolución (#402, alquilame)', () => {
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

  it('un código de sede legacy en lugar_devolucion conserva el one-way', () => {
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
