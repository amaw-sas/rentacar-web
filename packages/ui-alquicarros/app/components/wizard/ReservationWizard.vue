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
              :search-stale="searchStale"
              @adjust-search="onGoTo('busqueda')"
            />
            <WizardStepsStepCoverage
              v-else-if="isStep('seguro')"
              :search-stale="searchStale"
              @adjust-search="onGoTo('busqueda')"
            />
            <WizardStepsStepExtras
              v-else-if="isStep('adicionales')"
              :search-stale="searchStale"
              @skip="onSkipExtras"
              @adjust-search="onGoTo('busqueda')"
            />
            <WizardStepsStepData v-else-if="isStep('datos')" ref="stepDataRef" />
          </div>
          <div class="lg:col-span-4">
            <WizardSummary
              :can-advance="canAdvanceCurrent"
              :cta-label="ctaLabel"
              :search-stale="searchStale"
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
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

// composables (wizard machine — Fase 1)
import useReservationWizard, {
  canAdvance,
  computeStaleTransition,
  stepNumber,
  type WizardStep,
} from '~/composables/useReservationWizard'
// Firma del tramo (seis campos de búsqueda) — la primitiva de comparación de #401,
// reutilizada de canReuseExistingSearch.
import { reservationSearchSignature } from '~/composables/useSearchByQueryParams'

// composables (import explícito, no auto-import: así el shell es montable en tests
// sin el runtime de Nuxt)
import { useWizardNotice } from '~/composables/useWizardNotice'

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

/** Ranura del aviso del wizard (#368 B1). El shell escribe; el Paso 2 lee. */
const { setNotice } = useWizardNotice()
const {
  pending,
  hasAvailableCategories,
  filteredCategories,
  selectedCategory,
  error,
  noAvailableCategories,
} = storeToRefs(search)
const {
  politicaPrivacidad,
  isSubmittingForm,
  formSubmitLocked,
  vehiculo,
  haveTotalInsurance,
  haveMonthlyReservation,
  selectedMonthlyMileage,
  // Tramo vivo (issue #401): los seis campos con los que el resumen y el submit
  // describen la reserva. Su firma se compara contra la del tramo cotizado.
  lugarRecogida,
  lugarDevolucion,
  fechaRecogida,
  fechaDevolucion,
  horaRecogida,
  horaDevolucion,
} = storeToRefs(form)

// ── Invalidación de cotización por deriva del tramo (issue #401) ───────────────
// El resumen y el payload mezclan tramo VIVO (form) con precio CONGELADO
// (selectedCategory). Si el tramo vivo deja de coincidir con el que pidió la
// disponibilidad en pantalla, la cotización se descarta y se registra que la
// búsqueda quedó rancia, para que ningún paso avance con un precio que no aplica.
const liveSearchSignature = computed(() =>
  reservationSearchSignature({
    pickup: lugarRecogida.value,
    dropoff: lugarDevolucion.value,
    pickupDate: fechaRecogida.value,
    dropoffDate: fechaDevolucion.value,
    pickupTime: horaRecogida.value,
    dropoffTime: horaDevolucion.value,
  }),
)

/** Tramo con el que se pidió la disponibilidad que hay ahora en pantalla. */
const quotedSearchSignature = ref<string | null>(null)
/** Pestillo: la disponibilidad en pantalla ya no corresponde al tramo vivo. */
const searchStale = ref(false)

/**
 * Fuente única de los flags que viajan en el payload (useRecordReservationForm).
 *
 * La instancia `selectedCategory` (useCategory) manda: es la que calcula los precios
 * que el usuario ve en el sidebar y en las cards. El store solo los espeja. Antes cada
 * paso los escribía a mano — `haveTotalInsurance = …` en tres sitios — y el kilometraje
 * simplemente se quedó sin su línea: `withMileage` arranca en "1k_kms" mientras
 * `selectedMonthlyMileage` arranca en null, así que `useRecordReservationForm` tomaba la
 * rama de reserva regular y enviaba `total_price: 0` sin `monthly_mileage`, cobrando el
 * mensual. Derivar en un solo punto vuelve estructural lo que era disciplina.
 *
 * `sc.withMileage` llega auto-unwrapeado (el ref del store envuelve en reactive): es un
 * string, no un Ref. Leerlo con `.value` daría undefined.
 */
