<template>
  <!--
    Fleet — golden parity rebuild of the design's #fleet grid (6 cards + a
    Diario·Mensualidad toggle + brand CTA), driven by REAL data.

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

    This component is the orchestrator: real-data resolution (prices fail-soft)
    + the Diario/Mensualidad toggle + the grid. Card presentation (badge, title,
    price, spec chips, CTA -> modal -> SelectBranch flow) lives in HomeFleetCard.
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

      <!-- Grid: 6 golden cards with real prices; presentación en FleetCard -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HomeFleetCard
          v-for="card in cards"
          :key="card.code"
          :card="card"
          :plan="plan"
        />
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
