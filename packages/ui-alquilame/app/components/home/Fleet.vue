<template>
  <!--
    Fleet — golden parity rebuild of the design's #fleet grid (6 cards + a
    Diario·Mensualidad toggle + brand-red CTA), driven by REAL data.

    The 6 cards mirror the golden exactly (copy/specs/structure). Each maps to a
    real category CODE that carries active pricing in category_pricing:
      C  → Compacto · Mecánica          FX → Sedán · Automática
      F  → Sedán · Mecánica             GC → Camioneta · Automática
      G4 → Camioneta · Mecánica         LE → Camioneta Premium · Automática

    Prices are REAL, never the mockup's hardcoded figures:
      - Diario: lowSeasonDailyFrom30 over month_prices — the low-season 1.000 km
        MONTHLY rate prorated over a 30-day rental (round(monthly / 30)).
      - Mensualidad: lowSeasonMonthly1k — that same low-season 1.000 km monthly floor.
    Fail-soft: a category with no active positive row shows NO price block —
    never "$0" nor a fabricated value.

    CTA note: the golden's "Consultar disponibilidad" CTA points at an external
    site; here the "Cotizar mis fechas" CTA redirects to /reservas instead. On a city page
    it preselects a branch of that city (searchBranchByCity) by seeding the
    reservation-form store before navigating, so /reservas opens with the pickup
    ready WITHOUT running a search; on the home (no city) it goes to a clean
    /reservas. Button is brand red (#CC022B = bg-brand-600), per the brand spec —
    the golden's bg-red-600 was a placeholder.

    Gradient on the image frame uses the v4 bg-linear-to-* utility: with custom
    @theme tokens the v3 alias renders background-image:none (F0 lesson).
  -->
  <!-- Soft tint (surface-soft) instead of white: the cards read as panels laid
       ON a surface rather than boxes drawn on the page. Pairs with the white
       card frame below — the contrast between the two is what makes the frame
       visible at all. -->
  <section id="fleet" class="bg-surface-soft text-black py-12 md:py-20 px-4 sm:px-6 lg:px-8">
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
          class="bg-surface-softest rounded-[22px] overflow-hidden border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 group flex flex-col"
        >
          <!-- Vehicle image via @nuxt/image (issue 322 SCEN-322-P02 — no raw JPEG). -->
          <div class="aspect-[16/10] bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
            <NuxtImg
              :src="card.image"
              :alt="card.alt"
              width="640"
              height="400"
              format="webp"
              sizes="sm:100vw md:50vw lg:33vw"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <!-- Content

               Type system (kept deliberately small — the card used to mix 5
               weights, 2 grays and 4 sizes, which read as noise):
                 · sizes  → text-2xl (price) / text-lg (title) / text-sm (body,
                            specs) / text-xs (meta labels). Nothing else.
                 · weights→ bold (title, price, CTA) / medium (labels: "IVA
                            incluido", "Temporada Baja") / normal (everything
                            else). No extrabold, no semibold.
                 · colors → gray-900 (title) / gray-600 (ALL support copy —
                            gray-500 is gone) / brand-600 (price) /
                            emerald-600 (the single accent, "IVA incluido").
          -->
          <div class="p-6 flex flex-col flex-1">
            <!-- Category + transmission -->
            <h3 class="text-lg font-bold font-heading text-gray-900 mb-2">
              {{ card.title }}
              <span class="text-sm font-normal text-gray-600"> · {{ card.transmission }}</span>
            </h3>
            <p class="text-sm text-gray-600 mb-2">Ej: {{ card.example }} o similar</p>
            <p class="text-sm text-gray-600 mb-4 leading-snug">{{ card.description }}</p>

            <!-- Price: real; omitted (fail-soft) when undefined -->
            <div class="mb-4 min-h-[3.5rem]">
              <!-- Diario: low-season 1.000 km monthly rate prorated over 30 days -->
              <div v-if="plan === 'daily' && card.dailyPrice !== undefined" class="leading-tight">
                <p class="text-xs text-gray-600">Precio x día en alquiler de 30 días</p>
                <p class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-2xl font-bold font-heading text-brand-600">${{ moneyFormat(card.dailyPrice) }}</span>
                  <span class="text-xs font-medium text-emerald-600">IVA incluido</span>
                </p>
                <p class="text-xs font-medium text-gray-600">Temporada Baja</p>
              </div>
              <p
                v-else-if="plan === 'monthly' && card.monthlyPrice !== undefined"
                class="flex items-baseline gap-2 flex-wrap"
              >
                <span class="text-sm text-gray-600">Desde</span>
                <span class="text-2xl font-bold font-heading text-brand-600">${{ moneyFormat(card.monthlyPrice) }}/mes</span>
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
                <span> · 1.000 km/mes incluidos</span>
              </span>
            </div>

            <!-- CTA: redirige a /reservas. En una city page preselecciona una
                 sucursal de esa ciudad (searchBranchByCity) sembrando el store
                 antes de navegar, así /reservas abre con la recogida lista SIN
                 disparar búsqueda. En el home no hay ciudad → /reservas limpio.

                 El precio Diario es una tarifa de 30 días; 1-29 días se cotizan
                 con precio por día distinto → la nota (solo en Diario) lo aclara
                 y el CTA invita a cotizar cualquier duración. -->
            <div class="mt-auto">
              <p v-if="plan === 'daily'" class="text-xs text-gray-600 mb-3 leading-snug">
                ¿Menos días? El precio por día cambia — cotiza tus fechas.
              </p>
              <UButton
                class="block w-full text-center py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
                @click="goToReservas"
              >
                Cotizar mis fechas
              </UButton>
            </div>
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
import { lowSeasonMonthly1k, lowSeasonDailyFrom30 } from '@rentacar-main/logic/utils'

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
    transmission: 'Mecánica',
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
    transmission: 'Mecánica',
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
    transmission: 'Mecánica',
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

const { categories } = useFetchRentacarData()
const { moneyFormat } = useMoneyFormat()

// CTA → /reservas. On a city page, preselect a branch of that city (reusing the
// shared searchBranchByCity helper) by seeding the reservation-form store before
// navigating; the Searcher on /reservas reads lugarRecogida from the store. No
// query params are passed, so no auto-search runs and /reservas stays clean and
// indexable (a `?lugar_recogida` would trip the page's noindex/results gate).
const route = useRoute()
const storeAdminData = useStoreAdminData()
const storeReservationForm = useStoreReservationForm()

function goToReservas() {
  const city = route.params.city
  const branch = city ? storeAdminData.searchBranchByCity(city) : undefined
  if (branch) {
    storeReservationForm.lugarRecogida = branch.code
    storeReservationForm.lugarDevolucion = branch.code
  }
  return navigateTo('/reservas')
}

// Prices are global per category code (not per-city): work on the home with no
// city. undefined => that card's price block is hidden (never $0 / fabricated).
//
// "Alquiler Diario" is NOT the standalone one_day_price column: it is the
// low-season 1.000 km MONTHLY rate prorated over a 30-day rental
// (lowSeasonDailyFrom30 = round(lowSeasonMonthly1k / 30)). "Mensualidad" shows
// that same low-season 1.000 km monthly floor.
const cards = computed(() =>
  CATEGORIES.map((category) => {
    const monthPrices = categories.find((c) => c.id === category.code)?.month_prices ?? []
    return {
      ...category,
      dailyPrice: lowSeasonDailyFrom30(monthPrices),
      monthlyPrice: lowSeasonMonthly1k(monthPrices),
    }
  }),
)
</script>