watch(
  () => [
    haveMonthlyReservation.value,
    selectedCategory.value?.withTotalCoverage,
    selectedCategory.value?.withMileage,
  ],
  () => {
    const sc = selectedCategory.value
    haveTotalInsurance.value = !!sc?.withTotalCoverage
    selectedMonthlyMileage.value =
      haveMonthlyReservation.value && sc ? (sc.withMileage ?? null) : null
  },
  { immediate: true, flush: 'sync' },
)

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

// Adopción inicial de la firma cotizada (issue #401). Un montaje que hereda estado
// del store sin arrancar una búsqueda —volver de /chat a la misma URL reutiliza la
// cotización sin togglear `pending` (canReuseExistingSearch)— no dispararía la guarda
// 1, y la guarda 3 dejaría pasar cualquier cambio de tramo posterior sin invalidar.
// Capturamos aquí el tramo ya hidratado. Se condiciona a `searchSettled` O a que haya
// gama: si en pantalla hay filas o un banner de error heredados del store, también
// pueden quedar rancios (hecho 3), no solo una gama elegida.
//
// En onMounted y no en el setup a propósito: en la superficie query
// (useSearchByQueryParams corre en el setup del wizard) su onMounted va antes y deja
// el tramo hidratado; en la superficie path (useSearchByRouteParams lo llama el padre
// Results.vue) el onMounted del hijo va antes y captura el tramo persistido, que la
// guarda 1 re-captura microsegundos después al re-buscar.
onMounted(() => {
  if (searchSettled.value || selectedCategory.value) {
    quotedSearchSignature.value = liveSearchSignature.value
  }
})

// Máquina de invalidación (issue #401). Un solo watcher sobre `[pending, firma]`
// con precedencia explícita, en vez de dos watchers cuyo orden lo decidiría la cola
// de Vue: el mismo tick que arranca una búsqueda cambia la firma, así que "capturar"
// e "invalidar" se pisarían. `computeStaleTransition` decide (seis guards); aquí solo
// se cablean los refs y las acciones.
//
// `flush: 'sync'` es obligatorio: search() pone `pending = true` y a continuación,
// en el mismo tick antes de su primer await, useFetchCategoriesAvailabilityData arma
// su body leyendo los refs del tramo, que useSearch muta en flush `pre`. Con `sync`
// la firma se captura en el instante exacto en que `pending` bascula, así que la
// firma capturada ES la consultada. Corre después del watcher de derivación de flags
// (registrado antes, mismo `sync`), que apaga seguro/kilometraje al quedar sin gama.
//
// El flanco `false→true` (guard 1) descarta la gama vieja: useCategory congela los
// precios en refs al construirse y el store no resetea selectedCategory en search(),
// así que re-buscar sin re-elegir dejaría la cotización VIEJA (fechas nuevas, precio
// viejo). Sin `immediate`: un disparo inmediato con `wasPending === undefined` haría
// verdadera la guarda 1 y capturaría/anularía durante un montaje con búsqueda en
// vuelo; la guarda 2 cubre ese montaje cuando la búsqueda resuelve.
//
// Aviso (issue #368 B1, plegado aquí al fusionar): la ranura de `useWizardNotice`
// siempre queda en su estado correcto —escritura incondicional, nunca armada—.
//  · Guard 1 (arranca búsqueda, `isPending && !wasPending`): anuncia el reset si había
//    selección que descartar, `null` si no. El descarte lo hace `clearSelection`; el
//    aviso explica por qué la gama desapareció con filas frescas en pantalla.
//  · Guard 6 (el tramo derivó sin re-buscar, `stale && clearSelection`): la superficie
//    `searchStale` (WizardStaleNotice + motivo en el resumen) es el único mensaje;
//    limpiar la ranura evita que un «elige de nuevo» armado antes se solape con un
//    «pulsa BUSCAR» que dice lo contrario.
watch(
  [pending, liveSearchSignature],
  ([isPending], [wasPending]) => {
    const hadSelection = !!selectedCategory.value
    const next = computeStaleTransition({
      isPending,
      wasPending,
      liveSignature: liveSearchSignature.value,
      quotedSignature: quotedSearchSignature.value,
      stale: searchStale.value,
    })
    quotedSearchSignature.value = next.quotedSignature
    searchStale.value = next.stale
    if (next.clearSelection) {
      selectedCategory.value = null
      vehiculo.value = null
    }
    if (isPending && !wasPending) {
      setNotice(hadSelection ? { kind: 'search-reset' } : null)
    } else if (next.stale && next.clearSelection) {
      setNotice(null)
    }
  },
  { flush: 'sync' },
)

