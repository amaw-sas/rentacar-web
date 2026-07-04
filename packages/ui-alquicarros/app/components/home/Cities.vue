<template>
  <!--
    Cities (issue #112, rediseño). Decisión de diseño tras review: con solo 4 fotos reales NO se
    simula un tile de imagen por ciudad (la marquesina/masonry de 4 lanes se rechazó: el resto de
    ciudades salía como bloque naranja vacío). En su lugar:

      1. Mosaico estático asimétrico con las ciudades que SÍ tienen foto (featuredCities) —
         "ciudades destacadas". El nº de tiles == nº de fotos disponibles; nunca se inventan.
      2. Listado de cobertura: TODAS las ciudades activas como enlaces tipográficos con pin —
         honesto con los assets (foto solo donde la hay), completo para SEO/escaneo.

    Sin marquesina ni animación de scroll. Datos: SERVICE_CITIES (set determinista
    build-time), NO rentacar-data live — la data live driftaba entre el HTML ISR y el payload
    de hidratación y causaba hydration mismatches (issue #221); el count deriva del mismo vía
    useCityCount. Gradient guard (v4): `bg-linear-to-*`, nunca el alias roto v3. Headings
    con `.heading-*` / `font-heading`.
  -->
  <section id="cities" class="bg-gray-100 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          Presentes en {{ cityCount }} Ciudades
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Encuentra tu carro en las principales ciudades de Colombia
        </p>
      </div>

      <!-- Ciudades destacadas — mosaico estático con las fotos disponibles -->
      <div
        v-if="featuredCities.length"
        class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[150px] md:auto-rows-[180px] mb-12"
      >
        <NuxtLink
          v-for="(city, i) in featuredCities"
          :key="city.id"
          :to="`/${city.id}`"
          :aria-label="`Alquiler de carros en ${city.name}`"
          :class="mosaicSpan(i)"
          class="group/card relative block rounded-2xl overflow-hidden [--ctx-text-primary:#fff]"
        >
          <NuxtImg
            :src="city.image"
            alt=""
            loading="lazy"
            width="600"
            height="400"
            sizes="sm:50vw md:33vw lg:640px"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
          <!-- Overlay para legibilidad del nombre -->
          <div class="absolute inset-0 bg-linear-to-t from-gray-900/85 via-gray-900/25 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="heading-card text-xl md:text-2xl font-bold text-white drop-shadow-md">
              {{ city.name }}
            </h3>
          </div>
          <!-- Tinte hover de marca -->
          <div class="absolute inset-0 bg-brand-600/0 transition-colors duration-300 group-hover/card:bg-brand-600/15"></div>
        </NuxtLink>
      </div>

      <!-- Cobertura nacional — listado tipográfico de TODAS las ciudades -->
      <div class="flex items-center gap-4 mb-6 max-w-4xl mx-auto">
        <span class="h-px flex-1 bg-gray-300"></span>
        <span class="text-sm font-semibold uppercase tracking-wide text-gray-500">Cobertura nacional</span>
        <span class="h-px flex-1 bg-gray-300"></span>
      </div>

      <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 max-w-4xl mx-auto">
        <li v-for="city in SERVICE_CITIES" :key="city.id">
          <NuxtLink
            :to="`/${city.id}`"
            :aria-label="`Alquiler de carros en ${city.name}`"
            class="group/city inline-flex items-center gap-2 text-gray-700 hover:text-brand-700 transition-colors"
          >
            <UIcon name="i-lucide-map-pin" class="size-4 shrink-0 text-brand-600" />
            <span class="text-sm font-medium group-hover/city:underline underline-offset-4">{{ city.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
// Deterministic city set (build-time). El listado de cobertura, el mosaico y el
// count derivan de esto — no de rentacar-data live — para que el HTML SSR y el
// payload de hidratación siempre coincidan bajo ISR; la data live driftaba entre
// ambos y causaba hydration mismatches (issue #221). cityCount deriva del mismo.
import { SERVICE_CITIES } from '@rentacar-main/logic/utils'

const cityCount = useCityCount()

// Fotos que realmente enviamos, por City.id (=== slug). El orden define el orden del mosaico.
const FEATURED: ReadonlyArray<{ id: string; image: string }> = [
  { id: 'bogota', image: '/images/cities/bogota.jpg' },
  { id: 'medellin', image: '/images/cities/medellin.jpg' },
  { id: 'cali', image: '/images/cities/cali.jpg' },
  { id: 'cartagena', image: '/images/cities/cartagena.jpg' },
]

type FeaturedCity = { id: string; name: string; image: string }

// Set destacado: intersección ordenada de FEATURED con ciudades activas. flatMap descarta
// cualquier foto cuya ciudad no esté activa — nunca se inventan ciudades.
const featuredCities = computed<FeaturedCity[]>(() =>
  FEATURED.flatMap(({ id, image }) => {
    const city = SERVICE_CITIES.find((c) => c.id === id)
    return city ? [{ id: city.id, name: city.name, image }] : []
  }),
)

// Spans del mosaico asimétrico (1 grande + 3). Pensado para 4 fotos; degrada a uniforme si hay
// otra cantidad. Strings literales para que el JIT de Tailwind los detecte.
const MOSAIC_SPANS = [
  'col-span-2 md:row-span-2',
  'col-span-1 md:col-span-2',
  'col-span-1',
  'col-span-2 md:col-span-1',
] as const
function mosaicSpan(i: number): string {
  return featuredCities.value.length === 4 ? (MOSAIC_SPANS[i] ?? 'col-span-1') : 'col-span-1'
}
</script>
