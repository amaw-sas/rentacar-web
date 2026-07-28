import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #366 D4 — el código de reserva sobrevive al toast.
// Holdout: docs/specs/issue-366-cta-confirmar-reserva/scenarios/
//          cta-confirmar-reserva.scenarios.md (SCEN-366-05)
//
// Un 200 con `reservationStatus` que no mapea a ninguna ruta levanta
// `formSubmitLocked` (SCEN-322-E03): la reserva PUDO crearse y la web no lo sabe.
// Hasta ahora el `reserveCode` que devuelve el servidor en ese caso solo viajaba al
// toast, que muere a los 25 s; el usuario se queda sin el único identificador con
// el que puede reclamar. Estos tests ejercen `submitForm` de verdad — el resto de la
// cobertura de este store es regex sobre el fuente y no habría visto la diferencia
// entre asignar el ref y no asignarlo.

const RECORD = vi.fn()
const unknownStatusMessage = vi.fn()

vi.mock('../../composables/useRecordReservationForm', () => ({
  default: () => RECORD(),
}))

vi.mock('../../composables/useMessages', () => ({
  default: () => ({
    createReservationTechnicalErrorMessage: vi.fn(),
    createReservationUnknownStatusMessage: unknownStatusMessage,
  }),
}))

// `reservationStatus` desconocido = el que routeForReservationStatus no mapea.
const unknownStatusResponse = (reserveCode?: string) => ({
  data: ref({ reservationStatus: 'desconocido', reserveCode, id: 1 }),
  error: ref(null),
  analyticsValue: 0,
})

describe('useStoreReservationForm — el código del estado desconocido sobrevive (issue #366, D4)', () => {
  beforeEach(() => {
    vi.resetModules()
    RECORD.mockReset()
    unknownStatusMessage.mockReset()
    vi.stubGlobal('useState', () => ref({ categories: [], branches: [] }))
    vi.stubGlobal('navigateTo', vi.fn())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('nace en null: sin envío no hay código que mostrar', async () => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    expect(useStoreReservationForm().unknownStatusReserveCode).toBeNull()
  })

  it('retiene el reserveCode que el servidor devolvió con el status desconocido', async () => {
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const store = useStoreReservationForm()

    RECORD.mockResolvedValue(unknownStatusResponse('E2ECODE'))
    await store.submitForm({} as never)

    // El lock es la conducta vieja (SCEN-322-E03) y sigue en pie; el código es lo nuevo.
    expect(store.formSubmitLocked).toBe(true)
    expect(store.unknownStatusReserveCode).toBe('E2ECODE')
    // El toast sigue recibiéndolo: D4 añade una superficie, no reemplaza la existente.
    expect(unknownStatusMessage).toHaveBeenCalledWith('E2ECODE')
  })

  it('deja el ref en null —no undefined— si el servidor omite el código', async () => {
    // RecordReservationApiData lo declara `string`, pero el propio
    // createReservationUnknownStatusMessage acepta null/undefined porque la respuesta
    // real no siempre lo trae. El bloque de D3 hace `v-if` sobre este ref: un
    // `undefined` colado aquí lo dejaría pintando un código vacío.
    const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
    const store = useStoreReservationForm()

    RECORD.mockResolvedValue(unknownStatusResponse(undefined))
    await store.submitForm({} as never)

    expect(store.formSubmitLocked).toBe(true)
    expect(store.unknownStatusReserveCode).toBeNull()
  })
})