function isStep(step: WizardStep): boolean {
  return wizard.currentStep.value === step
}

/**
 * Primer valor string de un param/query (Nuxt entrega string | string[]), TRIMEADO
 * y con vacío→undefined. Debe coincidir con `deriveStepFromRoute` (que trimea el
 * pickup): sin trim aquí, un `?lugar_recogida=%20` sería "presente" para el
 * handshake / gate de vacío / ?paso mientras la derivación lo trata como ausente.
 */
function firstQ(v: unknown): string | undefined {
  const raw = Array.isArray(v) ? v[0] : v
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s === '' ? undefined : s
}

/**
 * Pickup presente derivado de query O params. En `/reservas` limpio viene por query
 * (`?lugar_recogida=`); en las páginas PATH de resultados
 * (`/reservas/lugar-recogida/...`) viene por `route.params.lugar_recogida`. Espeja a
 * `deriveStepFromRoute` (que ya lee ambos) para que el sync de `?paso=` (híbrido)
 * dispare también en las URLs PATH.
 */
const pickup = computed(() => firstQ(route.query.lugar_recogida) ?? firstQ(route.params.lugar_recogida))

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
  (step) => {
    if (step === 'datos') search.trackCheckoutStarted()
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

  // Re-búsqueda con los MISMOS parámetros: el Searcher es un NuxtLink; si la URL
  // destino es igual a la actual NO navega, así que el watch de arriba (firma de
  // query) no dispara. Pero el Searcher sí re-ejecuta doSearch (#129), togglando
  // `pending`. Al completarse una búsqueda (pending true→false) estando en Paso 1,
  // avanzamos a Paso 2 — si no, "no pasa nada" al re-buscar sin cambiar campos.
  watch(pending, (isPending, wasPending) => {
    if (wasPending && !isPending && wizard.currentStep.value === 'busqueda') {
      wizard.next()
    }
  })

  // Refleja el paso actual en `?paso=` para compartir/recargar (deriveStepFromRoute
  // lo lee al inicializar). replaceState: sin entradas de historial nuevas ni
  // recarga — el back del navegador NO recorre pasos (sale de /reservas); la
  // navegación entre pasos es en-sesión vía la máquina. Solo cuando hay búsqueda
  // en el query (pasado el Paso 1).
  watch(
    () => wizard.currentStep.value,
    (step) => {
      if (!import.meta.client) return
      if (!pickup.value) return
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
        // Seguro Básico y kilometraje por defecto los fija el watcher de derivación
        // a partir de la instancia recién creada (withTotalCoverage=false, "1k_kms").
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
// Issue #313: una gama SELECCIONADA pero más allá del horizonte de tarifas
// (deep-link /categoria/X con fecha 2027) cuenta como "sin gama usable" — sin
// esto, deriveStepFromRoute la deja en Paso 3 (Seguro) y canAdvance('seguro')
// es true, así que el usuario avanzaría hasta Confirmar con getTotalPrice = 0.
// Rebotar a Paso 2 la lleva al banner de horizonte + guard de avance.
const hasUsableCategory = computed(
  () => !!selectedCategory.value && !selectedCategory.value.isMonthlyPriceUnavailable,
)
watch(
  [searchSettled, () => wizard.currentStepNumber.value],
  ([settled, stepNum]) => {
    if (!settled || hasUsableCategory.value) return
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
  // Issue #313: una gama mensual seleccionada cuyo pickup cae más allá del
  // horizonte de tarifas (getTotalPrice = 0) NO habilita avanzar — se bloquea
  // por flag, no por precio. Cubre el deep-link a /categoria/X con fecha 2027.
  hasSelectedCategory:
    !!selectedCategory.value && !selectedCategory.value.isMonthlyPriceUnavailable,
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
    if (isSubmittingForm.value || formSubmitLocked.value) return
    stepDataRef.value?.submit()
    return
  }
  if (canAdvanceCurrent.value) wizard.next()
}

/**
 * "Omitir — continuar sin adicionales". `next()` avanza SIN consultar `canAdvance`,
 * así que es la única puerta hacia adelante sin gate (issue #401): la ruteamos por el
 * mismo control que `onNext` para que, con la gama anulada por rancia, Omitir tampoco
 * lleve al "Confirmar reserva" mudo. En el camino feliz es no-op (con gama viva
 * canAdvance('adicionales') es true).
 */
function onSkipExtras(): void {
  if (canAdvanceCurrent.value) wizard.next()
}
</script>
