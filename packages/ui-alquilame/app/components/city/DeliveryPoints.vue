<template>
  <!--
    F2 step 4 — #puntos-entrega restyle (issue #112, SCEN-F2-04).

    Restyle of the design's #puntos-entrega to a light card-stack: red accent
    bar, font-heading h2 + subtitle, one card per REAL branch. Bound to the
    live cityBranches (BranchData[]) — only `name` and the optional `schedule`
    exist on our data, so the design's per-card photo / external reserve link
    are intentionally dropped (no fabricated images or URLs). The section only
    renders when there are branches (length guard preserved from CityPage).

    Styling lessons carried from F0/F1:
      - the v4 bg-linear utility for gradients, never the deprecated v3 alias
        (with custom @theme tokens the v3 alias renders background-image:none).
      - .heading-* utilities (Plus Jakarta) on the section/card titles.
      - light section → no forced white-heading context override.
      - CLS-safe: no images, no client-only state, fixed-size pin/icon boxes.
  -->
  <section
    v-if="cityBranches.length > 0"
    id="puntos-entrega"
    class="relative overflow-hidden bg-[#EDF0F5] py-12 md:py-16 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <!-- Header: red accent bar + heading + subtitle -->
      <div class="mb-8">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-4" aria-hidden="true" />
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          Sedes en {{ city?.name }}
        </h2>
        <p class="mt-3 text-base md:text-lg text-gray-600 max-w-2xl">
          {{ cityBranches.length }}
          {{ cityBranches.length === 1 ? 'punto físico de entrega' : 'puntos físicos de entrega' }}
          en la ciudad. Elige el que te quede más cómodo.
        </p>
      </div>

      <!-- Branch cards, two per row on desktop. Stacked in a single column each
           card spanned the whole 1280px container, which made this section read
           far wider than every other card block on the page. -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="branch in cityBranches"
          :key="branch.code"
          class="group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] transition-all duration-200 p-[3px] sm:p-4"
        >
          <div class="flex-1 min-w-0 flex flex-col justify-center gap-2.5 py-1">
            <div class="flex items-start gap-3">
              <!-- Red gradient location pin -->
              <span
                class="shrink-0 w-9 h-9 rounded-full bg-linear-to-br from-[#FF294D] to-[#CB032C] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(216,23,58,0.30)]"
                aria-hidden="true"
              >
                <LocationIcon cls="size-4" />
              </span>
              <h3 class="font-heading text-xl font-bold text-gray-900 leading-snug pt-0.5">
                {{ branch.name }}
              </h3>
            </div>

            <!-- Schedule chip (real data, optional) -->
            <div v-if="branch.schedule?.display" class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-red-600/40 bg-white text-red-600 text-xs sm:text-sm font-semibold px-3 py-1.5"
              >
                <ClockIcon cls="size-3.5 shrink-0" />
                <span>{{ branch.schedule.display }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust strip -->
      <div
        class="grid grid-cols-1 sm:grid-cols-3 mt-10 sm:mt-12 pt-8 border-t border-gray-900/[0.08]"
      >
        <div class="flex flex-row items-start gap-3.5 sm:flex-col sm:gap-2 sm:pr-6">
          <svg
            class="shrink-0 size-6 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div class="sm:contents">
            <p class="font-heading font-bold text-sm text-gray-900">Seguridad y confianza</p>
            <p class="text-[13px] text-gray-500 leading-snug">
              Protocolos de bioseguridad en todos nuestros puntos.
            </p>
          </div>
        </div>
        <div
          class="flex flex-row items-start gap-3.5 sm:flex-col sm:gap-2 sm:px-6 sm:border-l sm:border-gray-900/[0.08] pt-5 mt-5 border-t border-gray-900/[0.08] sm:pt-0 sm:mt-0 sm:border-t-0"
        >
          <ClockIcon cls="shrink-0 size-6 text-red-600" />
          <div class="sm:contents">
            <p class="font-heading font-bold text-sm text-gray-900">Entregas rápidas</p>
            <p class="text-[13px] text-gray-500 leading-snug">
              Proceso ágil para que empieces tu viaje.
            </p>
          </div>
        </div>
        <div
          class="flex flex-row items-start gap-3.5 sm:flex-col sm:gap-2 sm:px-6 sm:border-l sm:border-gray-900/[0.08] pt-5 mt-5 border-t border-gray-900/[0.08] sm:pt-0 sm:mt-0 sm:border-t-0"
        >
          <svg
            class="shrink-0 size-6 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <div class="sm:contents">
            <p class="font-heading font-bold text-sm text-gray-900">Soporte 24/7</p>
            <p class="text-[13px] text-gray-500 leading-snug">
              Estamos contigo en cada paso del alquiler.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type { City, BranchData } from '@rentacar-main/logic/utils'

/** imports */
import {
  IconsLocationIcon as LocationIcon,
  IconsClockIcon as ClockIcon,
} from '#components'

/** props */
defineProps<{
  cityBranches: BranchData[]
  city?: City
}>()
</script>
