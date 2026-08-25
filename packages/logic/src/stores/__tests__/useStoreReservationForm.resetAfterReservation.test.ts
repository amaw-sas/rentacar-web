import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Issue #472 — el Atrás desde la página de gracias deja el formulario con el
// cliente anterior y el botón girando para siempre.
// Holdout: docs/specs/reset-post-reserva/scenarios/reset-post-reserva.scenarios.md
//          (SCEN-001, SCEN-002, SCEN-003, SCEN-004, SCEN-005, SCEN-006, SCEN-007)
//
// `submitForm` deja `isSubmittingForm` en true a propósito para que un segundo clic
// no dispare otro POST mientras navega, y nadie la vuelve a bajar. Atrás es
// navegación de cliente, así que Pinia nunca se reconstruye: la bandera y los datos
// del cliente anterior sobreviven hasta una recarga manual.
//
// Estos tests ejercen `submitForm` de verdad hasta la rama /reservado — la única que
// congela `lastReservationSummary` — y luego el reset. Un test de regex sobre el
// fuente no habría visto la diferencia entre limpiar un ref y no limpiarlo.

const RECORD = vi.fn()

vi.mock('../../composables/useRecordReservationForm', () => ({
  default: () => RECORD(),
}))

vi.mock('../../composables/useMessages', () => ({
  default: () => ({
    createReservationTechnicalErrorMessage: vi.fn(),
    createReservationUnknownStatusMessage: vi.fn(),
  }),
}))

const confirmedResponse = (reserveCode = 'QA-472') => ({
  data: ref({ reservationStatus: 'reservado', reserveCode, id: 1 }),
  error: ref(null),
  analyticsValue: 0,
})

/** Datos del cliente A más el contexto de búsqueda que el operador ya tecleó. */
function fillClientA(store: Record<string, unknown>) {
  store.nombreCompleto = 'ClienteA'
  store.apellidos = 'ApellidoA'
  store.tipoIdentificacion = 'Cedula Ciudadania'
  store.identificacion = '1020304050'
  store.telefono = '+573001234567'
  store.email = 'clientea@example.com'
  store.referido = 'instagram'
  store.conductorAdicionalNombre = 'Acompañante A'
  store.conductorAdicionalIdentificacion = '9988776655'
  store.politicaPrivacidad = true
  store.vehiculo = 'C'
  store.haveTotalInsurance = true
  store.haveMonthlyReservation = true
  store.selectedMonthlyMileage = '2k_kms'
  // Contexto de búsqueda: esto NO se borra (SCEN-004).
  store.lugarRecogida = 'AABOT'
  store.lugarDevolucion = 'AABOT'
  store.fechaRecogida = '2026-08-26'
  store.fechaDevolucion = '2026-09-02'
  store.horaRecogida = '12:00'
  store.horaDevolucion = '12:00'
}

async function bootStore() {
  const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
  return useStoreReservationForm()
}

