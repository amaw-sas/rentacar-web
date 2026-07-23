<template>
  <!--
    Resumen persistente de la reserva (SCEN-W-08). Desktop: <aside> sticky siempre
    visible en paralelo al contenido. Móvil: barra inferior fija expandible.
    Refleja ciudad/días, recogida, gama, seguro, adicionales y total corrientes,
    leyendo el estado de dominio de los stores (no lo muta). Las cadenas de precio
    salen ya formateadas de useCategory (evita el trap de NaN por unwrapping).
  -->
  <div>
    <!-- Desktop: tarjeta sticky -->
    <aside class="hidden lg:block sticky top-24">
      <div class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div class="bg-surface-soft px-5 py-3 border-b border-gray-100">
          <h2 class="heading-label text-gray-500">Tu reserva</h2>
        </div>
        <dl class="px-5 py-4 space-y-2.5">
          <div
            v-for="row in rows"
            :key="row.label"
            class="flex items-baseline justify-between gap-3"
          >
            <dt class="body-sm text-gray-500 shrink-0">{{ row.label }}</dt>
            <dd
              class="body-sm text-right font-medium"
              :class="row.muted ? 'text-gray-600' : 'text-gray-900'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
        <div class="px-5 pb-4">
          <div class="border-t border-dashed border-gray-200 pt-3">
            <!-- Issue #373: desglose per-day renta + IVA/tasa (oculto en mensual). -->
            <template v-if="showRentBreakdown">
              <div class="flex items-baseline justify-between gap-3">
                <span class="body-sm text-gray-500">Total renta</span>
                <span class="body-sm font-medium text-gray-700" data-testid="wizard-total-renta">{{ rentaLabel }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-3 mt-1" data-testid="wizard-iva-tax-line">
                <span class="body-sm text-gray-500">IVA + Tasa</span>
                <span class="body-sm font-medium text-gray-700">{{ ivaTaxLabel }}</span>
              </div>
            </template>
            <div
              class="flex items-baseline justify-between gap-3"
              :class="showRentBreakdown ? 'mt-2 pt-2 border-t border-gray-100' : ''"
            >
              <span class="body-base font-semibold text-gray-900">Total a pagar</span>
              <span class="price-md text-brand-800 font-heading" data-testid="wizard-total-a-pagar">{{ totalLabel ?? '—' }}</span>
            </div>
            <p v-if="totalLabel" class="mt-0.5 body-xs text-right text-gray-500">Incluye IVA y tasa</p>
          </div>
          <UButton
            block
            size="lg"
            class="mt-4 justify-center rounded-full bg-brand-600 hover:bg-brand-700 text-gray-900 font-bold disabled:opacity-50"
            :disabled="ctaDisabled"
            data-testid="wizard-continue-desktop-test"
            @click="$emit('next')"
          >
            {{ ctaLabel }}
          </UButton>
          <p class="mt-2 body-xs text-center text-gray-600">
            Puedes editar cualquier paso completado desde la barra superior.
          </p>
        </div>
      </div>
    </aside>

    <!-- Móvil: barra inferior fija expandible -->
    <div class="lg:hidden fixed inset-x-0 bottom-0 z-40">
      <div class="border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-80"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 max-h-80"
          leave-to-class="opacity-0 max-h-0"
        >
          <dl v-if="mobileOpen" class="px-4 pt-3 pb-1 space-y-2 overflow-hidden">
            <div
              v-for="row in rows"
              :key="row.label"
              class="flex items-baseline justify-between gap-3"
            >
              <dt class="body-sm text-gray-500">{{ row.label }}</dt>
              <dd class="body-sm text-right font-medium" :class="row.muted ? 'text-gray-600' : 'text-gray-900'">
                {{ row.value }}
              </dd>
            </div>
            <!-- Issue #373: desglose per-day renta + IVA/tasa (oculto en mensual). -->
            <template v-if="showRentBreakdown">
              <div class="flex items-baseline justify-between gap-3 border-t border-dashed border-gray-200 pt-2">
                <dt class="body-sm text-gray-500">Total renta</dt>
                <dd class="body-sm text-right font-medium text-gray-700" data-testid="wizard-total-renta-mobile">{{ rentaLabel }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3" data-testid="wizard-iva-tax-line-mobile">
                <dt class="body-sm text-gray-500">IVA + Tasa</dt>
                <dd class="body-sm text-right font-medium text-gray-700">{{ ivaTaxLabel }}</dd>
              </div>
            </template>
          </dl>
        </transition>

        <div class="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            class="flex flex-col items-start"
            :aria-expanded="mobileOpen"
            aria-label="Ver detalle de la reserva"
            @click="mobileOpen = !mobileOpen"
          >
            <span class="body-xs text-gray-500 inline-flex items-center gap-1">
              Total a pagar
              <IconsChevronDownIcon
                class="h-3.5 w-3.5 transition-transform"
                :class="mobileOpen ? 'rotate-180' : ''"
              />
            </span>
            <span class="price-md text-brand-800 font-heading leading-none">{{ totalLabel ?? '—' }}</span>
          </button>
          <UButton
            block
            size="lg"
            class="flex-1 justify-center rounded-full bg-brand-600 hover:bg-brand-700 text-gray-900 font-bold disabled:opacity-50"
            :disabled="ctaDisabled"
            data-testid="wizard-continue-mobile-test"
            @click="$emit('next')"
          >
            {{ ctaLabel }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// External
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

// config
import { segmentForCode, VEHICLE_SEGMENTS } from '~/config/vehicleSegments'

const props = defineProps<{
  /** ¿El paso actual puede avanzar? Gobierna el CTA "Continuar". */
  canAdvance: boolean
  /** Texto del CTA (varía por paso: "Continuar" / "Confirmar reserva"). */
  ctaLabel?: string
}>()

defineEmits<{ (e: 'next'): void }>()

const ctaLabel = computed(() => props.ctaLabel ?? 'Continuar')

const mobileOpen = ref(false)

const form = useStoreReservationForm()
const search = useStoreSearchData()
const {
  selectedPickupLocation,
  selectedDays,
  humanFormattedPickupDateShort,
  isSubmittingForm,
  formSubmitLocked,
  haveMonthlyReservation,
} = storeToRefs(form)
const { selectedCategory } = storeToRefs(search)

// El CTA se deshabilita mientras la reserva está en vuelo (evita el doble-submit
// que registraría reservas duplicadas — el CTA de datos dispara el envío).
const ctaDisabled = computed(() => !props.canAdvance || isSubmittingForm.value || formSubmitLocked.value)

/** Nombre humano del segmento de la gama elegida (Económicos, Sedanes…). */
function segmentLabel(code: string): string {
  const id = segmentForCode(code)
  return VEHICLE_SEGMENTS.find((s) => s.id === id)?.label ?? 'Otros'
}

// NOTA: las props de useCategory guardadas en el ref del store llegan
// AUTO-UNWRAPEADAS (categoryCode es CategoryType, withTotalCoverage es boolean,
// currency* es string) — sin `.value` anidado (ese trap da undefined/NaN).
const gamaLabel = computed(() => {
  const code = selectedCategory.value?.categoryCode
  return code ? `Gama ${code} · ${segmentLabel(code)}` : null
})

const coverageLabel = computed(() => {
  const sc = selectedCategory.value
  if (!sc) return null
  return sc.withTotalCoverage ? 'Seguro Total' : 'Seguro Básico'
})

/** Plan de kilometraje elegido; solo tiene sentido en reserva mensual. */
const mileageLabel = computed(() => {
  const sc = selectedCategory.value
  if (!sc || !haveMonthlyReservation.value) return null
  return sc.withMileage === '2k_kms' ? '2.000 km' : sc.withMileage === '1k_kms' ? '1.000 km' : null
})

const extrasLabel = computed(() => {
  const sc = selectedCategory.value
  if (!sc) return null
  const items: string[] = []
  if (sc.withExtraDriver) items.push('Conductor')
  if (sc.withBabySeat) items.push('Silla bebé')
  if (sc.withWash) items.push('Lavado')
  return items.length ? items.join(' · ') : null
})

// Issue #373: el total prominente es lo que EFECTIVAMENTE se cobra con IVA + tasa
// (currencyTotalToPayWithAdditionals = getActualTotalPrice + adicionales). Antes se
// ligaba a currencyTotalWithAdditionals (renta SIN IVA/tasa): ~31% menos. Los
// adicionales se muestran dentro del total pero se registran como flags aparte del
// payload (misma convención que la marca hermana ReservationResume.vue).
// El fallback usa currencyActualTotalPrice (también IVA + tasa incluidos), NUNCA
// currencyTotalPrice: caer a la renta sin IVA reintroduciría el bug #373.
const totalLabel = computed(() => {
  const sc = selectedCategory.value
  // Issue #313: más allá del horizonte de tarifas los totales = 0, y
  // moneyFormat(0) = "0" (no nulish) burlaría el `?? '—'` → mostraría "Total 0"
  // (precio fabricado). Fail-closed: sin total que mostrar (el CTA ya está
  // bloqueado y la card/tile explican por qué).
  if (!sc || sc.isMonthlyPriceUnavailable) return null
  return sc.currencyTotalToPayWithAdditionals ?? sc.currencyActualTotalPrice ?? null
})

// "Total renta" — subtotal de renta con adicionales pero SIN IVA/tasa
// (getTotalWithAdditionals). Es la base sobre la que aplica "IVA + Tasa".
const rentaLabel = computed(() => {
  const sc = selectedCategory.value
  if (!sc || sc.isMonthlyPriceUnavailable) return null
  return sc.currencyTotalWithAdditionals ?? sc.currencyTotalPrice ?? null
})

// "IVA + Tasa" — la brecha entre renta y total a pagar (getIvaAndTaxAmount).
const ivaTaxLabel = computed(() => selectedCategory.value?.currencyIvaAndTax ?? null)

// Brecha numérica IVA + tasa = total a pagar − renta (los adicionales se cancelan).
// getIvaAndTaxAmount no se re-exporta desde useCategory, así que la derivamos de los
// dos totales numéricos que sí viajan en selectedCategory.
const ivaTaxAmount = computed(() => {
  const sc = selectedCategory.value
  if (!sc) return 0
  return (sc.getTotalToPayWithAdditionals ?? 0) - (sc.getTotalWithAdditionals ?? 0)
})

// El desglose renta / IVA solo tiene sentido per-day CON brecha positiva: en mensual
// el catálogo ya incluye IVA (brecha 0) y en datos anómalos (actual ≤ renta) la brecha
// se clampa a 0 → mostrar "IVA + Tasa $0" con renta ≥ total sería contradictorio.
// Fail-closed (totalLabel null) también lo oculta.
const showRentBreakdown = computed(
  () => totalLabel.value != null && !haveMonthlyReservation.value && ivaTaxAmount.value > 0
)

interface SummaryRow {
  label: string
  value: string
  muted: boolean
}

const rows = computed<SummaryRow[]>(() => {
  const out: SummaryRow[] = []
  const branch = selectedPickupLocation.value
  const days = selectedDays.value

  if (days) {
    out.push({
      label: 'Duración',
      value: `${days} ${days === 1 ? 'día' : 'días'}`,
      muted: false,
    })
  }
  if (branch?.name) {
    out.push({ label: 'Recogida', value: branch.name, muted: false })
  }
  if (humanFormattedPickupDateShort.value) {
    out.push({ label: 'Desde', value: humanFormattedPickupDateShort.value, muted: false })
  }
  out.push({ label: 'Vehículo', value: gamaLabel.value ?? 'Elige →', muted: !gamaLabel.value })
  out.push({ label: 'Seguro', value: coverageLabel.value ?? '—', muted: !coverageLabel.value })
  if (haveMonthlyReservation.value) {
    out.push({ label: 'Kilometraje', value: mileageLabel.value ?? '—', muted: !mileageLabel.value })
  }
  out.push({ label: 'Adicionales', value: extrasLabel.value ?? '—', muted: !extrasLabel.value })
  return out
})
</script>
