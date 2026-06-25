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
    @theme tokens). Headings adopt the `.heading-*` utilities.
  -->
  <section id="cities" class="bg-gray-100 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          Presentes en más de {{ cityCount }} Ciudades
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Encuentra tu carro en las principales ciudades de Colombia
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
              <div class="absolute inset-0 bg-brand-600/0 transition-colors duration-300 group-hover/card:bg-brand-600/15"></div>
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
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-brand-600 text-gray-900 hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20 hover:shadow-md"
        >
          {{ city.name }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Types
import type { City } from '@rentacar-main/logic/utils'

// useData is auto-imported from the logic layer; cities are Supabase-dynamic.
const { cities } = useData()

// Live active-city count (Supabase) for the heading. Guards the degraded path:
// cities.length would render 0 when the data source is empty (see Stats.vue /
// ValueProps.vue, which use the same composable).
const cityCount = useCityCount()

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
    const city = cities.find((c: City) => c.id === id)
    return city ? [{ ...city, image }] : []
  })
)

// Two copies for the seamless marquee loop (second copy rendered aria-hidden).
const marqueeCities = computed<FeaturedCity[]>(() => [
  ...featuredCities.value,
  ...featuredCities.value,
])
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
