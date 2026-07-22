<template>
  <!--
    Paso 2 — Vehículo. Nivel 1: tiles de segmento (agrupa la disponibilidad por la
    taxonomía comercial, oculta los vacíos, "desde $X" del más barato). Nivel 2:
    las gamas del segmento abierto como cards lean. Elegir fija `selectedCategory`
    (search) + `vehiculo` (form) y habilita avanzar al Paso 3 (SCEN-W-03/04/05).

    Estados vacío/error se refinan en el Paso 12 (Fase 4); aquí un fallback mínimo.
  -->
  <div>
    <header class="mb-5">
      <h2 class="heading-card text-gray-900">Elige tu vehículo</h2>
      <p class="mt-1 body-base text-gray-500">
        Agrupamos las opciones por tipo. Abre un grupo y elige la gama que prefieras.
      </p>
    </header>

    <!-- Cargando disponibilidad -->
    <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PlaceholdersCategoryCard />
      <PlaceholdersCategoryCard class="hidden sm:block" />
    </div>

    <!-- Error de disponibilidad bloqueante (server / one-way / timeout / horario…):
         banner inline accionable (Paso 12, SCEN-W-12). server_error añade el
         fallback humano por WhatsApp. -->
    <div
      v-else-if="availabilityError"
      class="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      data-testid="wizard-vehicle-error-test"
    >
      <template v-if="isServerError">
        <p class="heading-sub text-gray-900">Servicio temporalmente no disponible</p>
        <p class="mt-1 body-base text-gray-600">
          Estamos con problemas técnicos. Intenta de nuevo en unos minutos.
        </p>
        <a
          :href="`https://wa.me/57${whatsappContact.phone}`"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-block body-sm font-semibold text-brand-800 underline"
        >
          Escríbenos por WhatsApp {{ whatsappContact.display }}
        </a>
      </template>
      <template v-else>
        <p class="heading-sub text-gray-900">No pudimos completar la búsqueda</p>
        <p class="mt-1 body-base text-gray-600">{{ errorMessage }}</p>
      </template>
      <div class="mt-4">
        <button
          type="button"
          class="body-sm font-bold text-brand-800 underline underline-offset-4 hover:text-brand-900"
          data-testid="wizard-adjust-search-test"
          @click="emit('adjust-search')"
        >
          Ajustar búsqueda
        </button>
      </div>
    </div>

    <!-- Sin vehículos renderizables → estado vacío + CTA que vuelve a la búsqueda.
         Se gatea por `groups.length` — el MISMO conjunto que renderan los tiles —
         no por `hasAvailableCategories` del store: éste solo descarta el centinela
         999999999, así que una gama disponible sin metadata de presentación
         (código no mapeado en Supabase) lo dejaría true con cero tiles → pantalla
         muerta sin salida. Gatear por groups cubre ambos casos. `no_available_categories`
         cae aquí (no es error duro). -->
    <div
      v-else-if="groups.length === 0"
      class="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center"
      data-testid="wizard-vehicle-empty-test"
    >
      <p class="heading-sub text-gray-900">Sin vehículos para esta búsqueda</p>
      <p class="mt-1 body-base text-gray-500">
        No encontramos disponibilidad para estas fechas y sede.
      </p>
      <div class="mt-4">
        <button
          type="button"
          class="body-sm font-bold text-brand-800 underline underline-offset-4 hover:text-brand-900"
          data-testid="wizard-adjust-search-test"
          @click="emit('adjust-search')"
        >
          Ajustar búsqueda
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Issue #313 — nivel flujo: TODAS las gamas caen más allá del horizonte
           de tarifas (caso 2027). Fail-closed: no se cotiza, se ofrece contacto. -->
      <div
        v-if="allBeyondHorizon"
        class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center"
        data-testid="wizard-horizon-unavailable-test"
      >
        <p class="heading-sub text-gray-900">
          Las tarifas para tu fecha aún no están disponibles
        </p>
        <p class="mt-1 body-base text-gray-600">Escríbenos y te cotizamos.</p>
        <a
          :href="`https://wa.me/57${whatsappContact.phone}`"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-block body-sm font-semibold text-brand-800 underline"
        >
          Escríbenos por WhatsApp {{ whatsappContact.display }}
        </a>
      </div>

      <!-- Nivel 1 — tiles de segmento -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WizardVehicleSegmentTile
          v-for="group in groups"
          :key="group.segment.id"
          :segment="group.segment"
          :count="group.codes.length"
          :from-price="fromPrice(group)"
          :unavailable="segmentBeyondHorizon(group)"
          :active="openSegment === group.segment.id"
          @select="toggleSegment(group.segment.id)"
        />
      </div>

      <!-- Nivel 2 — gamas del segmento abierto. scroll-mt reserva el espacio del
           header (64px) + la barra de pasos sticky para que scrollIntoView no las
           esconda debajo. -->
      <div v-if="openGroup" ref="level2Ref" class="mt-6 scroll-mt-32">
        <h3 class="mb-3 heading-label text-gray-500">{{ openGroup.segment.label }}</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WizardVehicleCard
            v-for="(code, index) in openGroup.codes"
            :key="code"
            :category="rowByCode.get(code)!"
            :vehicle-category="vehicleCategories[code]"
            :priority="index === 0"
            :selected="selectedCode === code"
            @select="onSelect"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// External
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

