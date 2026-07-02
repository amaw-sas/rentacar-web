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
          <UIcon v-if="!isTotal" name="i-lucide-check-circle-2" class="size-6 text-brand-700" />
        </div>
        <p class="mt-1 body-sm font-semibold text-gray-500">Incluido</p>
        <ul class="mt-3 space-y-1.5 body-sm text-gray-600">
          <li class="flex gap-2"><span>✓</span> Daños y lesiones a terceros</li>
          <li class="flex gap-2"><span>✓</span> Cubre la mayor parte del vehículo</li>
          <li class="flex gap-2 text-gray-400"><span>—</span> Con participación obligatoria (deducible)</li>
        </ul>
      </button>

      <!-- Total -->
      <button
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
          <UIcon v-if="isTotal" name="i-lucide-check-circle-2" class="size-6 text-brand-700" />
        </div>
        <p class="mt-1 body-sm font-semibold text-brand-700">
          + $ {{ coverageDailyPrice }} / día
        </p>
        <ul class="mt-3 space-y-1.5 body-sm text-gray-600">
          <li class="flex gap-2"><span>✓</span> Todo lo del Básico</li>
          <li class="flex gap-2"><span>✓</span> Cubre el 100% del vehículo, daño o robo</li>
          <li class="flex gap-2 font-medium text-gray-900"><span>✓</span> Sin participación obligatoria</li>
        </ul>
      </button>
    </div>

    <p class="mt-4 body-xs text-gray-400">
      Ningún seguro cubre accesorios removibles, documentos, placas, llaves ni multas
      de tránsito generadas durante el alquiler.
    </p>
  </div>
</template>

<script setup lang="ts">
// External
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

const search = useStoreSearchData()
const form = useStoreReservationForm()
const { selectedCategory } = storeToRefs(search)
const { haveTotalInsurance } = storeToRefs(form)
const { moneyFormat } = useMoneyFormat()

// Las props de useCategory llegan auto-unwrapeadas al leer selectedCategory.value
// (Pinia envuelve en reactive) — sin `.value` anidado (ese trap da undefined/NaN).
const isTotal = computed(() => selectedCategory.value?.withTotalCoverage === true)

// "+$X/día" = costo incremental diario del Total sobre el Básico. useCategory no
// expone el cargo diario del seguro total, pero sí las cargas raw; el delta
// replica el floor de pickEffectiveTotalCoverageUnitCharge (nunca negativo) sin
// tocar logic/.
const coverageDailyPrice = computed(() => {
  const sc = selectedCategory.value
  if (!sc) return ''
  return moneyFormat(Math.max(0, (sc.totalCoverageUnitCharge ?? 0) - (sc.coverageUnitCharge ?? 0)))
})

/**
 * Fija la cobertura. Escribe en la instancia (recalcula getTotalPrice → sidebar)
 * y sincroniza el flag del form que viaja en el payload de la reserva. Espeja lo
 * que CategoryCard.goNextStep hacía (haveTotalInsurance = withTotalCoverage).
 */
function choose(total: boolean): void {
  const sc = selectedCategory.value
  if (!sc) return
  sc.withTotalCoverage = total
  haveTotalInsurance.value = total
}
</script>
