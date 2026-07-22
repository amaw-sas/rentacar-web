<template>
  <!--
    F2 city testimonials — restyle of the design's #google-reviews IN-PLACE,
    keeping the CITY-SPECIFIC data. The cards render `useCityTestimonials(city.id)`
    (the same source that feeds the city aggregate-rating schema in CityPage)
    with a CITY-TARGETED heading ("…en {city.name}") — NOT the brand-level
    testimonial list that HomeReviews renders. Reusing HomeReviews here would
    swap the display city→brand and risk inconsistency with the city's
    aggregate-rating schema.

    The mockup's hardcoded marketing rating block (a fixed score + review
    count), its external CID review links and reviewer-tier badges are FICTION baked into
    the design build → NOT reproduced. No rating number is surfaced here; the
    aggregate-rating schema composable stays in CityPage, untouched.

    Gradient uses the v4 bg-linear-to-* utility (F0 lesson: the broken v3 alias
    with custom @theme tokens renders background-image:none).
  -->
  <section
    id="testimonios"
    class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-12 md:py-16"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header — city-targeted -->
      <div class="text-center max-w-2xl mx-auto mb-10 md:mb-12">
        <div
          class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"
          aria-hidden="true"
        />
        <h2 class="heading-section text-3xl md:text-4xl text-gray-900 leading-tight mb-3">
          Opiniones de clientes que rentaron carros en {{ city?.name }}
        </h2>
        <p class="text-base text-gray-600">
          Descubre por qué somos la opción preferida para alquilar carros en
          {{ city?.name }}: atención cercana, precios competitivos y la
          facilidad para explorar la ciudad y sus alrededores.
        </p>
      </div>

      <!--
        Google trust block, shared with the home. A city landing is the page
        competing for "alquiler de carros en {ciudad}" and it carried no Google
        signal at all — the strongest proof we have was missing exactly where it
        works hardest. Rendered as an h3: the section's own h2 already titles
        this block, and a second h2 would flatten the heading outline.
      -->
      <!-- Rating BESIDE the cards, the same split the home uses: the rating
           column reads as a headline and the three reviews as its evidence.
           Stacked, the badge looked like the label of a list. -->
      <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-10 lg:gap-12 items-center">
        <HomeGoogleRating heading="Calificación verificada en Google" heading-tag="h3" />

        <!-- Review cards — city-specific testimonials -->
        <div
          v-if="testimonios.length"
          class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5"
        >
          <article
            v-for="testimonio in testimonios"
            :key="testimonio.user.name"
            class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            <!-- Author + avatar (real city data via UUser) -->
            <!-- CLS fix: reserve space for the avatar (48x48 = size 3xl) -->
            <div class="min-h-[48px]">
              <UUser
                size="3xl"
                v-bind="testimonio.user"
                :ui="userUIConfig"
                loading="lazy"
              >
                <template #avatar>
                  <ImagesAvatar :avatar="testimonio.user.avatar" />
                </template>
              </UUser>
            </div>

            <!-- Star row -->
            <div class="flex gap-0.5 mt-3" aria-label="5 de 5 estrellas">
              <StarIcon
                v-for="i in 5"
                :key="i"
                cls="text-yellow-400 w-4 h-4"
              />
            </div>

            <!-- Quote -->
            <p class="mt-3 text-sm text-gray-600 leading-relaxed">
              &ldquo;{{ testimonio.quote }}&rdquo;
            </p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type { City } from "@rentacar-main/logic/utils";

/** components */
import { IconsStarIcon as StarIcon } from "#components";

/** props */
const props = defineProps<{
  city: City;
}>();

// City-specific testimonials, fetched per city via /api/city-testimonials
// (#322 PR10 — they no longer travel inside the master catalog payload).
// Still keyed by props.city, NEVER the brand-level testimonial list.
const allTestimonios = useCityTestimonials(props.city?.id);

// Featured row is capped at THREE, matching the home. With the Google badge
// above it, a longer wall of cards made the badge read as the label of a list
// instead of a headline with a short row of proof under it. The source list is
// untouched — only what the section features is capped.
const testimonios = computed(() => (allTestimonios.value ?? []).slice(0, 3));

const userUIConfig = {
  name: "text-gray-900 font-bold",
  description: "text-gray-500",
};
</script>
