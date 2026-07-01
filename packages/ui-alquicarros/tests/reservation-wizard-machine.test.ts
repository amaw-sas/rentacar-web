/**
 * Paso 2 — Máquina de pasos del wizard (alquicarros).
 *
 * Encodes the unit-observable part of the holdout:
 *   - SCEN-W-01:  /reservas sin params → Paso 1 (busqueda).
 *   - SCEN-W-01b: /reservas?lugar_recogida=… (sin `paso`) → Paso 2 (vehiculo) directo.
 *   - SCEN-W-02:  tras next() desde busqueda con búsqueda ejecutada → vehiculo;
 *                 deriveStepFromRoute con paso=vehiculo → 2.
 *   - SCEN-W-05:  canAdvance('vehiculo') requiere gama seleccionada.
 *   - SCEN-W-07:  canAdvance('adicionales') siempre true (paso opcional).
 *   - SCEN-W-09:  deep-link de ciudad (search en path params) → Paso 2.
 *   - SCEN-W-10:  goTo hacia atrás preserva maxReachedStep (no resetea el avance).
 *   - SCEN-W-14:  deep-link con `categoria` en el path → Paso 3 (seguro).
 */
import { describe, it, expect } from 'vitest'
import {
  WIZARD_STEPS,
  stepNumber,
  deriveStepFromRoute,
  createWizardMachine,
  canAdvance,
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

  it('seguro always advances (Básico preseleccionado)', () => {
    expect(canAdvance('seguro', {})).toBe(true)
  })

  it('adicionales always advances (paso opcional — SCEN-W-07)', () => {
    expect(canAdvance('adicionales', {})).toBe(true)
  })

  it('datos is gated by form validity', () => {
    expect(canAdvance('datos', {})).toBe(false)
    expect(canAdvance('datos', { formValid: true })).toBe(true)
  })
})
