<template>
  <!--
    City testimonials use the audited Google export and a deterministic
    slug-specific selection. The city belongs in the section context, never as
    an unsupported claim about where an individual reviewer rented.

    Gradient uses the v4 bg-linear-to-* utility (F0 lesson: the broken v3 alias
    with custom @theme tokens renders background-image:none).
  -->
  <section
    id="testimonios"
    class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-12 md:py-16"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header — city-targeted without presenting every review as local -->
      <div class="text-center max-w-2xl mx-auto mb-10 md:mb-12">
        <div
          class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"
          aria-hidden="true"
        />
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          Opiniones para alquilar carro en {{ city?.name }}
        </h2>
        <p class="body-base">
          Opiniones verificadas de clientes de Alquílame en Google para ayudarte
          a reservar tu carro en {{ city?.name }}.
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

        <!-- Review cards — deterministic city selection from the audited source -->
        <div
          v-if="testimonios.length"
          class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5"
        >
          <a
            v-for="testimonio in testimonios"
            :key="testimonio.name"
            :href="GOOGLE_REVIEWS_URL"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Ver la reseña de ${testimonio.name} en Google`"
            class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-all duration-200"
          >
            <div class="flex items-center gap-3 min-h-[48px]">
              <span
                class="relative flex-shrink-0 w-12 h-12 inline-flex items-center justify-center"
              >
                <img
                  src="/images/howitworks/circulo-rojo.svg"
                  alt=""
                  aria-hidden="true"
                  class="absolute inset-0 w-full h-full pointer-events-none select-none"
                  draggable="false"
                >
                <span class="relative font-heading font-extrabold text-white text-sm tracking-tight">
                  {{ initials(testimonio.name) }}
                </span>
              </span>
              <div class="min-w-0">
                <p class="font-bold text-gray-900 leading-tight">
                  {{ testimonio.name }}
                </p>
                <p v-if="testimonio.relativeDate" class="mt-1 text-xs text-gray-500">
                  {{ testimonio.relativeDate }}
                </p>
              </div>
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
            <p class="mt-3 body-sm leading-relaxed whitespace-pre-line">
              &ldquo;{{ testimonio.quote }}&rdquo;
            </p>
          </a>
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
import { GOOGLE_REVIEWS_URL, pickCityReviews } from "~/data/googleReviews";

/** props */
const props = defineProps<{
  city: City;
}>();

const testimonios = computed(() => pickCityReviews(props.city?.id ?? ""));

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
</script>
