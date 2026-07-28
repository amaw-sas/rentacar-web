/**
 * Paso 2 — Máquina de pasos del wizard (alquicarros).
 *
 * Encodes the unit-observable part of the holdout:
 *   - SCEN-W-01:  /reservas sin params → Paso 1 (busqueda).
 *   - SCEN-W-01b: /reservas?lugar_recogida=… (sin `paso`) → Paso 2 (vehiculo) directo.
 *   - SCEN-W-02:  tras next() desde busqueda con búsqueda ejecutada → vehiculo;
 *                 deriveStepFromRoute con paso=vehiculo → 2.
 *   - SCEN-W-05:  canAdvance('vehiculo') requiere gama seleccionada.
 *   - SCEN-W-07:  los pasos posteriores a Vehículo (seguro/adicionales/datos) no
 *                 imponen requisitos PROPIOS, pero ninguno avanza con la gama
 *                 anulada — precondición del flujo, no del paso (enmendado por #401).
 *   - SCEN-W-09:  deep-link de ciudad (search en path params) → Paso 2.
 *   - SCEN-W-10:  goTo hacia atrás preserva maxReachedStep (no resetea el avance).
 *   - SCEN-W-14:  deep-link con `categoria` en el path → Paso 3 (seguro).
 *   - SCEN-401:   computeStaleTransition — invalidación de la cotización por deriva
 *                 del tramo (captura, adopción, pestillo, idempotencia).
 */
import { describe, it, expect } from 'vitest'
import {
  WIZARD_STEPS,
  stepNumber,
  deriveStepFromRoute,
  createWizardMachine,
  canAdvance,
  computeStaleTransition,
} from '~/composables/useReservationWizard'

describe('WIZARD_STEPS — order + numbering', () => {
  it('has the five steps in order', () => {
    expect(WIZARD_STEPS).toEqual([
      'busqueda',
      'vehiculo',
      'seguro',
      'adicionales',
      'datos',
    ])
  })

  it('numbers steps 1..5', () => {
    expect(stepNumber('busqueda')).toBe(1)
    expect(stepNumber('vehiculo')).toBe(2)
    expect(stepNumber('seguro')).toBe(3)
    expect(stepNumber('adicionales')).toBe(4)
    expect(stepNumber('datos')).toBe(5)
  })
})

describe('deriveStepFromRoute — SSR-stable step from URL', () => {
  it('no search params → busqueda (SCEN-W-01)', () => {
    expect(deriveStepFromRoute({})).toBe('busqueda')
    expect(deriveStepFromRoute({ query: {}, params: {} })).toBe('busqueda')
  })

  it('/reservas?lugar_recogida=… without paso → vehiculo directo (SCEN-W-01b)', () => {
    expect(deriveStepFromRoute({ query: { lugar_recogida: 'sede-norte' } })).toBe('vehiculo')
  })

  it('explicit later paso in query wins (share advanced step)', () => {
    expect(
      deriveStepFromRoute({ query: { lugar_recogida: 'sede-norte', paso: 'seguro' } }),
    ).toBe('seguro')
    expect(
      deriveStepFromRoute({ query: { lugar_recogida: 'sede-norte', paso: 'datos' } }),
    ).toBe('datos')
  })

  it('paso alone (no search params) does NOT skip Paso 1', () => {
    expect(deriveStepFromRoute({ query: { paso: 'vehiculo' } })).toBe('busqueda')
  })

  it('city deep-link with search in PATH params → vehiculo (SCEN-W-09)', () => {
    expect(
      deriveStepFromRoute({ params: { lugar_recogida: 'sede-norte', hora_devolucion: '10-00' } }),
    ).toBe('vehiculo')
  })

  it('deep-link with categoria segment in path → seguro (SCEN-W-14)', () => {
    expect(
      deriveStepFromRoute({ params: { lugar_recogida: 'sede-norte', categoria: 'C' } }),
    ).toBe('seguro')
  })

  it('ignores an unknown paso value, falling back to vehiculo when search is present', () => {
    expect(
      deriveStepFromRoute({ query: { lugar_recogida: 'x', paso: 'no-such-step' } }),
    ).toBe('vehiculo')
  })

  it('whitespace-only lugar_recogida does NOT count as a search → busqueda', () => {
    expect(deriveStepFromRoute({ query: { lugar_recogida: '   ' } })).toBe('busqueda')
    expect(deriveStepFromRoute({ query: { lugar_recogida: '' } })).toBe('busqueda')
  })

  it('handles array-valued params (Nuxt string[]) by reading the first value', () => {
    expect(deriveStepFromRoute({ query: { lugar_recogida: ['sede-norte', 'x'] } })).toBe('vehiculo')
    expect(
      deriveStepFromRoute({ query: { lugar_recogida: ['x'], paso: ['seguro'] } }),
    ).toBe('seguro')
  })

  it('categoria path deep-link takes precedence over a shared paso query', () => {
    expect(
      deriveStepFromRoute({
        params: { lugar_recogida: 'sede-norte', categoria: 'C' },
        query: { paso: 'datos' },
      }),
    ).toBe('seguro')
  })
})

