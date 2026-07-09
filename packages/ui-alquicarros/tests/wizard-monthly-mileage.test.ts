import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Kilometraje mensual en el wizard de alquicarros.
 * Holdout: docs/specs/alquicarros-mensualidad/scenarios/wizard-mileage.scenarios.md
 *
 * Contexto (verificado en runtime antes de implementar): el wizard reemplazó
 * CategoryCard y no portó el selector de kilometraje. `withMileage` (instancia
 * useCategory) arranca en "1k_kms" pero `selectedMonthlyMileage` (store) arranca en
 * null y nadie lo escribía → useRecordReservationForm caía en la rama regular y el
 * POST /record iba sin `monthly_mileage` y con `total_price: 0`.
 *
 * Estos tests son estructurales (leen la fuente). El comportamiento observable lo
 * cubre e2e/alquicarros-reserva-mensual.spec.ts.
 */
const read = (rel: string) => readFileSync(fileURLToPath(new URL(`../app/${rel}`, import.meta.url)), 'utf-8')

const wizard = read('components/wizard/ReservationWizard.vue')
const coverage = read('components/wizard/steps/StepCoverage.vue')
const stepper = read('components/wizard/WizardStepper.vue')
const summary = read('components/wizard/WizardSummary.vue')
const vehicle = read('components/wizard/steps/StepVehicle.vue')

describe('SCEN-ACM-04/06 — los flags del form se DERIVAN de la instancia', () => {
  it('ReservationWizard escribe selectedMonthlyMileage', () => {
    expect(wizard).toMatch(/selectedMonthlyMileage/)
  })

  it('la derivación cubre kilometraje y seguro en el mismo watcher', () => {
    // Un solo punto de sincronización: si el watcher desaparece, ambos flags
    // vuelven a depender de que cada handler de paso recuerde escribirlos.
    const watcher = wizard.match(/watch\(\s*\(\)\s*=>\s*\[[^\]]*withMileage[\s\S]*?\)\s*$/m)?.[0] ?? ''
    expect(watcher, 'watcher de derivación presente').not.toBe('')
    expect(watcher).toMatch(/haveTotalInsurance\.value\s*=/)
    expect(watcher).toMatch(/selectedMonthlyMileage\.value\s*=/)
  })

  it('selectedMonthlyMileage se limpia cuando la reserva NO es mensual (SCEN-ACM-05)', () => {
    expect(wizard).toMatch(/haveMonthlyReservation\.value\s*&&\s*sc\s*\?[\s\S]{0,60}:\s*null/)
  })

  it('ningún paso escribe haveTotalInsurance a mano (fuente única)', () => {
    // Las 3 asignaciones imperativas (StepVehicle.onSelect, StepCoverage.choose,
    // preselección de gama) son justamente el mecanismo que dejó caer el kilometraje.
    expect(vehicle).not.toMatch(/haveTotalInsurance\.value\s*=/)
    expect(coverage).not.toMatch(/haveTotalInsurance\.value\s*=/)
    const assignments = wizard.match(/haveTotalInsurance\.value\s*=/g) ?? []
    expect(assignments.length, 'solo la asignación del watcher').toBe(1)
  })

  it('StepVehicle conserva el early-return de re-tap (SCEN-ACM-07)', () => {
    expect(vehicle).toMatch(/if\s*\(\s*cat\.categoryCode\.value\s*===\s*selectedCode\.value\s*\)\s*return/)
  })
})

describe('SCEN-ACM-01/02 — el selector de kilometraje vive en el Paso 3', () => {
  it('el bloque está gateado por haveMonthlyReservation', () => {
    expect(coverage).toMatch(/haveMonthlyReservation/)
    expect(coverage).toMatch(/v-if="haveMonthlyReservation"/)
  })

  it('ofrece 1k y 2k, nunca 3k', () => {
    expect(coverage).toMatch(/1k_kms/)
    expect(coverage).toMatch(/2k_kms/)
    expect(coverage).not.toMatch(/3k_kms/)
  })

  it('2k solo se oferta si su precio es positivo', () => {
    expect(coverage).toMatch(/\['2k_kms'\]\s*>\s*0|\["2k_kms"\]\s*>\s*0/)
  })

  it('elegir plan escribe la instancia, no el store', () => {
    expect(coverage).toMatch(/sc\.withMileage\s*=/)
    expect(coverage).not.toMatch(/selectedMonthlyMileage\.value\s*=/)
  })

  it('los precios salen de pickPriceForDate (la MISMA fila que cobra useCategory)', () => {
    expect(coverage).toMatch(/pickPriceForDate/)
    expect(coverage).toMatch(/fechaRecogida/)
  })
})

describe('SCEN-ACM-08 — el costo del Seguro Total usa la unidad correcta', () => {
  it('en mensual muestra total_insurance_price por mes, no el cargo diario', () => {
    expect(coverage).toMatch(/total_insurance_price/)
    // El literal "/ día" ya no puede ser incondicional.
    expect(coverage).not.toMatch(/\+ \$ \{\{ coverageDailyPrice \}\} \/ día/)
    expect(coverage).toMatch(/mes/)
  })
})

describe('SCEN-ACM-01 — el stepper nombra el paso según el tipo de reserva', () => {
  it('STEP_LABELS es reactivo y cambia a "Seguro y km" en mensual', () => {
    expect(stepper).toMatch(/Seguro y km/)
    expect(stepper).toMatch(/haveMonthlyReservation/)
    expect(stepper, 'ya no es un array const').not.toMatch(/const STEP_LABELS = \[[^\]]*\] as const/)
  })
})

describe('SCEN-ACM-03 — el resumen refleja el plan elegido', () => {
  it('WizardSummary muestra una fila de Kilometraje en mensual', () => {
    expect(summary).toMatch(/Kilometraje/)
    expect(summary).toMatch(/withMileage/)
    expect(summary).toMatch(/haveMonthlyReservation/)
  })
})
