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
            class="flex items-start justify-between gap-3"
            :data-testid="row.testid"
          >
            <dt class="body-sm text-gray-500 shrink-0">{{ row.label }}</dt>
            <dd class="text-right">
              <span
                class="body-sm font-medium"
                :class="row.muted ? 'text-gray-600' : 'text-gray-900'"
              >{{ row.value }}</span>
              <!-- Issue #367: la entrega en otra sede/ciudad se marca aquí, no solo en
                   el toast transitorio de la búsqueda. El separador explícito es
                   obligatorio: Vue (whitespace: 'condense') borra el nodo de texto en
                   blanco entre etiquetas, y un lector de pantalla anunciaba
                   "Bogotá Aeropuertootra ciudad" de corrido. El margen visual (ml-1.5)
                   no arregla el flujo de texto. -->
              {{ ' ' }}
              <span
                v-if="row.badge"
                class="ml-1.5 inline-block rounded-full bg-brand-100 px-1.5 py-0.5 body-xs font-medium text-brand-900 align-middle"
                data-testid="wizard-oneway-badge"
              >{{ row.badge }}</span>
              {{ ' ' }}
              <span v-if="row.sub" class="block body-xs text-gray-500">{{ row.sub }}</span>
            </dd>
          </div>
        </dl>
        <div class="px-5 pb-4">
          <div class="border-t border-dashed border-gray-200 pt-3">
            <!-- Issue #373: desglose per-day renta + IVA/tasa (oculto en mensual). -->
            <template v-if="showRentBreakdown">
              <div class="flex items-baseline justify-between gap-3">
                <span class="body-sm text-gray-500">Total renta</span>
                <span class="body-sm font-medium text-gray-700" data-testid="wizard-total-renta">$ {{ rentaLabel }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-3 mt-1" data-testid="wizard-iva-tax-line">
                <span class="body-sm text-gray-500">IVA + Tasa</span>
                <span class="body-sm font-medium text-gray-700">$ {{ ivaTaxLabel }}</span>
              </div>
            </template>
            <div
              class="flex items-baseline justify-between gap-3"
              :class="showRentBreakdown ? 'mt-2 pt-2 border-t border-gray-100' : ''"
            >
              <span class="body-base font-semibold text-gray-900">Total a pagar</span>
              <span class="price-md text-brand-800 font-heading" data-testid="wizard-total-a-pagar">{{ totalDisplay }}</span>
            </div>
            <!-- Issue #367: el traslado del one-way ya vive DENTRO del total (useCategory
                 getTotalPrice), así que se enuncia como inclusión. Cuelga de "Total a
                 pagar" y NO del desglose de #373 a propósito: `showRentBreakdown` se
                 apaga en mensual, pero useCategory.ts:250,266 SUMA la tarifa al total
                 mensual y el selector de devolución no está gateado por duración — un
                 one-way mensual cobraba el traslado sin nombrarlo nunca. -->
            <div
              v-if="returnFeeLabel"
              class="flex items-baseline justify-between gap-3 mt-0.5 pl-3"
              data-testid="wizard-return-fee-line"
            >
              <span class="body-xs text-gray-500">incluye traslado</span>
              <span class="body-xs text-gray-500">$ {{ returnFeeLabel }}</span>
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
        <!--
          El techo de la transición debe superar la altura REAL del panel: es el
          estado final del enter y el inicial del leave, así que si se queda corto
          el detalle se abre clipeado y salta al quitarse la clase (y se recorta de
          golpe al cerrar). Medido en Chrome a 360 y 390 px con one-way + los tres
          adicionales: 329 px, y el max-h-80 de #350 (320 px) ya no daba. En mensual
          entra además la fila "Kilometraje" (+32 px) y un nombre de sede largo
          envuelve. 28rem deja margen para ambos. Issue #367.
        -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[28rem]"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 max-h-[28rem]"
          leave-to-class="opacity-0 max-h-0"
        >
          <dl v-if="mobileOpen" class="px-4 pt-3 pb-1 space-y-2 overflow-hidden">
            <div
              v-for="row in rows"
              :key="row.label"
              class="flex items-start justify-between gap-3"
              :data-testid="row.testid ? `${row.testid}-mobile` : undefined"
            >
              <dt class="body-sm text-gray-500">{{ row.label }}</dt>
              <dd class="text-right">
                <span
                  class="body-sm font-medium"
                  :class="row.muted ? 'text-gray-600' : 'text-gray-900'"
                >{{ row.value }}</span>
                <!-- Separador explícito: ver el bloque de escritorio. -->
                {{ ' ' }}
                <span
                  v-if="row.badge"
                  class="ml-1.5 inline-block rounded-full bg-brand-100 px-1.5 py-0.5 body-xs font-medium text-brand-900 align-middle"
                  data-testid="wizard-oneway-badge-mobile"
                >{{ row.badge }}</span>
                {{ ' ' }}
                <span v-if="row.sub" class="block body-xs text-gray-500">{{ row.sub }}</span>
              </dd>
            </div>
            <!-- Issue #373: desglose per-day renta + IVA/tasa (oculto en mensual). -->
            <template v-if="showRentBreakdown">
              <div class="flex items-baseline justify-between gap-3 border-t border-dashed border-gray-200 pt-2">
                <dt class="body-sm text-gray-500">Total renta</dt>
                <dd class="body-sm text-right font-medium text-gray-700" data-testid="wizard-total-renta-mobile">$ {{ rentaLabel }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3" data-testid="wizard-iva-tax-line-mobile">
                <dt class="body-sm text-gray-500">IVA + Tasa</dt>
                <dd class="body-sm text-right font-medium text-gray-700">$ {{ ivaTaxLabel }}</dd>
              </div>
            </template>
            <!-- Issue #367: fuera del desglose de #373 (ver escritorio) — en móvil el
                 "Total a pagar" vive en la barra, así que esta línea cierra el detalle
                 y aplica igual en diaria y en mensual. -->
            <div
              v-if="returnFeeLabel"
              class="flex items-baseline justify-between gap-3 pl-3"
              :class="showRentBreakdown ? '' : 'border-t border-dashed border-gray-200 pt-2'"
              data-testid="wizard-return-fee-line-mobile"
            >
              <dt class="body-xs text-gray-500">incluye traslado</dt>
              <dd class="body-xs text-right text-gray-500">$ {{ returnFeeLabel }}</dd>
            </div>
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
            <span class="price-md text-brand-800 font-heading leading-none">{{ totalDisplay }}</span>
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
  selectedReturnLocation,
  lugarRecogida,
  lugarDevolucion,
  selectedDays,
  humanFormattedPickupDateShort,
  humanFormattedPickupHour,
  humanFormattedReturnDateShort,
  humanFormattedReturnHour,
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

// Issue #367: la tarifa de traslado del one-way viaja SUMADA dentro de getTotalPrice
// (useCategory.ts:271-275, y :250/:266 en mensual) y nunca se nombraba. Se enuncia como
// INCLUSIÓN, no como sumando: presentarla aparte rompería la reconciliación
// renta + IVA/tasa = total a pagar que fijó #373.
// Se compara `returnFeeAmount > 0` en vez de invocar `hasReturnFee()`. No es porque la
// función falle con 0 (useCategory.ts:119 también devuelve false), sino porque `> 0`
// además descarta negativos y basura no numérica que llegara del pass-through.
// El guard de totalLabel es el fail-closed de #313: más allá del horizonte de tarifas
// el total muestra "—", y anunciar ahí "incluye traslado $ 45.000" prometería un
// desglose de un precio que la propia UI declara no disponible.
const returnFeeLabel = computed(() => {
  const sc = selectedCategory.value
  if (!sc || totalLabel.value == null) return null
  if (!((sc.returnFeeAmount ?? 0) > 0)) return null
  return sc.currencyReturnFee ?? null
})

/**
 * ¿La entrega es en otra sede? Se deriva de los CÓDIGOS de sucursal, nunca de la
 * tarifa: la tarifa de traslado es pass-through desde Localiza y puede llegar en 0 en
 * un one-way genuino (LLNRRE003). Atar la marca visual al dinero la haría desaparecer
 * justo en el caso que este issue denuncia.
 */
const oneWayBadge = computed<string | null>(() => {
  const from = lugarRecogida.value
  const to = lugarDevolucion.value
  if (!from || !to || from === to) return null
  const fromCity = selectedPickupLocation.value?.city?.trim()
  const toCity = selectedReturnLocation.value?.city?.trim()
  // Ciudad desconocida NO es lo mismo que ciudad igual. `BranchData.city` se tipa
  // requerido pero nada lo valida en el ingest, y colapsar el caso a "otra sede"
  // afirmaría "misma ciudad" justo cuando puede ser la entrega cara e inesperada
  // en otra. Con los códigos ya distintos, lo único cierto es que el punto cambia.
  if (!fromCity || !toCity) return 'otro punto'
  return fromCity !== toCity ? 'otra ciudad' : 'otra sede'
})

/** "22 de jul de 2026 · 10:00 a. m." — omite la parte que falte; null si no queda nada. */
function whenLine(date?: string | null, hour?: string | null): string | null {
  const parts = [date, hour].filter((p): p is string => !!p)
  return parts.length ? parts.join(' · ') : null
}

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

// Issue #373 (SCEN-06): moneyFormat usa Intl estilo `decimal` (sin símbolo), así que
// el "$" lo antepone la vista (como la marca hermana). Fail-closed → '—' SIN "$".
const totalDisplay = computed(() => (totalLabel.value ? `$ ${totalLabel.value}` : '—'))

interface SummaryRow {
  label: string
  value: string
  muted: boolean
  /** Segunda línea bajo el valor (fecha · hora). */
  sub?: string | null
  /** Distintivo a la derecha del valor ("otra ciudad" / "otra sede"). */
  badge?: string | null
  /** Sufijo de `data-testid`; la barra móvil le añade "-mobile". */
  testid?: string
}

const rows = computed<SummaryRow[]>(() => {
  const out: SummaryRow[] = []
  const branch = selectedPickupLocation.value
  const returnBranch = selectedReturnLocation.value
  const days = selectedDays.value

  if (days) {
    out.push({
      label: 'Duración',
      value: `${days} ${days === 1 ? 'día' : 'días'}`,
      muted: false,
    })
  }
  // Issue #367: recogida y devolución llevan cada una su sede en la primera línea y
  // su fecha · hora debajo. Antes solo existía "Recogida" (sede) + "Desde" (fecha), y
  // el cliente confirmaba sin ver dónde ni cuándo entrega — crítico en one-way.
  //
  // La fila se emite si hay sede O si hay cuándo: `selectedPickupLocation` es
  // `searchBranchByCode(...)`, que devuelve undefined con un código que no está en el
  // catálogo (deep-link viejo, o la ventana de hidratación antes de que aterrice la
  // admin data). Gatearla solo por la sede haría desaparecer también la FECHA, que en
  // main vivía en su propia fila "Desde" y sí sobrevivía. SCEN-07 admite las dos
  // ramas ("se omite, o muestra —"); con fechas presentes la honesta es mostrar "—"
  // en la sede y conservar el cuándo.
  const pickupWhen = whenLine(humanFormattedPickupDateShort.value, humanFormattedPickupHour.value)
  if (branch?.name || pickupWhen) {
    out.push({
      label: 'Recogida',
      value: branch?.name ?? '—',
      muted: !branch?.name,
      sub: pickupWhen,
      testid: 'wizard-pickup-branch',
    })
  }
  const returnWhen = whenLine(humanFormattedReturnDateShort.value, humanFormattedReturnHour.value)
  if (returnBranch?.name || returnWhen) {
    out.push({
      label: 'Devolución',
      value: returnBranch?.name ?? '—',
      muted: !returnBranch?.name,
      sub: returnWhen,
      badge: oneWayBadge.value,
      testid: 'wizard-return-branch',
    })
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