// config
import { groupBySegment, segmentForCode, type SegmentGroup, type SegmentId } from '~/config/vehicleSegments'

// utils
import { pickPriceForDate, isBeyondPricingHorizon } from '@rentacar-main/logic/utils'

// Types
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

const emit = defineEmits<{
  /** El usuario pide volver a la búsqueda (Paso 1 en /reservas, #searcher en city). */
  (e: 'adjust-search'): void
}>()

const search = useStoreSearchData()
const form = useStoreReservationForm()
const { filteredCategories, pending, selectedCategory, error } = storeToRefs(search)
const { vehiculo, haveMonthlyReservation, fechaRecogida } = storeToRefs(form)

const { vehicleCategories } = useFetchRentacarData()
const { moneyFormat } = useMoneyFormat()

// ── Estado de error de disponibilidad (Paso 12, SCEN-W-12) ────────────────────
// El store ya clasificó el error en useFetchCategoriesAvailabilityData
// (mapAvailabilityFetchError + classifyOneWayDistanceError). `no_available_categories_error`
// NO es un error duro: es "sin stock" → cae al estado vacío. El resto (server_error,
// one_way_not_available, timeout, out_of_schedule…) → banner inline accionable.
const availabilityError = computed(() =>
  error.value && error.value.error !== 'no_available_categories_error' ? error.value : null,
)
const isServerError = computed(() => availabilityError.value?.error === 'server_error')
const isOneWayError = computed(() => availabilityError.value?.error === 'one_way_not_available')
const errorMessage = computed(() => {
  if (isOneWayError.value) {
    return 'No podemos cotizar la entrega en una sede distinta a la de recogida para estas ciudades. Elige devolver el vehículo en la misma sede.'
  }
  return (
    availabilityError.value?.message ||
    'No pudimos completar la búsqueda. Ajusta los datos e intenta de nuevo.'
  )
})

// Fallback humano (WhatsApp) ante server_error — espeja CategorySelectionSection.
const whatsappContact = { phone: '3187703670', display: '318 770 3670' }

// Solo gamas renderizables Y disponibles: espeja renderableCategories de
// CategorySelectionSection (necesitan metadata de presentación) y descarta las
// "unable" (estimatedTotalAmount centinela 999999999). Ninguna gama sin card se
// cuela en un tile ni en el conteo del segmento.
const renderable = computed<CategoryAvailabilityData[]>(() =>
  filteredCategories.value.filter(
    (c: CategoryAvailabilityData) =>
      vehicleCategories[c.categoryCode] && c.estimatedTotalAmount !== 999999999,
  ),
)

// Índice code→fila (primera ocurrencia). filteredCategories viene ordenado por
// estimatedTotalAmount asc, así que el primer código de cada grupo es el más barato.
const rowByCode = computed(() => {
  const m = new Map<string, CategoryAvailabilityData>()
  for (const row of renderable.value) if (!m.has(row.categoryCode)) m.set(row.categoryCode, row)
  return m
})

// Dedup defensivo: rowByCode ya conserva la primera fila por código; deduplicar
// aquí evita conteos inflados y cards con :key repetida si filteredCategories
// devolviera >1 fila por categoryCode (code-review F2).
const groups = computed<SegmentGroup[]>(() =>
  groupBySegment([...new Set(renderable.value.map((r) => r.categoryCode))]),
)

/**
 * Precio mensual vendible más barato de una fila: el menor entre los planes de 1.000 y
 * 2.000 km que tengan precio positivo. Un plan a 0 significa "no se vende" (el dashboard
 * limpia a NULL y el transformer lo mapea a 0), así que no puede fijar el piso.
 * `pickPriceForDate` es la MISMA selección de fila que usa useCategory para cobrar.
 */
function rowMonthlyBasic(row: CategoryAvailabilityData): number {
  const prices = row.categoryMonthPrices
  if (!prices) return Number.POSITIVE_INFINITY
  const month = pickPriceForDate(prices, fechaRecogida.value ?? '')
  if (!month) return Number.POSITIVE_INFINITY
  const sellable = [month['1k_kms'], month['2k_kms']].filter((p) => p > 0)
  if (sellable.length === 0) return Number.POSITIVE_INFINITY
  return Math.min(...sellable) + (row.returnFeeAmount ?? 0)
}

