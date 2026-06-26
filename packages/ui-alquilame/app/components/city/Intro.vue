<template>
  <!--
    F2 step03 — City Intro (issue #112, SCEN-F2-02).

    Restyle of CityPage.vue's #descripcion + #introduccion to the design's #intro
    look: a clean light document section with the red accent bar (h-1 w-10 rounded
    bg-red-600), a .heading-section title (Plus Jakarta) and relaxed body copy.

    COPY: all indexable per-city SEO copy (city.description, expandedContent) is
    kept verbatim. The only brand-authored line is the #descripcion poster, which
    alquilame deliberately words differently from alquilatucarro to avoid mirroring
    the sister brand:
      - #descripcion: the "En {franchise} {city} muévete a tu ritmo, sin límites"
        poster + city.description + the city illustration.
      - #introduccion (#intro): the "Explora {city} con tu carro de alquiler"
        heading + expandedContent.intro paragraph (only for cities with rich
        content — same hasExpandedContent guard as before).

    Both sections are light backgrounds → default dark text is correct; no
    [--ctx-text-primary:#fff] override (that is only for dark/red sections).
  -->
  <div>
    <!-- Description Section (#descripcion) — city poster + description copy -->
    <section id="descripcion" class="bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-center">
        <!-- City illustration (CLS-safe: reserved square box) -->
        <div class="flex justify-center md:self-center aspect-square w-full max-w-[400px] mx-auto">
          <LazyImagesCiudadesChica :city-name="city?.name" />
        </div>

        <!-- Poster: "En {franchise} {city} muévete a tu ritmo, sin límites" -->
        <div class="flex flex-col gap-0 text-center">
          <div class="heading-sub text-red-600 font-extrabold text-xl md:text-3xl">
            En {{ franchise.shortname }}
          </div>
          <div class="heading-section text-red-600 font-extrabold text-3xl md:text-5xl" v-text="city?.name"></div>
          <p class="heading-card text-gray-900 font-extrabold text-2xl md:text-4xl mb-0 leading-snug">
            muévete <br />
            a tu ritmo, <br />
            sin <br />
            límites
          </p>
          <!-- Diamond divider (design rhythm) -->
          <div class="flex items-center w-full my-3 md:my-4">
            <div class="flex-grow border-t border-gray-200"></div>
            <div class="mx-4 w-2.5 h-2.5 bg-red-600 rotate-45 rounded-[2px]"></div>
            <div class="flex-grow border-t border-gray-200"></div>
          </div>
        </div>

        <!-- City description copy -->
        <div class="md:self-center">
          <!-- Red accent bar (design #intro signature) -->
          <div class="h-1 w-10 rounded-full bg-red-600 mb-5 mx-auto md:mx-0"></div>
          <p
            class="text-base md:text-lg text-gray-600 leading-relaxed text-center md:text-left"
            v-text="city?.description"
          ></p>
        </div>
      </div>
    </section>

    <!-- Intro Section (#introduccion → design #intro) — only for rich-content cities -->
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
  </div>
</template>

<script setup lang="ts">
/** types */
// City is imported from utils (explicit, per convention); CityExpandedContent is
// an auto-imported layer type (Nuxt imports.dirs) → used bare, no import needed.
import type { City } from '@rentacar-main/logic/utils'

/** imports */
import { defineAsyncComponent } from 'vue'

/** props */
defineProps<{
  city: City
  /** Rich expanded content (intro). Null for cities without curated content. */
  expandedContent: CityExpandedContent | null
}>()

/** refs */
const { franchise } = useAppConfig()

const LazyImagesCiudadesChica = defineAsyncComponent(
  () => import('../Images/Ciudades/Chica.vue'),
)
</script>