describe('useStoreReservationForm — el siguiente cliente empieza limpio (issue #472)', () => {
  beforeEach(() => {
    vi.resetModules()
    RECORD.mockReset()
    vi.stubGlobal('useState', () => ref({ categories: [], branches: [] }))
    vi.stubGlobal('navigateTo', vi.fn())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Precondición del bug: sin esto, el resto de los escenarios no tendrían sentido.
  it('tras un envío exitoso la bandera de envío se queda levantada', async () => {
    RECORD.mockResolvedValue(confirmedResponse())
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)

    await store.submitForm({} as never)

    expect(store.isSubmittingForm).toBe(true)
  })

  // SCEN-003: el botón de envío responde.
  it('releaseSubmitFlags baja las tres banderas del envío', async () => {
    RECORD.mockResolvedValue(confirmedResponse())
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)
    await store.submitForm({} as never)
    store.formSubmitLocked = true
    store.unknownStatusReserveCode = 'QA-472'

    store.releaseSubmitFlags()

    expect(store.isSubmittingForm).toBe(false)
    expect(store.formSubmitLocked).toBe(false)
    expect(store.unknownStatusReserveCode).toBeNull()
  })

  // SCEN-007: sin disponibilidad reintenta el MISMO cliente — no le borres los datos.
  it('releaseSubmitFlags conserva la identidad del cliente', async () => {
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)

    store.releaseSubmitFlags()

    expect(store.nombreCompleto).toBe('ClienteA')
    expect(store.identificacion).toBe('1020304050')
    expect(store.telefono).toBe('+573001234567')
    expect(store.email).toBe('clientea@example.com')
  })

  // SCEN-001 y SCEN-002: identidad fuera, consentimiento fuera.
  it('resetAfterReservation borra la identidad y el consentimiento del cliente anterior', async () => {
    RECORD.mockResolvedValue(confirmedResponse())
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)
    await store.submitForm({} as never)

    store.resetAfterReservation()

    expect(store.nombreCompleto).toBeNull()
    expect(store.apellidos).toBeNull()
    expect(store.tipoIdentificacion).toBeNull()
    expect(store.identificacion).toBeNull()
    expect(store.telefono).toBeNull()
    expect(store.email).toBeNull()
    expect(store.referido).toBeNull()
    expect(store.conductorAdicionalNombre).toBeNull()
    expect(store.conductorAdicionalIdentificacion).toBeNull()
    // Ley 1581/2012: el consentimiento de A no autoriza a B (mismo defecto que #311).
    expect(store.politicaPrivacidad).toBe(false)
  })

  // SCEN-003 vía el reset completo: también libera el envío.
  it('resetAfterReservation deja el botón de envío operativo', async () => {
    RECORD.mockResolvedValue(confirmedResponse())
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)
    await store.submitForm({} as never)

    store.resetAfterReservation()

    expect(store.isSubmittingForm).toBe(false)
    expect(store.formSubmitLocked).toBe(false)
    expect(store.unknownStatusReserveCode).toBeNull()
  })

  // SCEN-006: el seguro de A no le cambia el precio a B.
  it('resetAfterReservation borra las elecciones de ESTA reserva', async () => {
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)

    store.resetAfterReservation()

    expect(store.vehiculo).toBeNull()
    expect(store.haveTotalInsurance).toBe(false)
    expect(store.haveMonthlyReservation).toBe(false)
    expect(store.selectedMonthlyMileage).toBeNull()
  })

  // SCEN-004: la búsqueda sobrevive — el operador no re-teclea lo que no cambió.
  it('resetAfterReservation conserva sedes, fechas y horas', async () => {
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)

    store.resetAfterReservation()

    expect(store.lugarRecogida).toBe('AABOT')
    expect(store.lugarDevolucion).toBe('AABOT')
    expect(store.fechaRecogida).toBe('2026-08-26')
    expect(store.fechaDevolucion).toBe('2026-09-02')
    expect(store.horaRecogida).toBe('12:00')
    expect(store.horaDevolucion).toBe('12:00')
  })

  // SCEN-005: la confirmación lee el snapshot congelado. Si el reset lo borrara,
  // el recap desaparecería justo en la página que lo tiene que mostrar.
  it('resetAfterReservation NO toca el snapshot que pinta la confirmación', async () => {
    RECORD.mockResolvedValue(confirmedResponse('QA-472'))
    const store = await bootStore()
    fillClientA(store as unknown as Record<string, unknown>)
    await store.submitForm({} as never)

    const summaryBefore = store.lastReservationSummary
    expect(summaryBefore?.code).toBe('QA-472')
    // `stripReservarParam` corta en `if (!import.meta.client)`, que aquí es falso,
    // así que el one-shot no llega a escribirse solo. Se pone a mano: lo que este
    // test tiene que probar es que el reset NO lo borra, no cómo se llenó.
    store.lastSubmittedCode = 'C'

    store.resetAfterReservation()

    expect(store.lastReservationSummary).toBe(summaryBefore)
    expect(store.lastReservationSummary?.code).toBe('QA-472')
    // El one-shot que impide reabrir el resumen al retroceder sigue puesto.
    expect(store.lastSubmittedCode).toBe('C')
  })
})
