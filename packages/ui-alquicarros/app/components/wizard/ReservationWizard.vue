<template>
  <!--
    Shell del wizard de reserva (alquicarros). Orquesta la máquina de pasos
    (useReservationWizard, Fase 1) + el layout: barra de pasos arriba, y según el
    paso, o el hero de búsqueda a ancho completo (Paso 1) o un grid contenido +
    resumen persistente (Pasos 2-5).

    Fase 2 · incremento 2: los Pasos 2-5 son reales (StepVehicle/StepCoverage/
    StepExtras/StepData). El stepper y el resumen ya quedaban cableados en el
    incremento 1.

    La sincronización de URL (?paso=) y el auto-avance al completar la búsqueda son
    Fase 3 (Pasos 9-10 del plan); aquí la navegación es en-sesión vía la máquina.
  -->
  <div>
    <!-- Barra de pasos -->
    <div class="border-b border-gray-100 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <WizardStepper
          :current="wizard.currentStepNumber.value"
          :max-reached="wizard.maxReachedStep.value"
          @go-to="wizard.goTo"
        />
      </div>
    </div>

    <!-- Paso 1 — Búsqueda: hero a ancho completo, sin resumen (aún no hay nada que resumir) -->
    <WizardStepsStepSearch v-if="isStep('busqueda')" />

    <!-- Pasos 2-5 — contenido + resumen persistente -->
    <div v-else class="bg-surface-soft min-h-[60vh]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div class="grid lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 pb-28 lg:pb-0">
            <WizardStepsStepVehicle v-if="isStep('vehiculo')" />
            <WizardStepsStepCoverage v-else-if="isStep('seguro')" />
            <WizardStepsStepExtras v-else-if="isStep('adicionales')" @skip="wizard.next" />
            <WizardStepsStepData v-else-if="isStep('datos')" ref="stepDataRef" />
          </div>
          <div class="lg:col-span-4">
            <WizardSummary
              :can-advance="canAdvanceCurrent"
              :cta-label="ctaLabel"
              @next="onNext"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// External
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

// composables (wizard machine — Fase 1)
import useReservationWizard, {
  canAdvance,
  type WizardStep,
} from '~/composables/useReservationWizard'

/**
 * Máquina de pasos: deriva el paso inicial del route (SSR-estable) y expone
 * currentStep/goTo/next/back. La navegación en-sesión usa la máquina; la
 * sincronización de URL llega en Fase 3.
 */
const wizard = useReservationWizard()

/**
 * Dispara la búsqueda desde el query string de /reservas (?lugar_recogida=…).
 * Brand-local; una /reservas limpia no hace nada. (El auto-avance a Paso 2 al
 * completar la búsqueda es Fase 3.)
 */
useSearchByQueryParams()

const search = useStoreSearchData()
const form = useStoreReservationForm()
const { pending, hasAvailableCategories, selectedCategory, error, noAvailableCategories } =
  storeToRefs(search)
const { politicaPrivacidad, isSubmittingForm } = storeToRefs(form)

function isStep(step: WizardStep): boolean {
  return wizard.currentStep.value === step
}

/** Ref al Paso 5 para disparar la validación + envío del ReservationForm. */
const stepDataRef = ref<{ submit: () => void } | null>(null)

/** Estado de dominio que gobierna el avance de cada paso (SCEN-W-05/07). */
const advanceState = computed(() => ({
  searchExecuted:
    !pending.value &&
    (hasAvailableCategories.value || !!error.value || noAvailableCategories.value),
  hasSelectedCategory: !!selectedCategory.value,
  // Paso 5: politicaPrivacidad (default true) habilita el CTA; la validación
  // valibot real la corre ReservationForm al invocar submit().
  formValid: Boolean(politicaPrivacidad.value),
}))

const canAdvanceCurrent = computed(() =>
  canAdvance(wizard.currentStep.value, advanceState.value),
)

const ctaLabel = computed(() =>
  wizard.currentStep.value === 'datos' ? 'Confirmar reserva' : 'Continuar',
)

/**
 * CTA del sidebar. En el Paso 5 dispara el submit del formulario (que valida y,
 * si es válido, navega según el estado de la reserva); en el resto avanza la
 * máquina si el paso lo permite.
 */
function onNext(): void {
  if (wizard.currentStep.value === 'datos') {
    // Guard re-entrante: sin esto un doble-clic durante el round-trip de
    // useRecordReservationForm dispara dos POST → reservas duplicadas
    // (isSubmittingForm no gatea el CTA por sí solo). El CTA además se
    // deshabilita mientras envía (WizardSummary).
    if (isSubmittingForm.value) return
    stepDataRef.value?.submit()
    return
  }
  if (canAdvanceCurrent.value) wizard.next()
}
</script>