/**
 * Total (Seguro Básico) de una fila, MISMA familia de precio que muestran las
 * cards y el sidebar: getTotalPrice del caso por defecto (sin Total)
 * = totalAmount + coverageTotalAmount + returnFee (useCategory.ts:230). NO usar
 * estimatedTotalAmount aquí: ese incluye IVA+tasa (getActualTotalPrice) y dejaría
 * el "desde" ~19% por encima del precio real de la card más barata (from-floor
 * mayor que el precio mostrado — lee como bait). Ver code-review Finding 1.
 *
 * En MENSUAL esos tres campos valen 0: Localiza no cotiza ventanas de 30 días y
 * `createCategoryAvailability` sintetiza la fila con ceros — el precio vive en
 * `month_prices`. Sumarlos hacía que los 4 tiles dijeran "desde $ 0".
 */
function rowBasicTotal(row: CategoryAvailabilityData): number {
  if (haveMonthlyReservation.value) return rowMonthlyBasic(row)
  return (row.totalAmount ?? 0) + (row.coverageTotalAmount ?? 0) + (row.returnFeeAmount ?? 0)
}

/** "Desde $X" del más barato disponible del segmento (SCEN-W-03). */
function fromPrice(group: SegmentGroup): string {
  const cheapest = Math.min(
    ...group.codes.map((code) => {
      const row = rowByCode.value.get(code)
      return row ? rowBasicTotal(row) : Infinity
    }),
  )
  return Number.isFinite(cheapest) ? moneyFormat(cheapest) : ''
}

// ── Issue #313: fail-closed más allá del horizonte de tarifas ─────────────────
// Solo aplica en reserva mensual (la diaria no usa month_prices). Distingue el
// Infinity "por horizonte excedido" del Infinity "sin plan vendible" para no
// confundir causas — misma selección de fila que useCategory usa para cobrar.

/** ¿La fila cae más allá del horizonte de tarifas mensuales para el pickup? */
function rowBeyondHorizon(row: CategoryAvailabilityData): boolean {
  return (
    haveMonthlyReservation.value &&
    isBeyondPricingHorizon(row.categoryMonthPrices ?? [], fechaRecogida.value ?? '')
  )
}

/** Un segmento no tiene tarifa cuando TODOS sus códigos caen más allá del horizonte. */
function segmentBeyondHorizon(group: SegmentGroup): boolean {
  if (!haveMonthlyReservation.value) return false
  return group.codes.every((code) => {
    const row = rowByCode.value.get(code)
    return row ? rowBeyondHorizon(row) : false
  })
}

/**
 * Nivel flujo (banner): TODAS las gamas renderizables caen más allá del horizonte
 * (el caso 2027 del audit). Distinto de "sin disponibilidad": aquí sí hay gamas,
 * pero ninguna tiene tarifa cargada para la fecha.
 */
const allBeyondHorizon = computed<boolean>(
  () =>
    haveMonthlyReservation.value &&
    renderable.value.length > 0 &&
    renderable.value.every((row) => rowBeyondHorizon(row)),
)

const openSegment = ref<SegmentId | null>(null)
const level2Ref = ref<HTMLElement | null>(null)
const openGroup = computed<SegmentGroup | null>(
  () => groups.value.find((g) => g.segment.id === openSegment.value) ?? null,
)

function toggleSegment(id: SegmentId): void {
  const willOpen = openSegment.value !== id
  openSegment.value = willOpen ? id : null
  // Al ABRIR un segmento, desplazar a sus cards (en móvil quedan bajo el fold).
  // Solo en interacción del usuario (no en el auto-open de montaje).
  if (willOpen && import.meta.client) {
    nextTick(() => level2Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

// Abre por defecto el segmento del vehículo ya elegido (back/deep-link) o, si no
// hay, el primer grupo (el más barato). Reacciona cuando llega la disponibilidad.
watch(
  [groups, selectedCategory],
  ([gs]) => {
    if (openSegment.value && gs.some((g) => g.segment.id === openSegment.value)) return
    const selCode = selectedCategory.value?.categoryCode
    openSegment.value = selCode ? segmentForCode(selCode) : (gs[0]?.segment.id ?? null)
  },
  { immediate: true },
)

const selectedCode = computed(() => selectedCategory.value?.categoryCode ?? null)

/**
 * Fija la gama elegida. `cat` es la instancia useCategory que emite la card;
 * queda como selectedCategory (lo que useRecordReservationForm lee al enviar) y
 * su código como `vehiculo`. Un vehículo recién elegido arranca en Seguro Básico
 * y kilometraje 1k: son los defaults de la instancia, y el watcher de derivación
 * de ReservationWizard los espeja en el form.
 */
function onSelect(cat: ReturnType<typeof useCategory>): void {
  // Re-tap de la gama ya elegida = no-op: reasignar crearía una instancia fresca
  // (withTotalCoverage/withMileage/extras en su default) y borraría el Seguro Total,
  // el plan de kilometraje y los adicionales ya elegidos (data loss en conversión).
  if (cat.categoryCode.value === selectedCode.value) return
  selectedCategory.value = cat
  vehiculo.value = cat.categoryCode.value
  search.trackVehicleSelection(cat)
}
</script>
