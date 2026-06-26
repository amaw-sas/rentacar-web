<template>
  <!--
    City hero — brand-red gradient band. Left column: trust badge + city-targeted
    h1 + subtitle + trust chips. Right column: the Searcher engine (results mode)
    OR a vehicle-photo visual card + "Reservar ahora" CTA (landing mode). The lone
    floating CTA on flat red read as too bare; the car card mirrors the home hero's
    visual-card language and soft background-glow blobs add depth. PRESERVED untouched:
      - The Searcher engine: same component, same data-testid
        (pickup-location-test / return-location-test), same navigation to
        /{city}/buscar-vehiculos/... It stays wrapped in <ClientOnly> with a
        fixed-height fallback (PlaceholdersSearcher) so hydration causes no
        layout shift (issue #109 — no current-date call baked into SSR/ISR
        markup).
      - The #searcher scroll target: the in-page anchor the UnableCategoryCard
        CTAs ("Probar otras fechas" / "Probar otra sucursal cercana") and the
        city HomeContact "Reserva Ahora" CTA (reserveAnchor) scroll to.
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
      Scroll target for "Probar otras fechas" / "Probar otra sucursal cercana"
      CTAs in UnableCategoryCard and the city HomeContact "Reserva Ahora" CTA. Kept as a
      dedicated anchor so #hero (the section) and #searcher (the engine) stay
      independent and scroll-mt-20 clears the sticky header.
    -->
    <div id="searcher" aria-hidden="true" class="absolute scroll-mt-20" />

    <!--
      Atmosphere — two soft radial glow blobs give the flat red band depth.
      Purely decorative (aria-hidden, pointer-events-none) and clipped by the
      section's overflow-hidden; they sit behind the relative content grid.
    -->
    <div aria-hidden="true" class="pointer-events-none absolute -top-24 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-40 -left-24 w-[24rem] h-[24rem] rounded-full bg-brand-900/40 blur-3xl"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
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

          <!--
            Trust chips (both modes) — restate the brand promises and give the
            text column weight against the visual/engine column. Inert <li>/<span>
            only: no controls (#41), no Date baked into markup (#109).
          -->
          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm font-medium text-white/90">
            <li v-for="chip in trustChips" :key="chip" class="inline-flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-4 h-4 shrink-0 text-white"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ chip }}
            </li>
          </ul>
        </div>

        <!--
          Engine column — mode-aware (F3):
            - mode === 'results': the Searcher engine, preserved untouched
              (same component → same data-testid, #109 CLS guard). This is the
              buscar-vehiculos results route refining in-situ.
            - mode === 'landing': NO Searcher; a primary "Reservar ahora" CTA
              navigates (SPA) to the centralized /reservas search page. The city
              landing is marketing-only — the search engine moved out of the hero.
          The empty <div id="searcher"> anchor above is kept in BOTH modes
          (harmless in landing; preserves the #searcher scroll-target contract).
        -->
        <div v-if="mode === 'results'" class="flex items-center justify-center">
          <!--
            CLS guard (issue #109): reserve the Searcher footprint with a fixed
            height so the ClientOnly fallback and the hydrated form occupy the
            same box — no shift, and no current-date call in the SSR/ISR markup.
            Desktop and mobile keep distinct heights matching the form layout.
          -->
          <div class="w-full max-w-lg mx-auto">
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
        <!-- landing — marketing-only: a vehicle-photo visual card (fills the column
             that used to hold a lone CTA on flat red) + the "Reservar ahora" CTA
             that navigates (SPA) to /reservas. NO Searcher engine here
             (SCEN-F3-03). The car image uses an aspect-ratio box → footprint
             reserved (no CLS); eager + high fetchpriority as the landing LCP. -->
        <div v-else class="flex flex-col items-center gap-5">
          <div
            class="relative w-full max-w-lg aspect-[16/10] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/15"
          >
            <NuxtImg
              src="/images/vehicles/premium.jpg"
              :alt="`Carro disponible para alquilar en ${city?.name}`"
              width="800"
              height="500"
              sizes="sm:90vw lg:512px"
              loading="eager"
              fetchpriority="high"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <NuxtLink
            to="/reservas"
            class="inline-flex items-center justify-center rounded-full bg-white text-hero-from font-semibold px-8 py-4 text-base md:text-lg shadow-lg hover:bg-white/90 transition-colors"
          >
            Reservar ahora
          </NuxtLink>
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
withDefaults(
  defineProps<{
    city: City
    /**
     * Hero engine mode (F3 — issue #112):
     *   - 'results' (default, fail-safe): mounts the <Searcher> engine to refine
     *     a search in-situ (buscar-vehiculos route).
     *   - 'landing': marketing-only city landing — no engine, a "Reservar ahora"
     *     CTA navigates to the centralized /reservas page.
     * Each page file passes this explicitly (no router-based detection); if a
     * caller forgets, the engine stays present rather than silently breaking.
     */
    mode?: 'landing' | 'results'
  }>(),
  { mode: 'results' },
)

/**
 * Secret operator action (issue #41): copies the current search params into a
 * prefilled WhatsApp message. Wired to the inert <span aria-hidden> pin above —
 * never a focusable control, so it never enters the tab order or the a11y tree.
 */
const { copyToWhatsapp: copySearchToWhatsapp } = useShareSearchParams()

/** Static brand promises shown as hero trust chips (no Date — #109 SSR/ISR safe). */
const trustChips = ['Sin anticipos', 'Hasta 60% de descuento', 'Disponible los 7 días']

const Searcher = defineAsyncComponent(() => import('../Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../Placeholders/Searcher.vue'),
)
</script>
