<template>
  <!--
    Shell del wizard de reserva (alquicarros). Orquesta la máquina de pasos
    (useReservationWizard, Fase 1) + el layout, y en Fase 3 la integración de
    routing:
      - `/reservas` (externalSearch=false): Paso 1 = hero interno (StepSearch). Al
        completar la búsqueda (el Searcher escribe el query) el wizard avanza a
        Paso 2 y refleja el paso en `?paso=`. Entrada directa `/reservas?query`
        entra en Paso 2 (deriveStepFromRoute).
      - City results (externalSearch=true, CityPage mode="results"): el hero/Searcher
        lo provee CityHero; el wizard NO monta Paso 1. El paso "Búsqueda" del
        stepper ancla a `#searcher`. La ruta hidrata vía useSearchByRouteParams y
        entra en Paso 2 (o Paso 3 con `/categoria/[gama]` preseleccionada).
  -->
  <div>
    <!-- Barra de pasos — sticky bajo el header del sitio (h 64px móvil / 80px desktop,
         header es sticky top-0 z-50). z-30 < header; la barra inferior móvil es z-40. -->
    <div class="sticky top-16 md:top-20 z-30 border-b border-gray-100 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <WizardStepper
          :current="wizard.currentStepNumber.value"
          :max-reached="wizard.maxReachedStep.value"
          @go-to="onGoTo"
        />
      </div>
    </div>

    <!-- Paso 1 — Búsqueda: hero interno solo en /reservas (en city lo provee CityHero) -->
    <WizardStepsStepSearch v-if="!externalSearch && isStep('busqueda')" />

    <!-- Pasos 2-5 — contenido + resumen persistente -->
    <div v-else class="bg-surface-soft min-h-[60vh]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div class="grid lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 pb-28 lg:pb-0">
            <WizardStepsStepVehicle
              v-if="isStep('vehiculo')"
              @adjust-search="onGoTo('busqueda')"
            />
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
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

// composables (wizard machine — Fase 1)
import useReservationWizard, {
  canAdvance,
  stepNumber,
  type WizardStep,
} from '~/composables/useReservationWizard'

const props = withDefaults(
  defineProps<{
    /**
     * Búsqueda externa: en city pages el Searcher vive en CityHero, así que el
     * wizard NO monta el Paso 1 y no sincroniza `?paso=` (la URL es por path).
     * En `/reservas` es false: el wizard posee el Paso 1 y el handshake.
     */
    externalSearch?: boolean
  }>(),
  { externalSearch: false },
)

/**
 * Máquina de pasos: deriva el paso inicial del route (SSR-estable) y expone
 * currentStep/goTo/next/back.
 */
const wizard = useReservationWizard()
const route = useRoute()

/**
 * Dispara la búsqueda desde el query string de /reservas (?lugar_recogida=…).
 * Brand-local; una /reservas limpia no hace nada. En city el hidratado lo hace
 * useSearchByRouteParams desde la propia página.
 */
useSearchByQueryParams()

const search = useStoreSearchData()
const form = useStoreReservationForm()
const {
  pending,
  hasAvailableCategories,
  filteredCategories,
  selectedCategory,
  error,
  noAvailableCategories,
} = storeToRefs(search)
const { politicaPrivacidad, isSubmittingForm, vehiculo, haveTotalInsurance } = storeToRefs(form)

/**
 * ¿La búsqueda ya se resolvió (con resultados, error o inventario vacío)? `pending`
 * es false antes y después, así que se combina con las señales de resultado para
 * distinguir "aún no ha corrido" de "corrió y no hay match". Fuente de verdad para
 * el avance del Paso 1 y para la red de seguridad de deep-links.
 */
const searchSettled = computed(
  () =>
    !pending.value &&
    (hasAvailableCategories.value || !!error.value || noAvailableCategories.value),
)

function isStep(step: WizardStep): boolean {
  return wizard.currentStep.value === step
}

/** Primer valor string de un param/query (Nuxt entrega string | string[]). */
function firstQ(v: unknown): string | undefined {
  const raw = Array.isArray(v) ? v[0] : v
  return raw == null ? undefined : String(raw)
}

/**
 * Click en un paso del stepper. Casos especiales del paso "Búsqueda":
 *   - en Paso 1 con búsqueda YA hecha (maxReached ≥ 2): avanzar a los resultados
 *     (Paso 2) en vez de no-opear — no hay CTA "Continuar" en el Paso 1.
 *   - en city (externalSearch): anclar al Searcher de CityHero (#searcher), que
 *     provee el Paso 1.
 * El resto navega la máquina normalmente.
 */
function onGoTo(step: WizardStep | number): void {
  const n = typeof step === 'number' ? step : stepNumber(step)
  if (n === 1 && wizard.currentStep.value === 'busqueda' && wizard.maxReachedStep.value >= 2) {
    wizard.goTo('vehiculo')
    return
  }
  if (props.externalSearch && n === 1) {
    if (import.meta.client) {
      document.getElementById('searcher')?.scrollIntoView({ behavior: 'smooth' })
    }
    return
  }
  wizard.goTo(step)
}

