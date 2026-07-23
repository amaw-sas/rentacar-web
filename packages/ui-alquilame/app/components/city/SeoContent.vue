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
    <section id="ventajas" class="bg-[#EDF0F5] py-12 md:py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Ventajas de alquilar carro</span>
            <span class="text-gray-900"> en {{ city?.name }}</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      class="bg-white py-12 md:py-16"
    >
      <!--
        Width is content-driven (two-width rule). Plain prose stays capped at
        max-w-3xl for readability; when the city ships a diorama the intro
        becomes a 2-col grid (small diorama left, text right) at the 7xl grid
        width. Single source for the heading + paragraph — only the wrapper
        class and the optional diorama column change.
      -->
      <div
        class="mx-auto px-4 sm:px-6 lg:px-8"
        :class="dioramaSrc
          ? 'max-w-7xl grid items-center gap-6 lg:gap-12 lg:grid-cols-[minmax(0,19rem)_1fr]'
          : 'max-w-3xl'"
      >
        <!--
          Per-city diorama (Bogotá today): a small transparent 3D scene, LEFT of
          the copy on desktop, below it on mobile. A cutout, not a framed photo:
          object-contain, no card/rounded/shadow, so it floats on the white
          section. Only renders for cities present in CITY_DIORAMA.
        -->
        <div v-if="dioramaSrc" class="order-2 lg:order-1">
          <NuxtImg
            :src="dioramaSrc"
            :alt="`Explora ${city?.name} con tu carro de alquiler`"
            loading="lazy"
            format="webp"
            sizes="304px"
            class="w-full max-w-xs mx-auto h-auto object-contain select-none"
            draggable="false"
          />
        </div>

        <div class="order-1 lg:order-2">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-5"></div>
          <h2 class="heading-section text-gray-900 mb-5">
            <span class="text-red-700">Explora {{ city?.name }}</span>
            <span class="text-gray-900"> con tu carro de alquiler</span>
          </h2>
          <div class="space-y-4 text-base md:text-lg text-gray-600 leading-relaxed">
            <p>{{ expandedContent.intro }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Destinations Section (#destinos) — only rich-content cities -->
    <section
      v-if="expandedContent"
      id="destinos"
      class="bg-white py-12 md:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Destinos para recorrer con carro rentado</span>
            <span class="text-gray-900"> desde {{ city?.name }}</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      class="bg-[#EDF0F5] py-12 md:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"></div>
          <h2 class="heading-section text-gray-900">
            <span class="text-red-700">Consejos</span>
            <span class="text-gray-900"> para alquilar carro en {{ city?.name }}</span>
          </h2>
        </div>
        <!-- Three per row, matching Ventajas/Destinos: stacked, each tip card
             spanned the full width and dwarfed every other card block. -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      class="bg-white py-12 md:py-16"
    >
      <!-- Text + a small road photo side by side on desktop. The image is
           zoom-cropped (object-cover) into a fixed box that is shorter than the
           paragraph, so it never adds to the section's height. The photo is
           decorative and generic (a car on a scenic road) — this section is one
           component shared by all 19 cities, so it is intentionally NOT
           city-specific. -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.7fr_1fr] gap-8 lg:gap-12 items-center">
        <div>
          <div class="h-1 w-10 rounded-full bg-red-600 mb-5"></div>
          <h2 class="heading-section text-gray-900 mb-5">
            <span class="text-red-700">Mejor época</span>
            <span class="text-gray-900"> para alquilar carro y viajar a {{ city?.name }}</span>
          </h2>
          <div class="space-y-4 text-base md:text-lg text-gray-600 leading-relaxed">
            <p>{{ expandedContent.bestSeason }}</p>
          </div>
        </div>
        <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
          <NuxtImg
            src="/images/cities/carretera-viaje.webp"
            alt="Carro de alquiler recorriendo una carretera de montaña en Colombia"
            width="1000"
            height="750"
            format="webp"
            sizes="sm:100vw lg:400px"
            loading="lazy"
            decoding="async"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>

    <!-- Related Cities Section (#ciudades-cercanas) — internal linking -->
    <section
      v-if="relatedCities.length > 0 || otherCities.length > 0"
      id="ciudades-cercanas"
      class="bg-[#EDF0F5] py-12 md:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div
          v-if="relatedCities.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
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

        <!-- Every other city as a pill — same internal-linking grid the home
             uses. Renders on all city pages, including those with no curated
             nearby cards above. -->
        <p
          v-if="relatedCities.length > 0"
          class="text-center text-sm font-medium text-gray-500 mt-10 mb-4"
        >
          O explora el alquiler de carros en todas nuestras ciudades:
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink
            v-for="other in otherCities"
            :key="other.id"
            :to="`/${other.id}`"
            :aria-label="`Alquiler de carros en ${other.name}`"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20 hover:shadow-md"
          >
            {{ other.name }}
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

// Every active city (Supabase-dynamic), for the all-cities pill grid — the same
// internal-linking treatment the home uses. Excludes the current city (no
// self-link). This is what lets every city page reach every other, for both
// visitors and crawlers, even when a city has no curated "nearby" mapping.
const { cities } = useData()
const otherCities = computed(() =>
  cities.value.filter((c: City) => c.id !== props.city?.id),
)

// Per-city hero diorama for the #introduccion showcase. Only a few cities ship
// a bespoke transparent scene (Bogotá today); the rest keep the text-only intro.
// Keyed by city id so it renders on exactly one city, never blanket like the
// shared road photo. Add an entry here as more city dioramas are produced.
const CITY_DIORAMA: Record<string, string> = {
  bogota: '/images/cities/diorama-bogota.webp',
}
const dioramaSrc = computed(() => CITY_DIORAMA[props.city?.id ?? ''])

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
