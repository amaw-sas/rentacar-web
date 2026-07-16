<template>
  <!--
    Tile de segmento (Paso 2 nivel 1, SCEN-W-03). Presentación pura: recibe el
    segmento, cuántos vehículos disponibles agrupa y el "desde $X" del más barato,
    y emite `select` al pulsarlo. No conoce disponibilidad ni stores.

    AA: cuando está activo el relleno es naranja de marca con texto oscuro
    (text-gray-900) — regla transversal F0/F3 (blanco sobre naranja falla).
  -->
  <button
    type="button"
    class="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors"
    :class="
      active
        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600'
        : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
    "
    :aria-pressed="active"
    :data-testid="`wizard-segment-${segment.id}-test`"
    @click="$emit('select')"
  >
    <span
      class="flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors"
      :class="active ? 'bg-brand-600 text-gray-900' : 'bg-surface-soft text-brand-700 group-hover:bg-brand-100'"
    >
      <UIcon :name="segment.icon" class="size-6" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block heading-sub text-gray-900">{{ segment.label }}</span>
      <span class="block body-sm text-gray-500">
        {{ count }} {{ count === 1 ? 'vehículo' : 'vehículos' }}
      </span>
    </span>
    <span class="shrink-0 text-right">
      <span class="block body-xs text-gray-600">desde</span>
      <span class="block price-md font-heading text-brand-700">$ {{ fromPrice }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
// Types
import type { VehicleSegment } from '~/config/vehicleSegments'

defineProps<{
  /** Segmento a mostrar (label + icono). */
  segment: VehicleSegment
  /** Cuántos vehículos disponibles caen en este segmento. */
  count: number
  /** Precio "desde" ya formateado (más barato del segmento). */
  fromPrice: string
  /** ¿Es el segmento abierto/seleccionado ahora? */
  active?: boolean
}>()

defineEmits<{ (e: 'select'): void }>()
</script>
