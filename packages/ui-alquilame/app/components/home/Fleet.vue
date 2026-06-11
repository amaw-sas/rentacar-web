<template>
  <!--
    F1 fleet — rebuild of the design's #fleet grid. The 6-card / Diario·Mensual
    toggle of the mockup is scoped down to the 4 REAL representative categories
    (C/FX/GC/LE), daily-only: the "Desde $X/día" already IS the daily rate of the
    monthly plan, so the toggle is out of F1 (design doc §mapeo).

    Price is REAL, not the mockup's hardcoded figures: pickRepresentativeDailyPrice
    over the category's month_prices (the same global-per-category source the city
    landing uses, #68). Fail-soft: a category with no active positive row shows NO
    price block — never "$0" nor a fabricated value.

    Fidelity principle (F1): the mockup's "Consultar disponibilidad" CTA points at
    an external reservation site; here it drives our internal engine instead — the
    modal -> SelectBranch (variant="gray") -> "Ver disponibilidad" (green) flow
    ported untouched from the legacy #categorias, data-testids preserved.

    Gradient on the image frame uses the v4 bg-linear-to-* utility: with custom
    @theme tokens the v3 alias renders background-image:none (F0 lesson).
  -->
  <section id="fleet" class="bg-white text-black py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Heading -->
      <div class="text-center mb-12">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto" />
        <h2 class="heading-section text-3xl md:text-4xl font-extrabold text-gray-900">
          Nuestra Flota
        </h2>
        <p class="mt-3 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Reserva con anticipación y obtén mejores precios — el precio final varía
          según la temporada y los días de renta.
        </p>
      </div>

      <!-- Grid: 4 representative categories with real "Desde $X/día" -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="card in cards"
          :key="card.code"
          class="bg-[#F4F5F9] rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-gray-200 group flex flex-col"
        >
          <!-- Vehicle image (full-bleed top); aspect-ratio reserves space (CLS) -->
          <div class="aspect-[16/10] bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
            <component
              :is="card.image"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <!-- Content -->
          <div class="p-6 flex flex-col flex-1">
            <h3 class="heading-card text-lg font-bold text-gray-900 mb-2">
              {{ card.title }}
            </h3>
            <p class="text-sm text-gray-500 mb-4 leading-snug">
              {{ card.description }}
            </p>

            <!-- Price: real "Desde $X/día"; omitted (fail-soft) when undefined -->
            <div class="mb-4 min-h-[2.5rem]">
              <p
                v-if="card.dailyPrice !== undefined"
                class="flex items-baseline gap-2 flex-wrap"
              >
                <span class="text-sm text-gray-500">Desde</span>
                <span class="heading-card text-2xl font-extrabold text-red-600">
                  ${{ moneyFormat(card.dailyPrice) }}/día
                </span>
              </p>
            </div>

            <!-- CTA: drives the internal engine (modal -> SelectBranch) -->
            <LazyUModal
              hydrate-on-interaction
              class="mt-auto"
              :ui="{ content: 'bg-white', close: 'bg-black text-white rounded-full' }"
            >
              <template #body>
                <div class="mb-4 text-black text-lg">
                  ¿En que ciudad<br>deseas recoger tu carro?
                </div>
                <div class="min-w-80 my-3">
                  <SelectBranch variant="gray" />
                </div>
              </template>
              <UButton class="block w-full text-center py-3 rounded-full bg-green-700 hover:bg-green-800 text-white font-bold uppercase transition-colors">
                Ver disponibilidad
              </UButton>
            </LazyUModal>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// External
import { computed, type Component } from 'vue'

// components
import {
  ImagesCategoriasCompacto as Compacto,
  ImagesCategoriasSedan as Sedan,
  ImagesCategoriasSUV as SUV,
} from '#components'

// utils
import { pickRepresentativeDailyPrice } from '@rentacar-main/logic/utils'

// Curated representative categories. F1 isolation: useCityProductSchema's
// `representativeCategories` is private to logic, so the list is duplicated here
// (declared debt). Codes/names mirror it: C, FX, GC, LE. Images reuse the
// existing ImagesCategorias/* assets — LE (Premium) reuses the SUV image, the
// closest available asset (no dedicated Premium image exists yet).
const CATEGORIES: { code: string; title: string; description: string; image: Component }[] = [
  {
    code: 'C',
    title: 'Económico',
    description: 'Ágil en el tráfico y fácil de parquear. Perfecto para moverte por la ciudad.',
    image: Compacto,
  },
  {
    code: 'FX',
    title: 'Sedán Automático',
    description: 'Manejo cómodo en el trancón, sin estar pendiente del embrague.',
    image: Sedan,
  },
  {
    code: 'GC',
    title: 'Camioneta SUV',
    description: 'Posición alta y buen baúl para carretera y salidas fuera de la ciudad.',
    image: SUV,
  },
  {
    code: 'LE',
    title: 'Camioneta Premium',
    description: 'Máximo confort e imagen para viajes de trabajo y ocasiones especiales.',
    image: SUV,
  },
]

const { categories } = useFetchRentacarData()
const { moneyFormat } = useMoneyFormat()

// Price is global per category code (not per-city): works on the home with no
// city. undefined => the card's price block is hidden (never $0 / fabricated).
const cards = computed(() =>
  CATEGORIES.map((category) => {
    const monthPrices = categories.find((c) => c.id === category.code)?.month_prices ?? []
    const priceRow = pickRepresentativeDailyPrice(monthPrices)
    return {
      ...category,
      dailyPrice: priceRow?.one_day_price,
    }
  }),
)
</script>