describe('createWizardMachine — navigation + reached tracking', () => {
  it('starts at the given step with maxReached = that step', () => {
    const m = createWizardMachine('busqueda')
    expect(m.currentStep.value).toBe('busqueda')
    expect(m.currentStepNumber.value).toBe(1)
    expect(m.maxReachedStep.value).toBe(1)
  })

  it('next() advances one step and bumps maxReached (SCEN-W-02)', () => {
    const m = createWizardMachine('busqueda')
    m.next()
    expect(m.currentStep.value).toBe('vehiculo')
    expect(m.maxReachedStep.value).toBe(2)
  })

  it('goTo back to an earlier step preserves maxReached — no reset of progress (SCEN-W-10)', () => {
    const m = createWizardMachine('busqueda')
    m.next() // vehiculo (2)
    m.next() // seguro (3)
    m.next() // adicionales (4)
    expect(m.maxReachedStep.value).toBe(4)

    const ok = m.goTo('vehiculo')
    expect(ok).toBe(true)
    expect(m.currentStepNumber.value).toBe(2)
    expect(m.maxReachedStep.value).toBe(4) // progress kept

    m.next() // forward again into already-reached territory
    expect(m.currentStepNumber.value).toBe(3)
    expect(m.maxReachedStep.value).toBe(4)
  })

  it('goTo a not-yet-reached step is a no-op (cannot skip ahead)', () => {
    const m = createWizardMachine('busqueda') // maxReached = 1
    const ok = m.goTo('datos')
    expect(ok).toBe(false)
    expect(m.currentStep.value).toBe('busqueda')
    expect(m.maxReachedStep.value).toBe(1)
  })

  it('goTo rejects a fractional/NaN step number (never lands on undefined)', () => {
    const m = createWizardMachine('busqueda')
    m.next() // vehiculo
    m.next() // seguro (maxReached = 3)
    expect(m.goTo(2.5)).toBe(false)
    expect(m.goTo(Number.NaN)).toBe(false)
    // currentStep stays a real step, never undefined
    expect(WIZARD_STEPS).toContain(m.currentStep.value)
    expect(m.currentStep.value).toBe('seguro')
  })

  it('back() moves one step earlier, never below step 1', () => {
    const m = createWizardMachine('busqueda')
    m.next() // vehiculo
    m.back()
    expect(m.currentStep.value).toBe('busqueda')
    m.back() // already at 1
    expect(m.currentStep.value).toBe('busqueda')
  })
})

describe('canAdvance — per-step gating', () => {
  it('busqueda requires the search to have executed', () => {
    expect(canAdvance('busqueda', {})).toBe(false)
    expect(canAdvance('busqueda', { searchExecuted: true })).toBe(true)
  })

  it('vehiculo requires a selected gama (SCEN-W-05)', () => {
    expect(canAdvance('vehiculo', {})).toBe(false)
    expect(canAdvance('vehiculo', { hasSelectedCategory: true })).toBe(true)
  })

  // SCEN-W-07 (enmendado por #401): seguro/adicionales no imponen requisitos
  // PROPIOS, pero ninguno avanza con la gama anulada — es una precondición del
  // flujo. La formulación vieja ("siempre true") dejaba llegar a un "Confirmar
  // reserva" mudo cuando la cotización se anulaba bajo los pies del usuario.
  it('seguro requires a live gama — no impone requisito propio pero no avanza sin gama (SCEN-W-07)', () => {
    expect(canAdvance('seguro', {})).toBe(false)
    expect(canAdvance('seguro', { hasSelectedCategory: true })).toBe(true)
  })

  it('adicionales requires a live gama — opcional pero no avanza sin gama (SCEN-W-07)', () => {
    expect(canAdvance('adicionales', {})).toBe(false)
    expect(canAdvance('adicionales', { hasSelectedCategory: true })).toBe(true)
  })

  // Reconciliación #366 × #401: `datos` NO gatea por consentimiento (el único campo que
  // #366 quitó, porque valibot ya bloquea el submit sin él — no emite @submit → cero POST,
  // y gatearlo además producía un botón mudo), pero SÍ exige gama viva (#401: la deriva del
  // tramo anula la gama, y sin ella «Confirmar reserva» quedaba mudo — SCEN-W-07 enmendado).
  // En el Paso 5 real hasSelectedCategory siempre es true (se eligió en el Paso 2), así que
  // el CTA es pulsable salvo que la cotización se haya invalidado bajo los pies del usuario.
  it('datos no gatea por consentimiento (#366) pero exige gama viva (#401)', () => {
    // #366: el consentimiento ya no lo apaga. `formValid` salió del interface; un extra
    // desconocido no debe reintroducir el gate por la puerta de atrás.
    expect(canAdvance('datos', { hasSelectedCategory: true })).toBe(true)
    // #401: sin gama viva (deriva del tramo → gama anulada) no avanza.
    expect(canAdvance('datos', {})).toBe(false)
    expect(canAdvance('datos', { hasSelectedCategory: false })).toBe(false)
  })
})

