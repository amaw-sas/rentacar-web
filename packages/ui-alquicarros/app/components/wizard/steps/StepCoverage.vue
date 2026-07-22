<template>
  <!--
    Paso 3 — Seguro. Comparador Básico vs Total lado a lado (SCEN-W-06). Básico
    preseleccionado; Total marcado "recomendado" sin forzar. Elegir togglea
    `withTotalCoverage` en la instancia selectedCategory (recalcula el total del
    sidebar en vivo) y sincroniza `haveTotalInsurance` en el form — lo que
    useRecordReservationForm envía. AA: la opción activa usa relleno naranja con
    texto oscuro.
  -->
  <div>
    <header class="mb-5">
      <h2 class="heading-card text-gray-900">Elige tu cobertura</h2>
      <p class="mt-1 body-base text-gray-500">
        El Seguro Básico ya está incluido. Puedes ampliar a Total para viajar sin
        responsabilidad económica ante siniestro.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- Básico -->
      <button
        type="button"
        class="rounded-2xl border p-5 text-left transition-colors"
        :class="!isTotal ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600' : 'border-gray-200 bg-white hover:border-brand-300'"
        :aria-pressed="!isTotal"
        data-testid="wizard-coverage-basico-test"
        @click="choose(false)"
      >
        <div class="flex items-center justify-between">
          <span class="heading-sub text-gray-900">Seguro Básico</span>
          <UIcon v-if="!isTotal" name="i-lucide-check-circle-2" class="size-6 text-brand-800" />
        </div>
        <p class="mt-1 body-sm font-semibold text-gray-500">Incluido</p>
        <ul class="mt-3 space-y-1.5 body-sm text-gray-600">
          <li class="flex gap-2"><span>✓</span> Daños y lesiones a terceros</li>
          <li class="flex gap-2"><span>✓</span> Cubre la mayor parte del vehículo</li>
          <li class="flex gap-2 text-gray-600"><span>—</span> Con participación obligatoria (deducible)</li>
        </ul>
      </button>

      <!-- Total. Sin fila de pricing activa aplicable a la fecha no hay tarifa
           diaria de Seguro Total: se omite la card (fallo visible) en vez de
           cotizar una tarifa retirada o un upgrade $0. En mensual el precio es
           `total_insurance_price` de la fila del mes, no aplica. #322 PR10. -->
      <button
        v-if="canQuoteTotal"
        type="button"
        class="relative rounded-2xl border p-5 text-left transition-colors"
        :class="isTotal ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600' : 'border-gray-200 bg-white hover:border-brand-300'"
        :aria-pressed="isTotal"
        data-testid="wizard-coverage-total-test"
        @click="choose(true)"
      >
        <span class="absolute -top-2.5 right-4 rounded-full bg-brand-600 px-2.5 py-0.5 body-xs font-bold text-gray-900">
          Recomendado
        </span>
        <div class="flex items-center justify-between">
          <span class="heading-sub text-gray-900">Seguro Total</span>
          <UIcon v-if="isTotal" name="i-lucide-check-circle-2" class="size-6 text-brand-800" />
        </div>
        <p class="mt-1 body-sm font-semibold text-brand-800">
          + $ {{ coveragePrice }} / {{ haveMonthlyReservation ? 'mes' : 'día' }}
        </p>
        <ul class="mt-3 space-y-1.5 body-sm text-gray-600">
          <li class="flex gap-2"><span>✓</span> Todo lo del Básico</li>
          <li class="flex gap-2"><span>✓</span> Cubre el 100% del vehículo, daño o robo</li>
          <li class="flex gap-2 font-medium text-gray-900"><span>✓</span> Sin participación obligatoria</li>
        </ul>
      </button>
    </div>

    <!--
      Kilometraje — solo en reserva mensual (30 días). El plan cambia el precio del
      vehículo, así que vive junto a la otra decisión que mueve el total.
    -->
    <section v-if="haveMonthlyReservation" class="mt-8">
      <h3 class="heading-sub text-gray-900">Elige tu kilometraje</h3>
      <p class="mt-1 body-base text-gray-500">
        Cuántos kilómetros puedes recorrer al mes. Al superarlos se cobra un excedente
        por kilómetro.
      </p>

      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          v-for="plan in mileagePlans"
          :key="plan.value"
          type="button"
          class="rounded-2xl border p-5 text-left transition-colors"
          :class="mileage === plan.value ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600' : 'border-gray-200 bg-white hover:border-brand-300'"
          :aria-pressed="mileage === plan.value"
          :data-testid="`wizard-mileage-${plan.value}-test`"
          @click="chooseMileage(plan.value)"
        >
          <div class="flex items-center justify-between">
            <span class="heading-sub text-gray-900">{{ plan.label }}</span>
            <UIcon v-if="mileage === plan.value" name="i-lucide-check-circle-2" class="size-6 text-brand-800" />
          </div>
          <p class="mt-1 body-sm font-semibold text-brand-800">$ {{ plan.price }} / mes</p>
        </button>
      </div>
    </section>

    <p class="mt-4 body-xs text-gray-600">
      Ningún seguro cubre accesorios removibles, documentos, placas, llaves ni multas
      de tránsito generadas durante el alquiler.
    </p>
  </div>
</template>

<script setup lang="ts">
// External
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'

// utils
import { pickPriceForDate } from '@rentacar-main/logic/utils'

