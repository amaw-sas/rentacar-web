<template>
  <!--
    Google trust block — the 5,0 rating, the star row, the multicolor Google
    logo and the "Ver reseñas en Google" link.

    Extracted from the home reviews section so the CITY testimonials sections
    can show the same proof. The 19 city landings are the pages competing for
    "alquiler de carros en {ciudad}" and they carried no Google signal at all:
    the strongest social proof we have was absent exactly where it works hardest.

    REAL data only — alquilame's actual Business profile
    (cid=11824841242913553901). Reviewed 2026-06; re-verify the rating there and
    keep it in sync with the footer badge in layouts/default.vue.

    No review COUNT here, deliberately: a hardcoded total only ages one way, and
    a visibly stale number undermines the one block whose job is to look
    trustworthy. The rating and the "verificadas con autor y fecha" line carry it.

    `heading` lets the caller title it — the home says "Reseñas verificadas en
    Google", a city landing can name the city.
  -->
  <div class="text-center lg:text-left">
    <div class="flex flex-col items-center lg:items-start">
      <!-- Google logo (multicolor, desktop) -->
      <svg class="hidden lg:block w-9 h-9 mb-3" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>

      <div class="flex items-center gap-3">
        <span class="font-heading font-extrabold leading-none text-brand-600 text-6xl sm:text-7xl">5,0</span>
        <!-- Star row (desktop) -->
        <div class="hidden lg:flex gap-1">
          <StarIcon v-for="i in 5" :key="i" cls="text-yellow-400 w-7 h-7" />
        </div>
      </div>

      <!-- Star row + Google logo (mobile) -->
      <div class="flex lg:hidden items-center gap-2 mt-3">
        <div class="flex gap-1">
          <StarIcon v-for="i in 5" :key="i" cls="text-yellow-400 w-[26px] h-[26px]" />
        </div>
        <svg class="w-7 h-7" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      </div>
    </div>

    <component
      :is="headingTag"
      class="mt-4 text-3xl md:text-4xl font-extrabold font-heading text-gray-900 leading-tight"
    >
      {{ heading }}
    </component>
    <p class="mt-2 text-base text-gray-500">Verificadas con autor y fecha</p>

    <a
      :href="GOOGLE_REVIEWS_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 transition-all"
    >
      Ver reseñas en Google
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 17 17 7" /><path d="M9 7h8v8" />
      </svg>
    </a>
  </div>
</template>

<script setup lang="ts">
import { IconsStarIcon as StarIcon } from '#components'

withDefaults(
  defineProps<{
    /** Section title. A city landing can name itself here. */
    heading?: string
    /** Use h3 when the surrounding section already owns the h2. */
    headingTag?: 'h2' | 'h3'
  }>(),
  {
    heading: 'Reseñas verificadas en Google',
    headingTag: 'h2',
  },
)

/** alquilame's real Google Business profile. */
const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps?cid=11824841242913553901'
</script>
