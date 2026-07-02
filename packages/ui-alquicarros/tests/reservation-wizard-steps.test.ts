/**
 * Wizard de reserva (alquicarros) — Pasos 2-5 (Fase 2.2).
 *
 * Encoda los OBSERVABLES de cableado de SCEN-W-03/04/05 (Vehículo),
 * SCEN-W-06 (Seguro), SCEN-W-07/W-10 (Adicionales + back-preserva-estado) y
 * SCEN-W-11 (Datos + submit) a nivel de source, el mismo estilo estático que
 * reservas/__tests__/index.test.ts (sin entorno DOM en esta marca). La evidencia
 * DOM/E2E viva se satisface en runtime (agent-browser) y en el gate E2E (Paso 13).
 *
 * La fuente de verdad del dominio NO se duplica: el wizard fija
 * `selectedCategory` (useCategory) + `vehiculo`/`haveTotalInsurance` y togglea
 * los flags de seguro/extras en esa instancia, que es lo que
 * useRecordReservationForm lee al enviar. Estos tests fijan ese contrato.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const C = 'app/components/wizard'
const stepVehicle = () => read(`${C}/steps/StepVehicle.vue`)
const vehicleCard = () => read(`${C}/WizardVehicleCard.vue`)
const segmentTile = () => read(`${C}/VehicleSegmentTile.vue`)
const stepCoverage = () => read(`${C}/steps/StepCoverage.vue`)
const stepExtras = () => read(`${C}/steps/StepExtras.vue`)
const stepData = () => read(`${C}/steps/StepData.vue`)
const shell = () => read(`${C}/ReservationWizard.vue`)

describe('Paso 2 · Vehículo — segmentos (SCEN-W-03/W-04)', () => {
  it('agrupa la disponibilidad por segmento con groupBySegment de la taxonomía', () => {
    expect(stepVehicle()).toMatch(/groupBySegment/)
    expect(stepVehicle()).toMatch(/from ['"]~\/config\/vehicleSegments['"]/)
  })

  it('renderiza los tiles de segmento (nivel 1) con WizardVehicleSegmentTile', () => {
    expect(stepVehicle()).toMatch(/<WizardVehicleSegmentTile\b/)
  })

  it('deriva los códigos disponibles de filteredCategories, excluyendo los unable (999999999)', () => {
    expect(stepVehicle()).toMatch(/filteredCategories/)
    expect(stepVehicle()).toMatch(/999999999/)
  })

  it('solo agrupa gamas con metadata de presentación (vehicleCategories) — espeja renderableCategories', () => {
    expect(stepVehicle()).toMatch(/vehicleCategories/)
  })
})

describe('Paso 2 · Vehículo — nivel 2 y selección (SCEN-W-05)', () => {
  it('renderiza las gamas del segmento abierto con WizardVehicleCard (nivel 2)', () => {
    expect(stepVehicle()).toMatch(/<WizardVehicleCard\b/)
  })

  it('al elegir fija selectedCategory (search) y vehiculo (form) — habilita avanzar', () => {
    const src = stepVehicle()
    expect(src).toMatch(/selectedCategory\.value\s*=/)
    expect(src).toMatch(/vehiculo\.value\s*=/)
  })

  it('el tile de segmento muestra un "desde $X" (más barato del segmento)', () => {
    expect(segmentTile()).toMatch(/fromPrice/)
    expect(segmentTile()).toMatch(/desde/i)
  })
})

describe('Paso 2 · WizardVehicleCard es un reúso REDUCIDO (sin seguro ni extras)', () => {
  it('emite la instancia useCategory al elegir (mismo contrato que CategoryCard)', () => {
    expect(vehicleCard()).toMatch(/\$emit\(['"]select['"]/)
    expect(vehicleCard()).toMatch(/useCategory\(/)
  })

  it('NO incluye los radios de seguro (withTotalCoverage) — eso es el Paso 3', () => {
    expect(vehicleCard()).not.toMatch(/withTotalCoverage/)
  })

  it('NO incluye el bloque de adicionales (withExtraDriver/withBabySeat/withWash) — eso es el Paso 4', () => {
    expect(vehicleCard()).not.toMatch(/withExtraDriver|withBabySeat|withWash/)
  })

  it('reúsa el Carrusel de imágenes de la marca', () => {
    expect(vehicleCard()).toMatch(/Carrusel/)
  })
})

describe('Paso 12 · Estados vacío/error en Paso 2 (SCEN-W-12)', () => {
  it('el estado vacío ofrece CTA "ajustar búsqueda" que emite adjust-search', () => {
    const src = stepVehicle()
    expect(src).toMatch(/wizard-adjust-search-test/)
    expect(src).toMatch(/adjust-search/)
    expect(src).toMatch(/ajustar b[úu]squeda/i)
  })

  it('renderiza un banner de error inline según el error de disponibilidad (server / one-way)', () => {
    const src = stepVehicle()
    expect(src).toMatch(/wizard-vehicle-error-test/)
    expect(src).toMatch(/server_error/)
    expect(src).toMatch(/one_way_not_available/)
  })

  it('distingue "sin disponibilidad" (no_available_categories) de un error bloqueante', () => {
    // no_available_categories_error se trata como vacío (no como error duro)
    expect(stepVehicle()).toMatch(/no_available_categories_error/)
  })

  it('el shell devuelve al Paso 1 al pedir ajustar búsqueda (onGoTo busqueda — CTA context-aware)', () => {
    const src = shell()
    expect(src).toMatch(/@adjust-search/)
    expect(src).toMatch(/onGoTo\(['"]busqueda['"]\)/)
  })
})

describe('Paso 3 · Seguro — comparador Básico/Total (SCEN-W-06)', () => {
  it('togglea withTotalCoverage en selectedCategory (recálculo en vivo del total)', () => {
    expect(stepCoverage()).toMatch(/withTotalCoverage/)
    expect(stepCoverage()).toMatch(/selectedCategory/)
  })

  it('sincroniza haveTotalInsurance en el form (lo que lee useRecordReservationForm al enviar)', () => {
    expect(stepCoverage()).toMatch(/haveTotalInsurance/)
  })

  it('presenta las dos coberturas Básico y Total', () => {
    const src = stepCoverage()
    expect(src).toMatch(/B[áa]sico/)
    expect(src).toMatch(/Total/)
  })
})

describe('Paso 4 · Adicionales — opcional + Omitir (SCEN-W-07)', () => {
  it('togglea los tres adicionales en selectedCategory', () => {
    const src = stepExtras()
    expect(src).toMatch(/withExtraDriver/)
    expect(src).toMatch(/withBabySeat/)
    expect(src).toMatch(/withWash/)
  })

  it('ofrece un botón "Omitir" que avanza sin marcar nada', () => {
    const src = stepExtras()
    expect(src).toMatch(/Omitir/)
    expect(src).toMatch(/wizard-extras-skip-test/)
  })
})

describe('Paso 5 · Datos — reúsa ReservationForm + submit (SCEN-W-11)', () => {
  it('reúsa el ReservationForm existente (validación valibot intacta)', () => {
    expect(stepData()).toMatch(/<ReservationForm\b/)
  })

  it('enruta el submit por submitForm del store (sin regresión de estado)', () => {
    expect(stepData()).toMatch(/submitForm/)
  })

  it('expone submit() para que el CTA del wizard confirme la reserva', () => {
    expect(stepData()).toMatch(/defineExpose/)
    expect(stepData()).toMatch(/submit/)
  })
})

describe('Robustez — hallazgos de edge-case (regresión)', () => {
  it('Paso 2 gatea el estado vacío por groups.length, no por hasAvailableCategories (evita pantalla muerta con gama sin metadata)', () => {
    const src = stepVehicle()
    expect(src).toMatch(/v-else-if="groups\.length === 0"/)
    expect(src).not.toMatch(/v-else-if="!hasAvailableCategories"/)
  })

  it('re-tap de la gama ya elegida es no-op (no borra Seguro Total ni adicionales)', () => {
    expect(stepVehicle()).toMatch(/if \(cat\.categoryCode\.value === selectedCode\.value\) return/)
  })

  it('el CTA de confirmar no permite doble-submit (guarda isSubmittingForm en onNext + deshabilita)', () => {
    expect(shell()).toMatch(/if \(isSubmittingForm\.value\) return/)
    expect(read(`${C}/WizardSummary.vue`)).toMatch(/isSubmittingForm/)
  })

  it('el "desde $X" usa la familia getTotalPrice (Básico), no estimatedTotalAmount con IVA+tasa', () => {
    const src = stepVehicle()
    // total Básico = totalAmount + coverageTotalAmount + returnFee (misma familia que la card)
    expect(src).toMatch(/rowBasicTotal/)
    expect(src).toMatch(/totalAmount[\s\S]{0,60}coverageTotalAmount[\s\S]{0,60}returnFeeAmount/)
  })
})

describe('Refinamientos UX móvil (verificación manual)', () => {
  const card = () => read(`${C}/WizardVehicleCard.vue`)
  const stepExtras = () => read(`${C}/steps/StepExtras.vue`)
  const stepData = () => read(`${C}/steps/StepData.vue`)
  const stepper = () => read(`${C}/WizardStepper.vue`)

  it('la barra de pasos es sticky bajo el header (offset por breakpoint)', () => {
    expect(shell()).toMatch(/sticky\s+top-16\s+md:top-20/)
  })

  it('en Paso 1 con búsqueda hecha, clic en "Búsqueda" avanza a Paso 2', () => {
    // onGoTo detecta busqueda + maxReached>=2 → goTo(vehiculo); el stepper emite
    // goTo también para el paso actual (sin el guard step !== current).
    expect(shell()).toMatch(/maxReachedStep\.value >= 2[\s\S]{0,120}goTo\(['"]vehiculo['"]\)/)
    expect(stepper()).not.toMatch(/step !== props\.current/)
  })

  it('la card completa selecciona la categoría; el carrusel NO (aislado)', () => {
    const src = card()
    // click en el contenedor de la card emite select; el carrusel detiene la propagación
    expect(src).toMatch(/@click="[^"]*\$emit\('select'|@click="onCardSelect/)
    expect(src).toMatch(/carrusel[\s\S]{0,40}@click\.stop/)
  })

  it('al avanzar de paso, la página vuelve al tope', () => {
    expect(shell()).toMatch(/window\.scrollTo\(\s*\{\s*top:\s*0/)
  })

  it('"Omitir" limpia los adicionales seleccionados antes de avanzar', () => {
    const src = stepExtras()
    // onOmitir pone los flags en false y luego emite skip
    expect(src).toMatch(/onOmitir|clearExtras/)
    expect(src).toMatch(/withExtraDriver[\s\S]{0,80}false|= false/)
  })

  it('StepData no repite el texto de "titular de la tarjeta" (ya está en ReservationForm)', () => {
    expect(stepData()).not.toMatch(/Completa los datos del titular de la tarjeta/)
  })
})

describe('Stepper móvil navegable (SCEN-W-10 en móvil)', () => {
  const stepper = () => read(`${C}/WizardStepper.vue`)

  it('la barra móvil ofrece un control "Atrás" que navega al paso anterior alcanzado', () => {
    const src = stepper()
    expect(src).toMatch(/Atr[áa]s/)
    expect(src).toMatch(/onSelect\(current - 1\)/)
  })

  it('los pasos móviles son botones clicables (no <li> decorativos inertes)', () => {
    // El bloque md:hidden debe usar <button ... @click="onSelect"> para navegar.
    const src = stepper()
    const mobile = src.slice(src.indexOf('md:hidden'))
    expect(mobile).toMatch(/<button[\s\S]*@click="onSelect\(i \+ 1\)"/)
  })
})

describe('WizardVehicleCard — nombre de modelo no recortado (fix borde)', () => {
  const card = () => read(`${C}/WizardVehicleCard.vue`)

  it('estiliza .nombre-modelo (deep) para que no quede pegado/recortado al borde', () => {
    // .nombre-modelo está anidada bajo .categoria en category.css → no aplica en el
    // wizard; se re-estiliza vía :deep para posicionarla con margen (pill).
    expect(card()).toMatch(/:deep\(\.nombre-modelo\)/)
  })
})

describe('Shell — monta los Pasos 2-5 reales (reemplaza el placeholder de Fase 2.1)', () => {
  it('monta StepVehicle / StepCoverage / StepExtras / StepData', () => {
    const src = shell()
    expect(src).toMatch(/<WizardStepsStepVehicle\b/)
    expect(src).toMatch(/<WizardStepsStepCoverage\b/)
    expect(src).toMatch(/<WizardStepsStepExtras\b/)
    expect(src).toMatch(/<WizardStepsStepData\b/)
  })

  it('ya no deja el placeholder "en construcción" de la Fase 2.1', () => {
    expect(shell()).not.toMatch(/en construcci[óo]n/i)
  })

  it('en el Paso 5 el CTA confirma vía el submit expuesto por StepData', () => {
    expect(shell()).toMatch(/\.submit\(\)/)
  })
})
