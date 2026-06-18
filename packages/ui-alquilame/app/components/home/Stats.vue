<template>
  <!--
    F1 stats band — new presentational section ported from the design's stats
    strip (Vehículos / Ciudades / Años · "desde 2015").

    EXCEPTION (named in the F1 design): this band has NO real data source, so it
    is the one section allowed to carry the design's marketing copy verbatim —
    including "desde 2015". Counts are rendered as static values (no client-side
    counter animation) to stay CLS-safe and SSR/ISR-deterministic.

    Headings adopt the project `.heading-*` utilities (→ Plus Jakarta).
  -->
  <section class="bg-white py-12 md:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="grid grid-cols-1 items-center gap-y-8 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-y-0"
      >
        <template v-for="(stat, index) in stats" :key="stat.label">
          <div class="flex flex-1 flex-col items-center px-4 text-center">
            <svg
              class="h-6 w-6 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="stat.icon"
            />
            <span
              class="mt-3 inline-flex items-center rounded-full border border-red-200 bg-red-50/60 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600"
            >
              {{ stat.badge }}
            </span>
            <div
              class="font-heading mt-3 text-5xl font-extrabold leading-none text-gray-900 md:text-6xl"
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
            <p class="mt-1 max-w-[210px] text-xs leading-snug text-gray-500">
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
  badge: string
  value: string
  label: string
  detail: string
  // Inner SVG markup (paths/shapes) for the stat icon.
  icon: string
}

// Marketing copy ported verbatim from the design's stats band — the named
// "datos reales" exception (no data source backs these figures).
const stats: Stat[] = [
  {
    badge: 'Flota disponible',
    value: '6.000+',
    label: 'Vehículos disponibles',
    detail: 'Compactos, sedanes, camionetas y SUVs.',
    icon: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  },
  {
    badge: 'Ciudades',
    value: '19',
    label: 'Ciudades en Colombia',
    detail: 'Bogotá, Medellín, Cali, Cartagena y más.',
    icon: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  },
  {
    badge: 'Experiencia',
    value: '10',
    label: 'Años de experiencia',
    detail: 'Operación constante desde 2015.',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  },
]
</script>
