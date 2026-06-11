<template>
  <!--
    F1 step04 — Cities (issue #112). Port of the design's #cities section to Vue.

    Fidelity principle (F1, same decision as F0/Hero): the design links every city
    to a chat-app contact deep link (an Astro artifact). We REPLACE those with
    INTERNAL links to the city landing route `/{city.id}` (City.id === slug === the
    /[city] route param). No external contact deep links exist in this section.

    Data: ALL active cities from useData().cities (Supabase-dynamic via
    rentacar-data). The count is DB-controlled — never hardcoded or sliced.

    Visual: the design pairs a "featured" row of photo cards with a pill/chip grid
    of the rest. Our repo ships no per-city photos (only chica.webp), so the
    featured cards use a CSS brand gradient backdrop with the city name overlaid —
    CLS-safe via a reserved aspect-[4/3]. The pill grid lists every active city.

    Gradient guard (F0 lesson): use the v4 `bg-linear-to-*` utility, never the
    broken v3 gradient alias (which renders background-image:none with custom
    @theme tokens). Headings adopt the `.heading-*` utilities (Plus Jakarta).
  -->
  <section id="cities" class="bg-gray-100 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="heading-section text-gray-900">
          Presentes en {{ cities.length }} Ciudades de Colombia
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Encuentra tu carro en las principales ciudades de Colombia
        </p>
      </div>

      <!-- Featured cities — gradient-backed photo-style cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
        <NuxtLink
          v-for="city in featuredCities"
          :key="city.id"
          :to="`/${city.id}`"
          :aria-label="`Alquiler de carros en ${city.name}`"
          class="group relative block rounded-2xl overflow-hidden aspect-[4/3] bg-linear-to-br from-red-700 to-red-900 shadow-sm hover:shadow-lg transition-shadow duration-300 [--ctx-text-primary:#fff]"
        >
          <!-- Dark gradient overlay for text legibility -->
          <div class="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
          <!-- Content -->
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="heading-card text-white drop-shadow-md">{{ city.name }}</h3>
          </div>
          <!-- Hover tint -->
          <div class="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/15 transition-colors duration-300"></div>
        </NuxtLink>
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
    </div>
  </section>
</template>

<script setup lang="ts">
// Types
import type { City } from '@rentacar-main/logic/utils'

// useData is auto-imported from the logic layer; cities are Supabase-dynamic.
const { cities } = useData()

// The first few cities get the larger featured treatment; the full set always
// appears in the pill grid below. Featured count is a presentation cap only —
// it never hides a city (every city is still linked in the grid).
const featuredCities = computed<City[]>(() => cities.slice(0, 4))
</script>
