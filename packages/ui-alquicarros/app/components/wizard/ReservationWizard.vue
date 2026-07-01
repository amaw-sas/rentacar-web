<template>
  <!--
    Shell del wizard de reserva (alquicarros). Orquesta la máquina de pasos
    (useReservationWizard, Fase 1) + el layout: barra de pasos arriba, y según el
    paso, o el hero de búsqueda a ancho completo (Paso 1) o un grid contenido +
    resumen persistente (Pasos 2-5).

    Fase 2 · incremento 1: Paso 1 (Búsqueda) es real; el contenido de los Pasos 2-5
    es un placeholder que se reemplaza por StepVehicle/StepCoverage/StepExtras/
    StepData en el incremento 2. El stepper y el resumen ya quedan cableados.

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
          <!-- Placeholder de contenido (incremento 2 monta los Step*.vue reales) -->
          <div class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-16 text-center">
            <p class="heading-label text-brand-700">Paso {{ wizard.currentStepNumber.value }}</p>
            <h2 class="heading-card mt-2 text-gray-900">{{ stepHeading }}</h2>
            <p class="mt-2 body-base text-gray-500 max-w-md mx-auto">
              Contenido en construcción — este paso se monta en el próximo incremento
              de la Fase 2.
            </p>
          </div>
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
import { computed } from 'vue'
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
const { politicaPrivacidad } = storeToRefs(form)

function isStep(step: WizardStep): boolean {
  return wizard.currentStep.value === step
}

const STEP_HEADINGS: Record<WizardStep, string> = {
  busqueda: '¿Dónde y cuándo?',
  vehiculo: 'Elige tu vehículo',
  seguro: 'Elige tu cobertura',
  adicionales: 'Servicios adicionales',
  datos: 'Tus datos para reservar',
}
const stepHeading = computed(() => STEP_HEADINGS[wizard.currentStep.value])

/** Estado de dominio que gobierna el avance de cada paso (SCEN-W-05/07). */
const advanceState = computed(() => ({
  searchExecuted:
    !pending.value &&
    (hasAvailableCategories.value || !!error.value || noAvailableCategories.value),
  hasSelectedCategory: !!selectedCategory.value,
  // Paso 5 se valida en StepData (incremento 2); hasta entonces no avanza.
  formValid: Boolean(politicaPrivacidad.value),
}))

const canAdvanceCurrent = computed(() =>
  canAdvance(wizard.currentStep.value, advanceState.value),
)

const ctaLabel = computed(() =>
  wizard.currentStep.value === 'datos' ? 'Confirmar reserva' : 'Continuar',
)

function onNext(): void {
  if (canAdvanceCurrent.value) wizard.next()
}
</script>
