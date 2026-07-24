<template>
  <!--
    Reviews — parity with the golden #google-reviews section.

    GOOGLE BLOCK: the rating, stars, logo and "Ver reseñas en Google" link now
    live in HomeGoogleRating, shared with the city testimonials sections so the
    19 city landings carry the same proof. Its own CTA replaced the duplicate
    that used to sit under the cards here.

    CARDS: render the REAL testimonials — franchiseTestimonials[brandCode] from
    useFetchRentacarData() (same Supabase source as the legacy #testimonios),
    sliced to the 3 featured slots. The avatar uses derived initials over the
    brand circle (circulo-rojo.svg), matching the golden bicolor avatar.

    Gradient/utility note: section bg is the golden's flat gray-100.
  -->
  <!-- py-12 md:py-16: project section rhythm (sibling home sections use the same).
       The previous `section-padding` utility was undefined → 0px padding, which
       left the CTA flush against the next section on desktop (operator #7). -->
  <section id="google-reviews" class="py-12 md:py-16 bg-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Hero: rating + featured cards -->
      <div
        class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-10 lg:gap-12 items-center"
      >
        <!-- Rating block — shared with the city testimonials sections. -->
        <HomeGoogleRating />

        <!-- Featured cards — REAL testimonials -->
        <div class="grid sm:grid-cols-3 gap-4 lg:gap-5">
          <a
            v-for="testimonio in testimonios"
            :key="testimonio.user.name"
            :href="GOOGLE_REVIEWS_URL"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Ver la reseña de ${testimonio.user.name} en Google`"
            class="group flex flex-row sm:flex-col sm:items-center sm:text-center gap-4 sm:gap-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-all duration-200"
          >
            <!-- Bicolor avatar with derived initials -->
            <span
              class="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 sm:mb-3 inline-flex items-center justify-center"
            >
              <img
                src="/images/howitworks/circulo-rojo.svg"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 w-full h-full pointer-events-none select-none"
                draggable="false"
              >
              <span
                class="relative font-heading font-extrabold text-white text-sm sm:text-base tracking-tight"
                >{{ initials(testimonio.user.name) }}</span
              >
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 sm:justify-center">
                <p class="font-bold text-gray-900 text-base">
                  {{ testimonio.user.name }}
                </p>
              </div>
              <div class="flex gap-0.5 mt-1.5 sm:justify-center">
                <StarIcon v-for="i in 5" :key="i" cls="text-yellow-400 w-[15px] h-[15px]" />
              </div>
              <p class="mt-2.5 body-sm leading-relaxed">
                &ldquo;{{ testimonio.quote }}&rdquo;
              </p>
            </div>
          </a>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type Testimonial from "@rentacar-main/logic/utils/types/type/Testimonial";

/** components */
import { IconsStarIcon as StarIcon } from "#components";

// alquilame's real Google Business reviews profile (golden: cid confirmed REAL).
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps?cid=11824841242913553901";

// Same data source as the legacy #testimonios: franchiseTestimonials[brandCode]
// from useFetchRentacarData() (Supabase). Never a hardcoded testimonial list.
// The golden surfaces 3 featured cards.
const brandCode = useRuntimeConfig().public.rentacarFranchise as string;
const { franchiseTestimonials } = useFetchRentacarData();
const testimonios = computed<Testimonial[]>(
  () => (franchiseTestimonials[brandCode] ?? []).slice(0, 3)
);

// Derive 1-2 letter initials from the reviewer name for the bicolor avatar.
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}
</script>