describe('computeStaleTransition — invalidación por deriva del tramo (#401)', () => {
  const AABOT = 'BOG-A|BOG-A|2026-08-01|2026-08-05|10:00|10:00'
  const MED = 'BOG-A|MED-P|2026-08-01|2026-08-05|10:00|10:00'

  it('guard 1 — búsqueda nueva (pending false→true) captura el tramo, baja el pestillo y descarta la gama', () => {
    const r = computeStaleTransition({
      isPending: true,
      wasPending: false,
      liveSignature: AABOT,
      quotedSignature: null,
      stale: false,
    })
    expect(r.quotedSignature).toBe(AABOT)
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(true)
  })

  it('guard 1 — una búsqueda nueva baja un pestillo ya encendido (recuperación tras rancia — SCEN-401-08)', () => {
    const r = computeStaleTransition({
      isPending: true,
      wasPending: false,
      liveSignature: MED,
      quotedSignature: AABOT,
      stale: true,
    })
    expect(r.quotedSignature).toBe(MED)
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(true)
  })

  it('guard 2 — la búsqueda RESUELVE sin captura previa (montaje con pending=true) adopta el tramo vivo (SCEN-401-13)', () => {
    const r = computeStaleTransition({
      isPending: false,
      wasPending: true,
      liveSignature: AABOT,
      quotedSignature: null,
      stale: false,
    })
    expect(r.quotedSignature).toBe(AABOT)
    expect(r.stale).toBe(false)
    // No anula la gama: adoptar es best-effort, no una invalidación.
    expect(r.clearSelection).toBe(false)
  })

  it('guard 2 — una segunda búsqueda sin flanco (true sobre true) adopta el tramo al RESOLVER, no latchea sobre resultados frescos (edge-case gate)', () => {
    // quoted apunta a la búsqueda #1 (AABOT); la #2 se arrancó sin flanco y trae
    // resultados de MED. Al resolver, adoptamos MED y bajamos el pestillo: los
    // resultados en pantalla son del tramo vivo, no rancios.
    const r = computeStaleTransition({
      isPending: false,
      wasPending: true,
      liveSignature: MED,
      quotedSignature: AABOT,
      stale: false,
    })
    expect(r.quotedSignature).toBe(MED)
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(false)
  })

  it('guard 6 (in-flight) — reescritura de refs con una búsqueda EN VUELO no latchea (isPending true) — evita ocultar resultados que vienen en camino (edge-case gate)', () => {
    const r = computeStaleTransition({
      isPending: true,
      wasPending: true,
      liveSignature: MED,
      quotedSignature: AABOT,
      stale: false,
    })
    // Sin latch, sin anular gama: la resolución (guard 2) adoptará el tramo.
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(false)
    expect(r.quotedSignature).toBe(AABOT)
  })

  it('guard 3 — nada consultado (quoted=null) y sin flanco de pending → nada rancio', () => {
    const r = computeStaleTransition({
      isPending: false,
      wasPending: false,
      liveSignature: MED,
      quotedSignature: null,
      stale: false,
    })
    expect(r.quotedSignature).toBeNull()
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(false)
  })

  it('guard 4 — ya latcheado: idempotente, no vuelve a anular ni togglea (SCEN-401-08b)', () => {
    const r = computeStaleTransition({
      isPending: false,
      wasPending: false,
      liveSignature: MED,
      quotedSignature: AABOT,
      stale: true,
    })
    expect(r.stale).toBe(true)
    expect(r.clearSelection).toBe(false)
    expect(r.quotedSignature).toBe(AABOT)
  })

  it('guard 5 — el tramo vivo sigue siendo el consultado → no invalida (camino feliz, SCEN-401-05)', () => {
    const r = computeStaleTransition({
      isPending: false,
      wasPending: false,
      liveSignature: AABOT,
      quotedSignature: AABOT,
      stale: false,
    })
    expect(r.stale).toBe(false)
    expect(r.clearSelection).toBe(false)
  })

  it('guard 6 — el tramo vivo dejó de coincidir → enciende el pestillo y anula la gama (SCEN-401-01/-03/-03b)', () => {
    const r = computeStaleTransition({
      isPending: false,
      wasPending: false,
      liveSignature: MED,
      quotedSignature: AABOT,
      stale: false,
    })
    expect(r.stale).toBe(true)
    expect(r.clearSelection).toBe(true)
    expect(r.quotedSignature).toBe(AABOT)
  })

  it('pestillo asimétrico — deshacer la edición NO baja el pestillo (SCEN-401-11)', () => {
    // Vuelvo a la firma consultada, pero ya latcheado: sigue rancio (no hay
    // disponibilidad que recuperar sin re-buscar). Guard 4 gana antes que guard 5.
    const r = computeStaleTransition({
      isPending: false,
      wasPending: false,
      liveSignature: AABOT,
      quotedSignature: AABOT,
      stale: true,
    })
    expect(r.stale).toBe(true)
    expect(r.clearSelection).toBe(false)
  })
})
