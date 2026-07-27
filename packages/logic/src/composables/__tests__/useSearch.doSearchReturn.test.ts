/**
 * Issue #402. El aviso «Sede de devolución no reconocida» solo tiene sentido si
 * la búsqueda llegó a salir: doSearch abre con flushMessages(), y además tiene
 * dos guards que devuelven sin buscar. Un enlace con la sede rota Y la fecha
 * pasada produciría dos toasts que se contradicen. Para que las marcas puedan
 * condicionar el aviso, doSearch informa si buscó.
 *
 * Holdout: docs/specs/issue-402-reservas-sin-lugar/scenarios/reservas-return-branch.scenarios.md
 * Sostiene SCEN-402-07.
 *
 * Test de COMPORTAMIENTO. Los otros useSearch.*.test.ts son regex sobre el texto
 * del archivo y no pueden observar un retorno. El precedente ejecutable es
 * useSearch.sharedInstance.test.ts:39-81, y hay que copiarlo entero: el
 * beforeEach monta el entorno, y la disciplina de effectScope del cuerpo evita
 * que la instancia de createSharedComposable se filtre entre tests sujetando
 * refs de la Pinia anterior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, effectScope } from 'vue'

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

// Fechas muy adelantadas para que el test no caduque con el reloj real:
// pickupTimingIssue compara contra createCurrentDateTimeObject().
const FUTURE_PICKUP = '2099-09-15'
const FUTURE_RETURN = '2099-09-18'
const PAST_PICKUP = '2020-01-01'
// Rango invertido, no de longitud cero: con recogida y devolución el MISMO día
// el watcher immediate de returnHourOptions (useSearch.ts:556-565) reengancha
// horaDevolucion al slot abierto más cercano, que es posterior a la recogida, y
// selectedDays deja de ser 0. La devolución ANTES de la recogida es además el
// caso que el guard documenta: un deep-link que siembra el rango al revés.
const INVERTED_RETURN = '2099-09-14'

/**
 * Siembra el formulario y devuelve `doSearch` con `search` ya stubeada.
 *
 * El orden importa: useSearch.ts:113 destructura `search` del store AL CREAR la
 * instancia, así que un spy instalado después no se observa nunca. Y `search` es
 * una acción async real que hace $fetch — stub, no spy.
 */
async function buildDoSearch(form: {
  fechaRecogida: string
  fechaDevolucion: string
  horaRecogida?: string
}) {
  const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
  const { default: useStoreSearchData } = await import('../../stores/useStoreSearchData')
  const { default: useSearch } = await import('../useSearch')

  const searchSpy = vi.fn()
  const storeSearchData = useStoreSearchData()
  storeSearchData.search = searchSpy

  const storeForm = useStoreReservationForm()
  storeForm.lugarRecogida = 'AABOT'
  storeForm.lugarDevolucion = 'AABOT'
  storeForm.fechaRecogida = form.fechaRecogida
  storeForm.fechaDevolucion = form.fechaDevolucion
  storeForm.horaRecogida = form.horaRecogida ?? '10:00'
  storeForm.horaDevolucion = '10:00'

  const scope = effectScope()
  const instance = scope.run(() => useSearch())!
  return { doSearch: instance.doSearch, searchSpy, scope }
}

describe('useSearch — doSearch informa si buscó (issue #402)', () => {
  beforeEach(() => {
    // La instancia de createSharedComposable vive en el closure del módulo. El
    // effectScope de abajo la libera vía tryOnScopeDispose, pero resetear el
    // registro de módulos hace que cada test parta de cero sin depender de eso.
    vi.resetModules()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve false y no busca cuando la fecha de recogida ya pasó', async () => {
    const { doSearch, searchSpy, scope } = await buildDoSearch({
      fechaRecogida: PAST_PICKUP,
      fechaDevolucion: FUTURE_RETURN,
    })

    expect(doSearch()).toBe(false)
    expect(searchSpy).not.toHaveBeenCalled()

    scope.stop()
  })

  it('devuelve false y no busca cuando la devolución no es posterior a la recogida', async () => {
    const { doSearch, searchSpy, scope } = await buildDoSearch({
      fechaRecogida: FUTURE_PICKUP,
      fechaDevolucion: INVERTED_RETURN,
    })

    expect(doSearch()).toBe(false)
    expect(searchSpy).not.toHaveBeenCalled()

    scope.stop()
  })

  it('devuelve true y busca cuando los parámetros son válidos', async () => {
    const { doSearch, searchSpy, scope } = await buildDoSearch({
      fechaRecogida: FUTURE_PICKUP,
      fechaDevolucion: FUTURE_RETURN,
    })

    expect(doSearch()).toBe(true)
    expect(searchSpy).toHaveBeenCalledTimes(1)

    scope.stop()
  })
})
