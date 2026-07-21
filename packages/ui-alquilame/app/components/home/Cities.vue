<template>
  <!--
    F1 step04 — Cities (issue #112). Port of the design's #cities section to Vue.

    Fidelity principle (F1, same decision as F0/Hero): the design links every city
    to a chat-app contact deep link (an Astro artifact). We REPLACE those with
    INTERNAL links to the city landing route `/{city.id}` (City.id === slug === the
    /[city] route param). No external contact deep links exist in this section.

    Data: ALL active cities from useData().cities (Supabase-dynamic via
    rentacar-data). The count is DB-controlled — never hardcoded or sliced.

    Visual (golden parity): a horizontal MARQUEE of "featured" photo cards over a
    pill/chip grid of every active city. Featured cards carry a real city photo
    (public/images/cities/*) under a dark gradient overlay with the name. A city
    only becomes a featured card when it is BOTH an active city in the data source
    AND one we ship a photo for (mapped by city.id) — every other active city still
    appears in the pill grid. No placeholder cities are ever invented.

    Gradient guard (F0 lesson): use the v4 `bg-linear-to-*` utility, never the
    broken v3 gradient alias (which renders background-image:none with custom
    @theme tokens). Headings adopt the `.heading-*` utilities (Plus Jakarta).
  -->
  <section id="cities" class="bg-gray-100 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="heading-section font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          Alquila tu carro en las principales ciudades de Colombia
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Operamos en más de {{ cities.length }} ciudades de Colombia. Estas son las más solicitadas.
        </p>
      </div>

      <!-- Featured cities — horizontal marquee of photo cards -->
      <div v-if="featuredCities.length" class="marquee group relative mb-10 overflow-hidden">
        <!-- Edge fades -->
        <div class="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-r from-gray-100 to-transparent z-10"></div>
        <div class="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-l from-gray-100 to-transparent z-10"></div>

        <div class="marquee-track flex gap-5 w-max">
          <!--
            Two copies of the featured set: translating the track by -50% advances
            it by exactly one copy width, so the loop is seamless. The second copy
            is aria-hidden / not focusable to avoid duplicate links for AT.
          -->
          <div
            v-for="(city, i) in marqueeCities"
            :key="`${city.id}-${i}`"
            class="w-64 md:w-72 flex-shrink-0"
            :aria-hidden="i >= featuredCities.length ? 'true' : 'false'"
          >
            <NuxtLink
              :to="`/${city.id}`"
              :tabindex="i >= featuredCities.length ? -1 : undefined"
              :aria-label="`Alquiler de carros en ${city.name}`"
              class="group/card relative block rounded-2xl overflow-hidden aspect-[4/3] bg-linear-to-br from-gray-200 to-gray-100 [--ctx-text-primary:#fff]"
            >
              <!-- Real city photo -->
              <NuxtImg
                :src="city.image"
                :alt="`Vista de ${city.name}, Colombia`"
                loading="lazy"
                width="288"
                height="216"
                sizes="256px md:288px"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
              />
              <!-- Dark gradient overlay for text legibility -->
              <div class="absolute inset-0 bg-linear-to-t from-gray-900/85 via-gray-900/30 to-transparent"></div>
              <!-- Content -->
              <div class="absolute bottom-0 left-0 right-0 p-6">
                <h3 class="heading-card text-xl font-bold text-white drop-shadow-md">{{ city.name }}</h3>
              </div>
              <!-- Hover tint -->
              <div class="absolute inset-0 bg-red-600/0 transition-colors duration-300 group-hover/card:bg-red-600/15"></div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- All cities — pill / chip grid (every active city, internal link) -->
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          v-for="city in cities"
          :key="city.id"
          :to="`/${city.id}`"
          :aria-label="`Alquiler de carros en ${city.name}`"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20 hover:shadow-md"
        >
          {{ city.name }}
        </NuxtLink>
      </div>

      <!-- Trust row (confianza) — ported from the reference's PuntosEntrega
           footer: three reassurance items under a divider. -->
      <div class="grid grid-cols-1 sm:grid-cols-3 mt-12 pt-8 border-t border-gray-900/[0.08]">
        <div
          v-for="(item, i) in confianza"
          :key="item.title"
          :class="[
            'flex flex-row items-start gap-3.5 sm:flex-col sm:gap-2',
            i === 0 ? 'sm:pr-6' : 'sm:px-6 sm:border-l sm:border-gray-900/[0.08]',
            i > 0 ? 'pt-5 mt-5 border-t border-gray-900/[0.08] sm:pt-0 sm:mt-0 sm:border-t-0' : '',
          ]"
        >
          <span class="shrink-0 text-brand-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="item.icon"
            />
          </span>
          <div class="sm:contents">
            <p class="font-bold font-heading text-sm text-gray-900">{{ item.title }}</p>
            <p class="text-[13px] text-gray-500 leading-snug">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Types
import type { City } from '@rentacar-main/logic/utils'

// useData is auto-imported from the logic layer; cities are Supabase-dynamic.
const { cities } = useData()

// Photos we actually ship, keyed by City.id (=== slug). A city only becomes a
// featured photo card when both (a) it is an active city in the data source AND
// (b) we have a real photo for it — no placeholder cities are ever invented.
// The array order defines the marquee order (golden: Bogotá, Medellín, Cali,
// Cartagena).
const FEATURED: ReadonlyArray<{ id: string; image: string }> = [
  { id: 'bogota', image: '/images/cities/bogota.jpg' },
  { id: 'medellin', image: '/images/cities/medellin.jpg' },
  { id: 'cali', image: '/images/cities/cali.jpg' },
  { id: 'cartagena', image: '/images/cities/cartagena.jpg' },
]

type FeaturedCity = City & { image: string }

// Featured set: the ordered intersection of FEATURED photos with real active
// cities. flatMap drops any photo whose city is not currently active.
const featuredCities = computed<FeaturedCity[]>(() =>
  FEATURED.flatMap(({ id, image }) => {
    const city = cities.value.find((c: City) => c.id === id)
    return city ? [{ ...city, image }] : []
  })
)

// Two copies for the seamless marquee loop (second copy rendered aria-hidden).
const marqueeCities = computed<FeaturedCity[]>(() => [
  ...featuredCities.value,
  ...featuredCities.value,
])

// Trust row copy + icons ported verbatim from the reference's PuntosEntrega
// "confianza" block.
const confianza: ReadonlyArray<{ title: string; description: string; icon: string }> = [
  {
    title: 'Seguridad y confianza',
    description: 'Protocolos de bioseguridad en todos nuestros puntos.',
    icon: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  },
  {
    title: 'Entregas rápidas',
    description: 'Proceso ágil para que empieces tu viaje.',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  },
  {
    title: 'Soporte 24/7',
    description: 'Estamos contigo en cada paso del alquiler.',
    icon: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  },
]
</script>

<style scoped>
/*
  Track holds two copies of the featured set; translating it by -50% advances it
  by exactly one copy width, so the loop is seamless regardless of viewport.
  Mirrors Partners.vue's marquee mechanism.
*/
@keyframes cities-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.marquee-track {
  animation: cities-marquee 40s linear infinite;
  will-change: transform;
}

.marquee:hover .marquee-track {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    justify-content: center;
  }
}
</style>
