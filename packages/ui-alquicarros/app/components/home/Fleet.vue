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
  <section
    id="fleet"
    class="px-4 sm:px-6 lg:px-8"
    :class="[
      variante === 1 ? 'bg-[#111b22] py-12 text-white md:py-20' : '',
      variante === 2 ? 'bg-gray-50 py-12 text-black md:py-20' : '',
      variante === 3 ? 'bg-[#111b22] pt-0 pb-12 text-white md:pb-20' : '',
      variante === 0 ? 'bg-white py-12 text-black md:py-20' : '',
    ]"
  >
    <div class="mx-auto max-w-7xl">
      <!-- 1 · fondo oscuro continuo: las tarjetas dejan de flotar sobre un hueco blanco -->
      <!-- 2 · encabezado a la izquierda y selector a la derecha, en una fila -->
      <!-- 3 · el selector monta sobre el borde del hero y cose las dos secciones -->
      <div
        :class="[
          variante === 2 ? 'mb-10 flex flex-wrap items-end justify-between gap-4' : '',
          variante === 3 ? 'relative z-10 -mt-[57px] mb-10 flex justify-center' : '',
          variante === 1 || variante === 0 ? 'text-center mb-12' : '',
        ]"
      >
        <div v-if="variante === 1 || variante === 2" :class="variante === 2 ? 'text-left' : ''">
          <p
            class="font-heading text-xs font-semibold tracking-widest uppercase"
            :class="variante === 1 ? 'text-brand-300' : 'text-brand-800'"
          >
            Precios reales, fechas reales
          </p>
          <h2 class="mt-1 font-heading text-2xl font-extrabold md:text-3xl">
            Elige cuántos días
          </h2>
        </div>
        <!-- Selector de ventana · segmentado, con las fechas dentro del propio botón
             para no gastar un renglón aparte debajo. -->
        <div
          class="inline-flex gap-0.5 rounded-2xl border p-1 shadow-sm"
          :class="[
            variante === 1 ? 'border-white/15 bg-white/10' : 'border-gray-200 bg-white',
            variante === 2 ? 'mt-0' : 'mt-8',
            variante === 3 ? 'shadow-2xl shadow-black/40 ring-1 ring-black/5' : '',
          ]"
        >
          <button
            v-for="v in VENTANAS"
            :key="v.k"
            type="button"
            class="rounded-xl px-3.5 py-2.5 text-center whitespace-nowrap transition-colors sm:px-5 sm:text-left"
            :class="[
              plan === v.k
                ? 'bg-whatsapp text-black shadow-sm'
                : variante === 1
                  ? 'text-white/80 hover:bg-white/10'
                  : 'text-gray-900 hover:bg-gray-50',
            ]"
            :aria-pressed="plan === v.k"
            @click="plan = v.k"
          >
            <span class="block font-heading text-sm font-bold">{{ v.label }}</span>
          </button>
        </div>
      </div>

      <!-- Grid: 6 golden cards with real prices; presentación en FleetCard -->
      <div class="grid md:grid-cols-2 gap-6">
        <HomeFleetCard
          v-for="card in cards"
          :key="card.code"
          :card="card"
          :plan="plan"
          :ventana="ventanaActiva"
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

// MAQUETA — «?d=2026-10-05» simula ese día para ver cómo se renombra la pestaña.
/** 3 = el selector monta sobre el hero. La lab page usa 1 y 2 para comparar. */
const props = withDefaults(defineProps<{ variante?: number }>(), { variante: 3 })
const variante = computed(() => props.variante)

const route = useRoute()
const hoySimulado = computed(() => {
  const q = String(route.query.d ?? '')
  return /^\d{4}-\d{2}-\d{2}$/.test(q)
    ? new Date(`${q}T00:00:00.000Z`)
    : new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
})

/** «?h=17» simula esa hora de Bogotá para ver el corte por cierre de sedes. */
const ahoraSimulado = computed(() => {
  const h = Number(route.query.h)
  // OJO: hoySimulado es medianoche UTC. Convertirlo a Bogotá devuelve el día
  // ANTERIOR (00:00Z = 19:00 del día previo en UTC-5). Se toman las partes UTC.
  const base = hoySimulado.value.toISOString().slice(0, 10)
  const hora = Number.isFinite(h) && h >= 0 && h <= 23 ? h : new Date().getHours()
  return new Date(`${base}T${String(hora).padStart(2, '0')}:00:00.000-05:00`)
})
const salida = computed(() => primeraRecogida(ahoraSimulado.value))

/** La etiqueta del bloque NO está escrita: la decide el calendario. */
const bloque = computed(() => bloqueDe(hoySimulado.value))

const VENTANAS = computed(() => {
  const hoy = hoySimulado.value
  const b = bloque.value
  const manana = new Date(hoy.getTime() + 86400000)
  const semana = new Date(hoy.getTime() + 7 * 86400000)
  return [
    {
      k: 'hoy',
      label: 'Un día',
      // La pestaña dice la duración; la tarjeta dice si esa salida es hoy o
      // mañana, que depende de si las sedes ya cerraron.
      etiqueta: salida.value.rodo ? 'Mañana' : 'Hoy',
      when: `${fmtCorto(salida.value.fecha)} → ${fmtCorto(new Date(salida.value.fecha.getTime() + 86400000))}`,
      dias: 1,
    },
    {
      k: 'finde',
      label: b ? b.etiqueta : 'Fin de semana',
      etiqueta: b ? b.etiqueta : 'Fin de semana',
      when: b ? `${fmtCorto(b.recogida)} → ${fmtCorto(b.devolucion)}` : '',
      festivos: b?.festivos ?? [],
      dias: b?.dias ?? 3,
    },
    {
      k: 'semana',
      label: 'Una semana',
      etiqueta: 'Una semana',
      when: `${fmtCorto(hoy)} → ${fmtCorto(semana)}`,
      dias: 7,
    },
  ]
})

const plan = ref<string>('finde')
const ventanaActiva = computed(
  () => VENTANAS.value.find((v) => v.k === plan.value) ?? VENTANAS.value[1]!,
)

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
