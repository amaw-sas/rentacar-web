<template>
  <!--
    F1 stats band — new presentational section ported from the design's stats
    strip (Vehículos / Ciudades / Años · "desde 2015").

    The "Ciudades" figure is the one real datum here: it derives from the live
    active-city count (useCityCount). The "Vehículos" and "Años" figures keep
    the design's marketing copy verbatim — the named "datos reales" exception
    (no data source backs those two), including "desde 2015". All counts render
    as plain values (no counter animation): the derived count is read from the
    SSR-hydrated state at setup, so it stays CLS-safe and SSR/ISR-deterministic.

    Headings adopt the project `.heading-*` utilities (→ Plus Jakarta).
  -->
  <section class="bg-white py-12 md:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="grid grid-cols-1 items-center gap-y-8 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-y-0"
      >
        <template v-for="(stat, index) in stats" :key="stat.label">
          <div class="flex flex-1 flex-col items-center px-4 text-center">
            <!--
              La cifra va sola: el ícono y la píldora de categoría se retiraron
              porque repetían la etiqueta de abajo ("FLOTA DISPONIBLE" sobre
              "Vehículos disponibles") y le robaban peso al dato.

              No es un encabezado a propósito: es un dato, no un título. Como h2
              entraría al índice del documento y ensuciaría la estructura.
            -->
            <div
              class="font-heading text-4xl font-extrabold leading-none text-gray-900 md:text-5xl"
            >
              {{ stat.value }}
            </div>
            <span
              class="mt-3 block h-0.5 w-8 rounded-full bg-red-500"
              aria-hidden="true"
            />
            <p class="mt-3 text-sm font-bold text-gray-900">
              {{ stat.label }}
            </p>
            <p class="mt-1 max-w-[210px] body-sm">
              {{ stat.detail }}
            </p>
          </div>

          <!-- Dot separator between stats (desktop only) -->
          <span
            v-if="index < stats.length - 1"
            class="mx-auto hidden h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 sm:block"
            aria-hidden="true"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Stat {
  value: string
  label: string
  detail: string
}

const cityCount = useCityCount()

// computed so the "Ciudades" value follows cityCount (see component header).
const stats = computed<Stat[]>(() => [
  {
    value: '6.000+',
    label: 'Vehículos disponibles',
    detail: 'Compactos, sedanes, camionetas y SUVs.',
  },
  {
    value: String(cityCount.value),
    label: 'Ciudades en Colombia',
    detail: 'Bogotá, Medellín, Cali, Cartagena y más.',
  },
  {
    value: '10',
    label: 'Años de experiencia',
    detail: 'Operación constante desde 2015.',
  },
])
</script>
