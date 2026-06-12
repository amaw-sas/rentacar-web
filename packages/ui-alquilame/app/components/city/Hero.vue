<template>
  <!--
    F2 city hero — restyle of the design's #hero (bg-linear-to-br red gradient,
    city-targeted h1 left / Searcher engine right). PRESERVED untouched:
      - The Searcher engine: same component, same data-testid
        (pickup-location-test / return-location-test), same navigation to
        /{city}/buscar-vehiculos/... It stays wrapped in <ClientOnly> with a
        fixed-height fallback (PlaceholdersSearcher) so hydration causes no
        layout shift (issue #109 — no current-date call baked into SSR/ISR
        markup).
      - The #searcher scroll target: the in-page anchor the UnableCategoryCard
        CTAs ("Probar otras fechas" / "Cambiar sucursal") and the city
        HomeContact "Reserva Ahora" CTA (reserveAnchor) scroll to.
      - The #41 secret pin: copy-to-WhatsApp is an operator-only action, so it
        stays an INERT aria-hidden span (never a focusable control) — outside
        the accessible name of the <h1> (WCAG 2.5.3) and never exposed via
        aria-label/title.

    Gradient guard (F1/F0 lesson): the red gradient MUST use the v4
    bg-linear-to-* utility built from the hero-from/hero-to @theme tokens; the
    broken v3 alias renders background-image:none with custom tokens. The
    section sets [--ctx-text-primary:#fff] so .heading-* headings render WHITE
    on the red background (F1 contrast bug).
  -->
  <section
    id="hero"
    class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
  >
    <!--
      Scroll target for "Probar otras fechas" / "Cambiar sucursal" CTAs in
      UnableCategoryCard and the city HomeContact "Reserva Ahora" CTA. Kept as a
      dedicated anchor so #hero (the section) and #searcher (the engine) stay
      independent and scroll-mt-20 clears the sticky header.
    -->
    <div id="searcher" aria-hidden="true" class="absolute scroll-mt-20" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <!-- Text column -->
        <div class="text-center lg:text-left">
          <!-- Trust signal: "4.9 reviews" star badge (design hero) -->
          <div
            class="flex flex-row space-x-0.5 justify-center lg:justify-start items-center text-sm text-white mb-3"
          >
            <StarIcon v-for="i in [1, 2, 3, 4, 5]" :key="i" cls="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span class="ml-2">4.9 reviews</span>
          </div>

          <!--
            City-targeted h1 (SEO). The pin is an inert <span aria-hidden> INSIDE
            the <h1> but excluded from its accessible name — it carries no text
            and is not focusable, so screen readers announce only
            "Alquiler de carros en {city}". Issue #41.
          -->
          <h1 class="heading-hero text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.1]">
            Alquiler de carros en {{ city?.name }}
            <span
              aria-hidden="true"
              class="inline-flex align-middle"
              @click="copySearchToWhatsapp"
            >
              <LocationIcon cls="text-white size-7 md:size-8 lg:size-10 -translate-y-0.5" />
            </span>
          </h1>

          <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
            Consulta disponibilidad y precios. Elige ciudad, fechas y horarios y
            renta un vehículo por días, semanas o el tiempo que necesites.
          </p>
        </div>

        <!-- Engine column — Searcher preserved untouched -->
        <div class="flex items-center justify-center">
          <!--
            CLS guard (issue #109): reserve the Searcher footprint with a fixed
            height so the ClientOnly fallback and the hydrated form occupy the
            same box — no shift, and no current-date call in the SSR/ISR markup.
            Desktop and mobile keep distinct heights matching the form layout.
          -->
          <div class="w-full max-w-md mx-auto">
            <div class="hidden lg:block h-[410px]">
              <ClientOnly>
                <Searcher />
                <template #fallback>
                  <PlaceholdersSearcher />
                </template>
              </ClientOnly>
            </div>
            <div class="lg:hidden h-[360px]">
              <ClientOnly>
                <Searcher />
                <template #fallback>
                  <PlaceholdersSearcher />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type { City } from '@rentacar-main/logic/utils'

/** imports */
import { defineAsyncComponent } from 'vue'
import {
  IconsStarIcon as StarIcon,
  IconsLocationIcon as LocationIcon,
} from '#components'

/** props */
defineProps<{
  city: City
}>()

/**
 * Secret operator action (issue #41): copies the current search params into a
 * prefilled WhatsApp message. Wired to the inert <span aria-hidden> pin above —
 * never a focusable control, so it never enters the tab order or the a11y tree.
 */
const { copyToWhatsapp: copySearchToWhatsapp } = useShareSearchParams()

const Searcher = defineAsyncComponent(() => import('../Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../Placeholders/Searcher.vue'),
)
</script>
