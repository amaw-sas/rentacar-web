<template>
  <!--
    Paso 4 — Adicionales (opcional). Toggles de conductor adicional / silla de bebé
    / lavado con precios de useCategory; cada uno escribe el flag en la instancia
    selectedCategory (lo que useRecordReservationForm envía) y actualiza el sidebar.
    Botón "Omitir" avanza sin marcar nada (SCEN-W-07).
  -->
  <div>
    <header class="mb-5">
      <h2 class="heading-card text-gray-900">Servicios adicionales</h2>
      <p class="mt-1 body-base text-gray-500">
        Opcional. Añade lo que necesites o continúa sin adicionales.
      </p>
    </header>

    <div class="space-y-3">
      <label
        v-for="opt in options"
        :key="opt.key"
        class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-colors"
        :class="opt.model.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-300'"
      >
        <div class="flex items-center gap-3">
          <UCheckbox v-model="opt.model.value" color="success" :data-testid="`wizard-extra-${opt.key}-test`" />
          <div>
            <span class="block heading-sub text-gray-900">{{ opt.label }}</span>
            <span class="block body-sm text-gray-500">{{ opt.hint }}</span>
          </div>
        </div>
        <span class="shrink-0 price-md font-heading text-brand-800">$ {{ opt.price.value }}</span>
      </label>
    </div>

    <button
      type="button"
      class="mt-5 body-sm font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800"
      data-testid="wizard-extras-skip-test"
      @click="onOmitir"
    >
      Omitir — continuar sin adicionales
    </button>
  </div>
</template>

<script setup lang="ts">
// External
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

const emit = defineEmits<{ (e: 'skip'): void }>()

const search = useStoreSearchData()
const { selectedCategory } = storeToRefs(search)

/**
 * "Omitir — continuar sin adicionales": limpia cualquier adicional que el usuario
 * hubiera marcado (los tres flags a false) ANTES de avanzar, para que el texto sea
 * literal (sin adicionales) y el payload/sidebar no arrastren selecciones.
 */
function onOmitir(): void {
  const sc = selectedCategory.value
  if (sc) {
    sc.withExtraDriver = false
    sc.withBabySeat = false
    sc.withWash = false
  }
  emit('skip')
}

// v-model sobre los flags auto-unwrapeados de la instancia (Pinia reactive):
// leer/escribir selectedCategory.value.withX propaga al mismo ref que
// useRecordReservationForm envía y recalcula el total del sidebar.
function flagModel(key: 'withExtraDriver' | 'withBabySeat' | 'withWash') {
  return computed<boolean>({
    get: () => selectedCategory.value?.[key] === true,
    set: (v) => {
      if (selectedCategory.value) selectedCategory.value[key] = v
    },
  })
}

function priceOf(key: 'currencyExtraDriverPrice' | 'currencyBabySeatPrice' | 'currencyWashPrice') {
  return computed<string>(() => selectedCategory.value?.[key] ?? '')
}

const options = [
  {
    key: 'driver',
    label: 'Conductor adicional',
    hint: 'Autoriza a otra persona a conducir con cobertura del seguro.',
    model: flagModel('withExtraDriver'),
    price: priceOf('currencyExtraDriverPrice'),
  },
  {
    key: 'baby-seat',
    label: 'Silla para bebé',
    hint: 'Silla homologada, sujeta a disponibilidad de la sede.',
    model: flagModel('withBabySeat'),
    price: priceOf('currencyBabySeatPrice'),
  },
  {
    key: 'wash',
    label: 'Lavado del vehículo',
    hint: 'Entrega el auto limpio al devolverlo, sin preocuparte.',
    model: flagModel('withWash'),
    price: priceOf('currencyWashPrice'),
  },
]
</script>
