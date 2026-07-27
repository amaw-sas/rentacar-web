<template>
  <!--
    F1 step07b — Partners "Empresas Aliadas" (issue #112). Port of the design's
    #partners section to Vue.

    CRITICAL fidelity note: the design renders each ally (Localiza / Avis + the
    sibling rentacar brands) as a STYLED TEXT span inside a CSS marquee — there
    are NO logo image assets in the dist, and none exist in this repo. So this
    section is text-only by design: no image tags, no asset sourcing.

    Config-driven brand names: the sibling brands are read from
    organization.otherbrands (NEVER hardcoded), so the marquee never inlines a
    rival brand literal or the brand's own name.

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
    background-image:none against custom @theme tokens). The brand footer-from /
    footer-to tokens drive the orange ramp. Typography uses the font-heading
    utility, as the design does.

    Contrast (issue #364, R1): this was the worst ratio in the app at 1.90:1, and
    the hover state was worse still than the resting one (2.36:1). Both are gone.

    Two things here are load-bearing and easy to undo by accident:

    1. NO transparency of any kind on this text — not text-white/75, and not an
       opacity utility either, which composites the same way. This ramp ends at
       #e35d0a, where even solid --color-on-brand only reaches 4.93:1; at 80%
       it drops to 3.93:1 and fails. Measure against the END of the gradient,
       never the start.
    2. The ally names lost their hover colour change rather than gaining a
       darker one. The marquee already pauses on hover — that is the real
       affordance, and it costs no contrast.
  -->
  <section
    id="partners"
    class="context-brand py-12 md:py-16 bg-linear-to-b from-footer-from to-footer-to"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm font-medium uppercase tracking-wider text-on-brand mb-2">
        Empresas Aliadas
      </p>
      <p class="mx-auto mb-10 max-w-2xl text-center text-base text-on-brand">
        Nos apoyamos en una red de aliados para darte más vehículos disponibles,
        en más ciudades y fechas.
      </p>

      <div class="marquee group relative overflow-hidden">
        <!-- Edge fades (v4 linear utility; brand footer tokens) -->
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
              class="whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight text-on-brand md:text-3xl"
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
              class="whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight text-on-brand md:text-3xl"
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
// External partners are TEXT only (the design ships no logo assets). The sibling
// rentacar brands come from organization.otherbrands so no brand literal is
// inlined here. Order: external networks first, then the sibling brands.
const { organization } = useAppConfig()

const allies = computed<readonly string[]>(() => [
  'Localiza',
  'Avis',
  ...organization.otherbrands,
])
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
