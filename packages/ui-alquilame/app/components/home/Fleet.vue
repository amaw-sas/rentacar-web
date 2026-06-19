<template>
  <!--
    Fleet — golden parity rebuild of the design's #fleet grid (6 cards + a
    Diario·Mensualidad toggle + brand-red CTA), driven by REAL data.

    The 6 cards mirror the golden exactly (copy/specs/structure). Each maps to a
    real category CODE that carries active pricing in category_pricing:
      C  → Compacto · Manual            FX → Sedán · Automática
      F  → Sedán · Manual               GC → Camioneta · Automática
      G4 → Camioneta · Manual           LE → Camioneta Premium · Automática

    Prices are REAL, never the mockup's hardcoded figures:
      - Diario: pickRepresentativeDailyPrice over month_prices (cheapest active
        positive one_day_price — the same source the city landing / checkout use).
      - Mensualidad: cheapest active positive 1k_kms (the monthly 1.000 km plan).
    Fail-soft: a category with no active positive row shows NO price block —
    never "$0" nor a fabricated value.

    Fidelity note: the golden's "Consultar disponibilidad" CTA points at an
    external site; here it drives our internal engine instead — the modal ->
    SelectBranch (variant="gray") -> "Ver disponibilidad" flow ported untouched
    from the legacy #categorias, data-testids preserved. Button is brand red
    (#CC022B = bg-brand-600), per the brand spec — the golden's bg-red-600 was a
    placeholder.

    Gradient on the image frame uses the v4 bg-linear-to-* utility: with custom
    @theme tokens the v3 alias renders background-image:none (F0 lesson).
  -->
  <section id="fleet" class="bg-white text-black py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Heading -->
      <div class="text-center mb-12">
        <div class="h-1 w-10 rounded-full bg-brand-600 mb-4 mx-auto" />
        <h2 class="text-3xl md:text-4xl font-extrabold font-heading text-gray-900">
          Nuestra Flota
        </h2>
        <p class="mt-3 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Reserva con anticipación y obtén mejores precios — el precio final varía
          según la temporada y los días de renta.
        </p>

        <!-- Toggle Diario / Mensualidad -->
        <div class="mt-8 inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
          <button
            type="button"
            data-testid="fleet-tab-daily-test"
            class="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            :class="plan === 'daily' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:text-gray-900'"
            :aria-pressed="plan === 'daily'"
            @click="plan = 'daily'"
          >
            Alquiler Diario
          </button>
          <button
            type="button"
            data-testid="fleet-tab-monthly-test"
            class="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            :class="plan === 'monthly' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:text-gray-900'"
            :aria-pressed="plan === 'monthly'"
            @click="plan = 'monthly'"
          >
            Mensualidad
          </button>
        </div>
      </div>

      <!-- Grid: 6 golden cards with real prices -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="card in cards"
          :key="card.code"
          class="bg-[#F4F5F9] rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-gray-200 group flex flex-col"
        >
          <!-- Vehicle image (full-bleed top); aspect-ratio reserves space (CLS) -->
          <div class="aspect-[16/10] bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
            <img
              :src="card.image"
              :alt="card.alt"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            >
          </div>

          <!-- Content -->
          <div class="p-6 flex flex-col flex-1">
            <!-- Category + transmission -->
            <h3 class="text-lg font-bold font-heading text-gray-900 mb-2">
              {{ card.title }}
              <span class="text-sm font-normal text-gray-500"> · {{ card.transmission }}</span>
            </h3>
            <p class="text-sm text-gray-600 mb-2">Ej: {{ card.example }} o similar</p>
            <p class="text-sm text-gray-500 mb-4 leading-snug">{{ card.description }}</p>

            <!-- Price: real; omitted (fail-soft) when undefined -->
            <div class="mb-4 min-h-[2.5rem]">
              <p
                v-if="plan === 'daily' && card.dailyPrice !== undefined"
                class="flex items-baseline gap-2 flex-wrap"
              >
                <span class="text-sm text-gray-500">Desde</span>
                <span class="text-2xl font-extrabold font-heading text-brand-600">${{ moneyFormat(card.dailyPrice) }}/día</span>
                <span class="text-xs text-gray-400">+ IVA</span>
              </p>
              <p
                v-else-if="plan === 'monthly' && card.monthlyPrice !== undefined"
                class="flex items-baseline gap-2 flex-wrap"
              >
                <span class="text-sm text-gray-500">Desde</span>
                <span class="text-2xl font-extrabold font-heading text-brand-600">${{ moneyFormat(card.monthlyPrice) }}/mes</span>
                <span class="text-xs font-medium text-emerald-600">IVA incluido</span>
              </p>
            </div>

            <!-- Specs -->
            <div class="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
              <span class="flex items-center gap-1.5" :title="`${card.passengers} pasajeros`">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                {{ card.passengers }}
              </span>
              <span class="flex items-center gap-1.5" :title="`${card.luggage} maletas`">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h0" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                {{ card.luggage }}
                <span class="text-gray-500"> · {{ plan === 'daily' ? 'Kilometraje ilimitado' : '1.000 km/mes incluidos' }}</span>
              </span>
            </div>

            <!-- CTA: drives the internal engine (modal -> SelectBranch) -->
            <!-- hydrate-on-visible (not -interaction): on touch the first tap is
                 consumed by interaction-hydration and never opens the modal.
                 rootMargin pre-hydrates ~200px early so the island is interactive
                 before the thumb arrives on slow devices. -->
            <LazyUModal
              :hydrate-on-visible="{ rootMargin: '200px' }"
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
              <UButton class="block w-full text-center py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase transition-colors">
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
import { computed, ref } from 'vue'

// utils
import { pickRepresentativeDailyPrice } from '@rentacar-main/logic/utils'
import type { CategoryMonthPriceData } from '@rentacar-main/logic/utils'

type Plan = 'daily' | 'monthly'

const plan = ref<Plan>('daily')

// The 6 golden cards, each mapped to a real category code. Copy (title /
// transmission / example / description / passengers / luggage) mirrors the
// golden 02-fleet.html exactly. Images reuse the existing JPG assets under
// public/images/vehicles/, picked to match each category visually.
const CATEGORIES: {
  code: string
  title: string
  transmission: string
  example: string
  description: string
  passengers: number
  luggage: number
  image: string
  alt: string
}[] = [
  {
    code: 'C',
    title: 'Compacto',
    transmission: 'Manual',
    example: 'Kia Picanto / Suzuki S-Presso',
    description: 'Ágil en el tráfico y fácil de parquear. Perfecto para moverte por la ciudad.',
    passengers: 5,
    luggage: 2,
    image: '/images/vehicles/economico.jpg',
    alt: 'Compacto — Kia Picanto / Suzuki S-Presso',
  },
  {
    code: 'F',
    title: 'Sedán',
    transmission: 'Manual',
    example: 'Renault Logan / Suzuki Swift Dzire',
    description: 'Más baúl y espacio para viajar en familia sin gastar de más.',
    passengers: 5,
    luggage: 3,
    image: '/images/vehicles/sedan.jpg',
    alt: 'Sedán — Renault Logan / Suzuki Swift Dzire',
  },
  {
    code: 'FX',
    title: 'Sedán',
    transmission: 'Automática',
    example: 'Hyundai Accent AT / Kia Rio AT',
    description: 'Manejo cómodo en el trancón, sin estar pendiente del embrague.',
    passengers: 5,
    luggage: 3,
    image: '/images/vehicles/sedan-automatico.jpg',
    alt: 'Sedán — Hyundai Accent AT / Kia Rio AT',
  },
  {
    code: 'G4',
    title: 'Camioneta',
    transmission: 'Manual',
    example: 'Hyundai Creta / Suzuki Vitara',
    description: 'Posición alta y buen baúl para carretera y salidas fuera de la ciudad.',
    passengers: 5,
    luggage: 4,
    image: '/images/vehicles/camioneta.jpg',
    alt: 'Camioneta — Hyundai Creta / Suzuki Vitara',
  },
  {
    code: 'GC',
    title: 'Camioneta',
    transmission: 'Automática',
    example: 'Renault Koleos / Kia Sportage',
    description: 'Confort y potencia de sobra para viajes largos por cualquier vía.',
    passengers: 5,
    luggage: 5,
    image: '/images/vehicles/camioneta-full.jpg',
    alt: 'Camioneta — Renault Koleos / Kia Sportage',
  },
  {
    code: 'LE',
    title: 'Camioneta Premium',
    transmission: 'Automática',
    example: 'Hyundai Santa Fe',
    description: 'Máximo confort e imagen para viajes de trabajo y ocasiones especiales.',
    passengers: 5,
    luggage: 4,
    image: '/images/vehicles/premium.jpg',
    alt: 'Camioneta Premium — Hyundai Santa Fe',
  },
]

/**
 * Cheapest positive active monthly (1.000 km plan) rate. Mirrors
 * pickRepresentativeDailyPrice's selection rule, but on `1k_kms` — the monthly
 * "Desde $X/mes" floor. Returns undefined when no active row carries a positive
 * monthly price, so the card omits the block (never $0 / fabricated).
 */
function pickRepresentativeMonthlyPrice(prices: CategoryMonthPriceData[]): number | undefined {
  return prices
    .filter((p) => p.status === 'active' && p['1k_kms'] > 0)
    .sort((a, b) => {
      const delta = a['1k_kms'] - b['1k_kms']
      if (delta !== 0) return delta
      // tie-break: most recent init_date wins, mirroring pickRepresentativeDailyPrice
      return b.init_date.localeCompare(a.init_date)
    })[0]?.['1k_kms']
}

const { categories } = useFetchRentacarData()
const { moneyFormat } = useMoneyFormat()

// Prices are global per category code (not per-city): work on the home with no
// city. undefined => that card's price block is hidden (never $0 / fabricated).
const cards = computed(() =>
  CATEGORIES.map((category) => {
    const monthPrices = categories.find((c) => c.id === category.code)?.month_prices ?? []
    return {
      ...category,
      dailyPrice: pickRepresentativeDailyPrice(monthPrices)?.one_day_price,
      monthlyPrice: pickRepresentativeMonthlyPrice(monthPrices),
    }
  }),
)
</script>
