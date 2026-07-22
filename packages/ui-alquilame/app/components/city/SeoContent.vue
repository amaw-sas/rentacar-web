<template>
  <!--
    F2 step03 — City SEO content (issue #112, SCEN-F2-02).

    Restyle of CityPage.vue's #ventajas, #destinos, #consejos-conduccion,
    #mejor-temporada and #ciudades-cercanas to the design's section language:
    red accent bar (h-1 w-10 rounded bg-red-600), .heading-section titles
    (Plus Jakarta) and the light card chrome
    (bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-...).

    PRESERVATION RULE: destination names/times/descriptions, driving tips
    (pico y placa / peajes / parqueaderos), best-season paragraph and the
    related-cities internal links stay intact. The pickup benefit is deliberately
    inventory-based so it never invents an airport or city-centre branch.

    The #destinos / #consejos / #mejor-temporada blocks render only for cities
    with curated expandedContent (same guard as the original CityPage). All
    sections sit on light backgrounds → dark text is correct (no
    [--ctx-text-primary:#fff], which is reserved for dark/red sections).
  -->
  <div>
    <!-- Benefits Section (#ventajas) — adds ~100 words for SEO -->
    <section id="ventajas" class="bg-[#EDF0F5] py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Ventajas de alquilar carro</span>
            <span class="text-gray-900"> en {{ city?.name }}</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="flex items-start gap-4 bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 p-5"
          >
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span class="text-2xl" aria-hidden="true">{{ benefit.emoji }}</span>
            </div>
            <div>
              <h3 class="heading-sub text-gray-900 mb-1">{{ benefit.title }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed">{{ benefit.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!--
      Intro (#introduccion) — moved here from city/Intro.vue so it sits directly
      above #destinos: the paragraph ends by naming places to visit, which is
      exactly what the cards below list. Kept as its OWN section with its own
      heading rather than merged into Destinos, so the city keeps both
      keyword-bearing headings.
    -->
    <section
      v-if="expandedContent"
      id="introduccion"
      class="bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-3xl mx-auto">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-5"></div>
        <h2 class="heading-section text-gray-900 mb-5">
          <span class="text-red-700">Explora {{ city?.name }}</span>
          <span class="text-gray-900"> con tu carro de alquiler</span>
        </h2>
        <div class="space-y-4 text-base md:text-lg text-gray-600 leading-relaxed">
          <p>{{ expandedContent.intro }}</p>
        </div>
      </div>
    </section>

    <!-- Destinations Section (#destinos) — only rich-content cities -->
    <section
      v-if="expandedContent"
      id="destinos"
      class="bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Destinos para recorrer con carro rentado</span>
            <span class="text-gray-900"> desde {{ city?.name }}</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="destination in expandedContent.destinations"
            :key="destination.name"
            class="bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 p-6"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="heading-sub text-gray-900">{{ destination.name }}</h3>
              <span class="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full whitespace-nowrap">
                {{ destination.time }}
              </span>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed">{{ destination.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Driving Tips Section (#consejos-conduccion) — only rich-content cities -->
    <section
      v-if="expandedContent"
      id="consejos-conduccion"
      class="bg-[#EDF0F5] py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Consejos</span>
            <span class="text-gray-900"> para alquilar carro en {{ city?.name }}</span>
          </h2>
        </div>
        <div class="space-y-5">
          <div
            v-for="tip in drivingTips"
            :key="tip.title"
            class="flex items-start gap-4 bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] transition-all duration-200 p-5"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span class="text-red-600 font-bold text-lg" aria-hidden="true">{{ tip.emoji }}</span>
            </div>
            <div>
              <h3 class="heading-sub text-gray-900 mb-1">{{ tip.title }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed">{{ tip.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Season Section (#mejor-temporada) — only rich-content cities -->
    <section
      v-if="expandedContent"
      id="mejor-temporada"
      class="bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-3xl mx-auto">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-5"></div>
        <h2 class="heading-section text-gray-900 mb-5">
          <span class="text-red-700">Mejor época</span>
          <span class="text-gray-900"> para alquilar carro y viajar a {{ city?.name }}</span>
        </h2>
        <div class="space-y-4 text-base md:text-lg text-gray-600 leading-relaxed">
          <p>{{ expandedContent.bestSeason }}</p>
        </div>
      </div>
    </section>

    <!-- Related Cities Section (#ciudades-cercanas) — internal linking -->
    <section
      v-if="relatedCities.length > 0"
      id="ciudades-cercanas"
      class="bg-[#EDF0F5] py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Alquiler de carros</span>
            <span class="text-gray-900"> en ciudades cercanas</span>
          </h2>
          <p class="text-gray-600 mt-4">
            ¿Planeas un viaje más largo? También ofrecemos alquiler de vehículos en estas ciudades cercanas a {{ city?.name }}.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            v-for="related in relatedCities"
            :key="related.id"
            :to="`/${related.id}`"
            :aria-label="`Alquiler de carros en ${related.name}`"
            class="group flex flex-col items-center bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 p-4"
          >
            <LocationIcon cls="text-red-600 size-8 mb-2 group-hover:scale-110 transition-transform" />
            <span class="font-semibold text-gray-900 group-hover:text-red-700">{{ related.name }}</span>
            <span class="text-sm text-gray-500">{{ related.distance }} en carro</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/** types */
// City is imported from utils (explicit, per convention); CityExpandedContent
// and RelatedCity are auto-imported layer types (Nuxt imports.dirs) → used bare.
import type { City } from '@rentacar-main/logic/utils'

/** imports */
import { computed } from 'vue'
import { IconsLocationIcon as LocationIcon } from '#components'

/** props */
const props = defineProps<{
  city: City
  /** Rich expanded content (destinations / driving tips / best season). */
  expandedContent: CityExpandedContent | null
  /** Nearby cities for internal linking (empty array when none mapped). */
  relatedCities: RelatedCity[]
}>()

/**
 * Benefits copy. Pickup wording is availability-based because not every city
 * has an airport or city-centre branch; {{ city?.name }} interpolation is kept.
 */
const benefits = computed(() => [
  {
    emoji: '💰',
    title: 'Precios transparentes',
    body: `Sin cargos ocultos ni sorpresas. El precio que ves incluye seguro básico, impuestos y kilometraje ilimitado para recorrer ${props.city?.name} y sus alrededores.`,
  },
  {
    emoji: '🚗',
    title: 'Flota variada',
    body: `Desde económicos hasta SUVs y camionetas. Encuentra el vehículo perfecto para tu viaje en ${props.city?.name}, ya sea por negocios, turismo o familia.`,
  },
  {
    emoji: '📍',
    title: 'Puntos de recogida',
    body: `Consulta en el buscador los puntos de recogida activos en ${props.city?.name}. Las opciones disponibles se actualizan con el inventario de sedes.`,
  },
  {
    emoji: '⭐',
    title: 'Atención personalizada',
    body: `Soporte en español las 24 horas. Te asesoramos sobre rutas, destinos y todo lo que necesites saber para moverte en ${props.city?.name}.`,
  },
])

/**
 * Driving tips — preserved VERBATIM (pico y placa / peajes / parqueaderos),
 * sourced from expandedContent. Titles match the original headings exactly.
 */
const drivingTips = computed(() =>
  props.expandedContent
    ? [
        { emoji: '🚗', title: 'Pico y Placa', body: props.expandedContent.drivingTips.picoPlaca },
        { emoji: '💰', title: 'Peajes', body: props.expandedContent.drivingTips.tolls },
        { emoji: '🅿️', title: 'Parqueaderos', body: props.expandedContent.drivingTips.parking },
      ]
    : [],
)
</script>
