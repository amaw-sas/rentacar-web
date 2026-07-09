<template>
  <!--
    Barra de pasos del wizard. Cada paso ALCANZADO (≤ maxReachedStep) es clicable
    para volver a editarlo sin perder el avance (SCEN-W-10). El paso activo usa
    relleno naranja de marca con TEXTO OSCURO (regla AA F0: blanco sobre #ef9600
    falla). Los pasos futuros quedan inertes.
  -->
  <nav aria-label="Progreso de la reserva" class="w-full">
    <!-- Desktop: pills numeradas con etiqueta + conectores -->
    <ol class="hidden md:flex items-center justify-center gap-1">
      <li
        v-for="(label, i) in STEP_LABELS"
        :key="label"
        class="flex items-center"
      >
        <button
          type="button"
          :disabled="!isReached(i + 1)"
          :aria-current="current === i + 1 ? 'step' : undefined"
          :data-testid="`wizard-step-${i + 1}-test`"
          :class="pillClass(i + 1)"
          class="group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/50 disabled:cursor-default"
          @click="onSelect(i + 1)"
        >
          <span
            :class="badgeClass(i + 1)"
            class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          >
            <UIcon v-if="isDone(i + 1)" name="i-lucide-check" class="h-3 w-3" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          {{ label }}
        </button>
        <span
          v-if="i < STEP_LABELS.length - 1"
          aria-hidden="true"
          :class="isDone(i + 1) ? 'bg-brand-300' : 'bg-gray-200'"
          class="mx-1 h-px w-6 lg:w-10 transition-colors"
        />
      </li>
    </ol>

    <!-- Mobile: "Atrás" + contador + puntos de progreso NAVEGABLES. Los puntos son
         botones (área de tap ampliada), no <li> inertes: en móvil las pills desktop
         están ocultas, así que sin esto no habría forma de volver a un paso ya
         alcanzado (SCEN-W-10). -->
    <div class="md:hidden">
      <div class="flex items-center justify-between gap-3">
        <button
          v-if="current > 1"
          type="button"
          class="-ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 body-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/50"
          @click="onSelect(current - 1)"
        >
          <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
          Atrás
        </button>
        <span v-else class="body-sm font-semibold text-gray-900">
          Paso {{ current }} de {{ STEP_LABELS.length }}
        </span>
        <span class="body-sm font-semibold text-brand-700 truncate">
          {{ current }}/{{ STEP_LABELS.length }} · {{ STEP_LABELS[current - 1] }}
        </span>
      </div>
      <ol class="mt-2 flex items-center gap-1.5">
        <li v-for="(label, i) in STEP_LABELS" :key="label" class="flex-1">
          <button
            type="button"
            :disabled="!isReached(i + 1)"
            :aria-current="current === i + 1 ? 'step' : undefined"
            :aria-label="`Ir al paso ${i + 1}: ${label}`"
            class="block w-full cursor-pointer py-2 -my-1 focus:outline-none disabled:cursor-default"
            @click="onSelect(i + 1)"
          >
            <span
              class="block h-1.5 rounded-full transition-colors"
              :class="i + 1 <= current ? 'bg-brand-600' : i + 1 <= maxReached ? 'bg-brand-200' : 'bg-gray-200'"
            />
          </button>
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup lang="ts">
// External
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  /** Número del paso activo (1..5). */
  current: number
  /** Paso más avanzado alcanzado (1..5). */
  maxReached: number
}>()

const emit = defineEmits<{ (e: 'goTo', step: number): void }>()

const { haveMonthlyReservation } = storeToRefs(useStoreReservationForm())

// En mensual el Paso 3 decide cobertura Y plan de kilometraje; el label lo nombra
// para que el usuario no crea que solo elige seguro.
const STEP_LABELS = computed(() => [
  'Búsqueda',
  'Vehículo',
  haveMonthlyReservation.value ? 'Seguro y km' : 'Seguro',
  'Adicionales',
  'Datos',
])

function isReached(step: number): boolean {
  return step <= props.maxReached
}
function isDone(step: number): boolean {
  return step < props.current
}
function onSelect(step: number): void {
  // Emite para cualquier paso ALCANZADO, incluido el actual: el shell decide qué
  // hacer (p.ej. en Paso 1 con búsqueda hecha, clic en "Búsqueda" avanza a Paso 2).
  // goTo(pasoActual) es idempotente en la máquina para el resto de casos.
  if (isReached(step)) emit('goTo', step)
}

function pillClass(step: number): string {
  if (step === props.current) return 'bg-brand-600 text-gray-900 shadow-sm'
  if (isReached(step)) return 'bg-brand-50 text-brand-800 hover:bg-brand-100'
  return 'text-gray-400'
}
function badgeClass(step: number): string {
  if (step === props.current) return 'bg-gray-900 text-white'
  if (isReached(step)) return 'bg-brand-200 text-brand-800'
  return 'bg-gray-100 text-gray-400'
}
</script>