// Al cambiar de paso (Continuar, back o salto del stepper), volver al tope de la
// página para que el paso nuevo se lea desde el inicio (sobre todo en móvil). El
// scroll a #searcher en city NO cambia currentStep, así que no colisiona.
watch(
  () => wizard.currentStep.value,
  () => {
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

// ── Paso 9: handshake búsqueda→avance + sync de URL (solo /reservas) ───────────
if (!props.externalSearch) {
  // Cuando el Searcher escribe el query (navega a /reservas?lugar_recogida=…) el
  // shell sigue montado; al aparecer/cambiar los params de búsqueda estando en
  // Paso 1, avanzamos a Paso 2. Clave = firma de los 6 params (no solo el pickup):
  // re-buscar con la MISMA sucursal y otras fechas también avanza. La entrada
  // directa (?query en la carga) ya arranca en Paso 2 por deriveStepFromRoute, así
  // que el watch es no-inmediato y solo captura la transición cliente del submit
  // (SCEN-W-02).
  watch(
    () =>
      [
        route.query.lugar_recogida,
        route.query.lugar_devolucion,
        route.query.fecha_recogida,
        route.query.fecha_devolucion,
        route.query.hora_recogida,
        route.query.hora_devolucion,
      ]
        .map(firstQ)
        .join('|'),
    () => {
      if (firstQ(route.query.lugar_recogida) && wizard.currentStep.value === 'busqueda') {
        wizard.next()
      }
    },
  )

  // Refleja el paso actual en `?paso=` para compartir/recargar (deriveStepFromRoute
  // lo lee al inicializar). replaceState: sin entradas de historial nuevas ni
  // recarga — el back del navegador NO recorre pasos (sale de /reservas); la
  // navegación entre pasos es en-sesión vía la máquina. Solo cuando hay búsqueda
  // en el query (pasado el Paso 1).
  watch(
    () => wizard.currentStep.value,
    (step) => {
      if (!import.meta.client) return
      if (!firstQ(route.query.lugar_recogida)) return
      const url = new URL(window.location.href)
      if (step === 'busqueda') url.searchParams.delete('paso')
      else url.searchParams.set('paso', step)
      window.history.replaceState(window.history.state, '', url.toString())
    },
  )
}

// ── Paso 11: deep-link /categoria/[gama] → preselección de gama (Paso 3) ───────
// deriveStepFromRoute ya arranca en Paso 3 (seguro) cuando hay `categoria` en el
// path; aquí, al cargar la disponibilidad, fijamos selectedCategory con la fila que
// hace match. El caso "sin match" NO cae aquí: lo cubre la red de seguridad de
// abajo (que también atrapa error de disponibilidad y ?paso= deep-links).
const categoriaParam = computed(() => firstQ(route.params.categoria)?.toUpperCase())
if (categoriaParam.value) {
  const { vehicleCategories } = useFetchRentacarData()
  watch(
    () => filteredCategories.value,
    (cats) => {
      const code = categoriaParam.value
      if (!code || selectedCategory.value || pending.value) return
      // Excluir el centinela "unable" (999999999): filteredCategories incluye las
      // gamas SIN stock para las fechas elegidas; sin este filtro un deep-link a
      // una gama agotada preseleccionaría una categoría basura ($999.999.999) y
      // saltaría al Paso 3. Espeja el `renderable` de StepVehicle.
      const row = cats.find(
        (c) => c.categoryCode === code && c.estimatedTotalAmount !== 999999999,
      )
      if (row && vehicleCategories[row.categoryCode]) {
        const cat = useCategory(row)
        selectedCategory.value = cat
        vehiculo.value = cat.categoryCode.value
        haveTotalInsurance.value = false // Básico por defecto (espeja StepVehicle.onSelect)
      }
    },
    { immediate: true },
  )
}

// ── Red de seguridad de deep-links ────────────────────────────────────────────
// Si el wizard queda en un paso ≥ Seguro SIN gama elegida una vez asentada la
// búsqueda, vuelve al Paso 2. Cubre: /categoria de gama agotada/desconocida, error
// de disponibilidad (filteredCategories=[], donde un fallback gateado por
// cats.length>0 nunca dispararía), y un `?paso=` compartido/bookmarkeado sin
// selección. Sin esto, canAdvance('seguro'/'adicionales') es true y el usuario
// llegaría a "Confirmar" con selectedCategory=null → submit que valida `vehiculo`
// nulo y no-opea en silencio (ese campo no tiene UFormField visible). Baja también
// maxReachedStep a 2 para que el stepper no deje re-saltar adelante sin elegir.
// Lee selectedCategory.value fresco (no del arg): el watch de preselección se crea
// antes, así que si hubo match ya lo fijó en este mismo flush y esto no-opea.
watch(
  [searchSettled, () => wizard.currentStepNumber.value],
  ([settled, stepNum]) => {
    if (!settled || selectedCategory.value) return
    if (stepNum >= stepNumber('seguro')) {
      wizard.goTo('vehiculo')
      wizard.maxReachedStep.value = 2
    }
  },
  { immediate: true },
)

/** Ref al Paso 5 para disparar la validación + envío del ReservationForm. */
const stepDataRef = ref<{ submit: () => void } | null>(null)

/** Estado de dominio que gobierna el avance de cada paso (SCEN-W-05/07). */
const advanceState = computed(() => ({
  searchExecuted: searchSettled.value,
  hasSelectedCategory: !!selectedCategory.value,
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
    // useRecordReservationForm dispara dos POST → reservas duplicadas.
    if (isSubmittingForm.value) return
    stepDataRef.value?.submit()
    return
  }
  if (canAdvanceCurrent.value) wizard.next()
}
</script>