// Types
import type { MonthlyMileage } from '@rentacar-main/logic/utils'

const search = useStoreSearchData()
const form = useStoreReservationForm()
const { selectedCategory } = storeToRefs(search)
const { haveMonthlyReservation, fechaRecogida } = storeToRefs(form)
const { moneyFormat } = useMoneyFormat()

// Las props de useCategory llegan auto-unwrapeadas al leer selectedCategory.value
// (Pinia envuelve en reactive) — sin `.value` anidado (ese trap da undefined/NaN).
const isTotal = computed(() => selectedCategory.value?.withTotalCoverage === true)
const mileage = computed(() => selectedCategory.value?.withMileage ?? null)

/**
 * En reserva regular el upgrade a Total se cotiza con `totalCoverageUnitCharge`
 * (cargo diario de la fila de pricing activa aplicable a la fecha — #322 PR10);
 * si es null no hay tarifa aplicable y la card se omite. En mensual el cobro
 * real es `total_insurance_price` de la fila del mes, así que no depende del
 * cargo diario.
 */
const canQuoteTotal = computed(() => {
  if (haveMonthlyReservation.value) return true
  return selectedCategory.value?.canQuoteTotalCoverage === true
})

/** Si la opción deja de ser cotizable, ninguna reserva puede quedar en Total. */
watch(
  canQuoteTotal,
  (can) => {
    const sc = selectedCategory.value
    if (!can && sc?.withTotalCoverage) sc.withTotalCoverage = false
  },
  { immediate: true },
)

/**
 * Fila de precios mensuales que aplica a la fecha de recogida. Debe ser la MISMA que
 * usa useCategory.getCategoryMonthPrice para cobrar: pickPriceForDate puede devolver
 * una fila `inactive` (la más cercana) cuando ninguna activa cubre la fecha. Elegirla
 * de otro modo haría que la etiqueta mienta sobre lo que se cobra.
 */
const monthPrice = computed(() => {
  const prices = selectedCategory.value?.categoryMonthPrices
  return prices ? pickPriceForDate(prices, fechaRecogida.value ?? '') : undefined
})

/**
 * Costo incremental del Seguro Total sobre el Básico.
 *
 * En reserva regular es un cargo DIARIO: useCategory no expone el cargo diario del
 * seguro total, pero sí las cargas raw, y el delta replica el floor de
 * pickEffectiveTotalCoverageUnitCharge (nunca negativo) sin tocar logic/.
 *
 * En mensual el cobro real es `total_insurance_price` de la fila del mes
 * (useCategory.getTotalPrice: monthPriceMileage + total_insurance_price), una unidad
 * distinta. Mostrar ahí el cargo diario compara peras con naranjas.
 */
const coveragePrice = computed(() => {
  const sc = selectedCategory.value
  if (!sc) return ''
  if (haveMonthlyReservation.value) return moneyFormat(monthPrice.value?.total_insurance_price ?? 0)
  return moneyFormat(Math.max(0, (sc.totalCoverageUnitCharge ?? 0) - (sc.coverageUnitCharge ?? 0)))
})

/**
 * Planes vendibles. El de 3.000 km existe en el tipo y en los datos pero ninguna marca
 * lo oferta (CategoryCard lo tiene tras `v-if="false"`), y categoryOffersMonthly
 * tampoco lo cuenta. El de 2.000 km se omite cuando su precio no es positivo: una gama
 * puede ofrecer mensual solo con el plan de 1.000 km.
 */
const mileagePlans = computed<{ value: MonthlyMileage; label: string; price: string }[]>(() => {
  const row = monthPrice.value
  if (!row) return []
  const plans: { value: MonthlyMileage; label: string; price: string }[] = []
  if (row['1k_kms'] > 0) plans.push({ value: '1k_kms', label: '1.000 km', price: moneyFormat(row['1k_kms']) })
  if (row['2k_kms'] > 0) plans.push({ value: '2k_kms', label: '2.000 km', price: moneyFormat(row['2k_kms']) })
  return plans
})

/**
 * `useCategory.withMileage` arranca SIEMPRE en `"1k_kms"` (logic, no se toca). Si la gama
 * no vende ese plan (`1k_kms <= 0`), el precio mostrado y el cobrado serían 0 y ningún
 * botón quedaría marcado. Corregir al plan vendible más barato apenas se conoce la fila.
 */
watch(
  [mileagePlans, () => selectedCategory.value?.withMileage],
  ([plans, current]) => {
    const sc = selectedCategory.value
    if (!sc || !haveMonthlyReservation.value || plans.length === 0) return
    if (!plans.some((p) => p.value === current)) sc.withMileage = plans[0]!.value
  },
  { immediate: true, flush: 'sync' },
)

/**
 * Fija la cobertura en la instancia; recalcula getTotalPrice → sidebar. El flag
 * `haveTotalInsurance` del payload lo deriva el watcher de ReservationWizard: escribirlo
 * aquí reintroduciría la doble fuente de verdad que dejó al kilometraje sin sincronizar.
 */
function choose(total: boolean): void {
  const sc = selectedCategory.value
  if (!sc) return
  sc.withTotalCoverage = total
}

/** Ídem para el plan de kilometraje: la instancia manda, el store la espeja. */
function chooseMileage(plan: MonthlyMileage): void {
  const sc = selectedCategory.value
  if (!sc) return
  sc.withMileage = plan
}
</script>
