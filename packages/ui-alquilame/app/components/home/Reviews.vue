<template>
  <!--
    F1 reviews — restyle of the design's #google-reviews (white rounded-2xl
    review cards, yellow star row, gray quote) using the REAL testimonials.

    DATA (honest): the cards render `franchiseTestimonials[brandCode]` — the same
    Supabase source the legacy #testimonios used. The mockup's hardcoded marketing
    rating block, its external CID review links and its reviewer-tier badges are
    FICTION baked into the design build → NOT reproduced. No rating number is
    surfaced here; the aggregate-rating schema composable stays in index.vue,
    untouched (pre-existing debt, no F1 regression).

    Gradient uses the v4 bg-linear-to-* utility (F0 lesson: the broken v3 alias
    with custom @theme tokens renders background-image:none).
  -->
  <section
    id="testimonios"
    class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-12 md:py-16"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-10 md:mb-12">
        <div
          class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto"
          aria-hidden="true"
        />
        <h2 class="heading-section text-3xl md:text-4xl text-gray-900 leading-tight mb-3">
          Lo que dicen nuestros clientes
        </h2>
        <p class="text-base text-gray-600">
          Descubre por qué somos la opción preferida para alquilar carros en
          Colombia: atención cercana, precios competitivos y un proceso sin
          complicaciones.
        </p>
      </div>

      <!-- Review cards — real testimonials -->
      <div
        v-if="testimonios.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
      >
        <article
          v-for="testimonio in testimonios"
          :key="testimonio.user.name"
          class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <!-- Author + avatar (real data via UUser) -->
          <!-- CLS fix: reserve space for the avatar (48x48 = size 3xl) -->
          <div class="min-h-[48px]">
            <UUser
              size="3xl"
              v-bind="testimonio.user"
              :ui="userUIConfig"
              loading="lazy"
            />
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
  </section>
</template>

<script setup lang="ts">
/** types */
import type Testimonial from "@rentacar-main/logic/utils/types/type/Testimonial";

/** components */
import { IconsStarIcon as StarIcon } from "#components";

// Same data source as the legacy #testimonios: franchiseTestimonials[brandCode]
// from useFetchRentacarData() (Supabase). Never a hardcoded testimonial list.
const brandCode = useRuntimeConfig().public.rentacarFranchise as string;
const { franchiseTestimonials } = useFetchRentacarData();
const testimonios = computed<Testimonial[]>(
  () => franchiseTestimonials[brandCode] ?? []
);

const userUIConfig = {
  name: "text-gray-900 font-bold",
  description: "text-gray-500",
};
</script>
