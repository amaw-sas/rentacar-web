<template>
  <!--
    F1 step07b — Partners "Empresas Aliadas" (issue #112). Port of the design's
    #partners section to Vue.

    CRITICAL fidelity note: the design renders each ally (Localiza / Avis /
    Alquicarros / Alquilatucarro) as a STYLED TEXT span inside a CSS marquee —
    there are NO logo image assets in the dist, and none exist in this repo.
    So this section is text-only by design: no image tags, no asset sourcing.

    Marquee mechanics (matching the design):
      - The ally list is rendered TWICE back-to-back in one flex track; the track
        animates translateX(0 → -50%), so when the first copy scrolls fully out
        the second copy sits exactly where the first started → a seamless loop.
      - The first copy is the real content; the duplicate is aria-hidden so a
        screen reader announces each ally once.
      - Hover pauses the animation; prefers-reduced-motion disables it and centers
        the (single visible) row — same accommodation as the design.

    Gradient guard (F0 lesson): the section + edge fades use the v4 bg-linear-to-*
    utility, never the broken v3 gradient alias (which renders
    background-image:none against custom @theme tokens). The design's
    #CB032C → #A00425 maps exactly to our footer-from / footer-to tokens.
    Typography uses the font-heading utility (Plus Jakarta), as the design does.
  -->
  <section
    id="partners"
    class="py-12 md:py-16 bg-linear-to-b from-footer-from to-footer-to"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm font-medium uppercase tracking-wider text-white/80 mb-2">
        Empresas Aliadas
      </p>
      <p class="mx-auto mb-10 max-w-2xl text-center text-base text-white/75">
        Nos apoyamos en una red de aliados para darte más vehículos disponibles,
        en más ciudades y fechas.
      </p>

      <div class="marquee group relative overflow-hidden">
        <!-- Edge fades (v4 linear utility; footer tokens === design hex) -->
        <div
          class="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-footer-from to-transparent md:w-28"
        ></div>
        <div
          class="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-footer-to to-transparent md:w-28"
        ></div>

        <div class="marquee-track flex w-max items-center gap-10 md:gap-16">
          <!-- Real copy -->
          <div v-for="ally in allies" :key="`a-${ally}`" class="flex-shrink-0">
            <span
              class="whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight text-white/75 transition-colors duration-300 hover:text-white md:text-3xl"
            >
              {{ ally }}
            </span>
          </div>
          <!-- Seamless-loop duplicate (hidden from assistive tech) -->
          <div
            v-for="ally in allies"
            :key="`b-${ally}`"
            class="flex-shrink-0"
            aria-hidden="true"
          >
            <span
              class="whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight text-white/75 transition-colors duration-300 hover:text-white md:text-3xl"
            >
              {{ ally }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Ally names are TEXT only — the design ships no logo assets, so they live as a
// local list here. Order matches the design's #partners marquee.
const allies: readonly string[] = [
  'Localiza',
  'Avis',
  'Alquicarros',
  'Alquilatucarro',
]
</script>

<style scoped>
/*
  Track holds two copies of the ally list; translating it by -50% advances it by
  exactly one copy width, so the loop is seamless regardless of viewport.
*/
@keyframes partners-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.marquee-track {
  animation: partners-marquee 30s linear infinite;
  will-change: transform;
}

.marquee:hover .marquee-track {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    justify-content: center;
  }
}
</style>
