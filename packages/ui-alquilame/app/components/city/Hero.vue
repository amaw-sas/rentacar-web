<template>
  <!--
    City hero — mirrors the home hero: banner texture over the brand-red band,
    trust badge + city h1 + subtitle + WhatsApp CTA on the left, the shared
    car+video visual on the right (landing) or the Searcher engine (results).
    PRESERVED untouched:
      - The Searcher engine: same component, same data-testid
        (pickup-location-test / return-location-test), same navigation to
        /{city}/buscar-vehiculos/... It stays wrapped in <ClientOnly> with a
        fixed-height fallback (PlaceholdersSearcher) so hydration causes no
        layout shift (issue #109 — no current-date call baked into SSR/ISR
        markup).
      - The #searcher scroll target: the in-page anchor the UnableCategoryCard
        CTAs ("Probar otras fechas" / "Probar otra sucursal cercana") and the
        city HomeContact "Reserva Ahora" CTA (reserveAnchor) scroll to.
    REMOVED: the #41 location pin inside the <h1>, and with it the operator-only
    copy-the-search-to-WhatsApp shortcut it carried. It was an aria-hidden span
    with a @click, so no keyboard user could ever reach it; if that shortcut is
    still wanted it needs a real, focusable control.

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

    <!-- Textured banner pattern over the red gradient — same treatment as the
         home hero, so a city landing and the home read as one site. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-center bg-cover opacity-60"
      style="background-image: url('/images/fondo-banner.webp')"
    />

    <!-- Spacing mirrors the home hero exactly: py-5 (not py-10) so the band does
         not open with 40px of dead red above the badge, and gap-3 (not gap-10)
         so the visual sits close under the CTA on mobile. -->
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-12 w-full">
      <div class="grid lg:grid-cols-2 gap-3 lg:gap-10 items-center">
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
            City-targeted h1 (SEO). Same ramp as the home hero, spelled out:
            the shared display utility applies lg:text-7xl + leading-tight and beat
            both the declared size and leading here, exactly as it did on the
            home. The location pin that used to sit inside the h1 is gone — it
            was decorative, and it carried a click handler no one could reach
            with a keyboard.
          -->
          <h1
            class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold font-heading text-white leading-[1.1]"
          >
            Alquiler de carros en {{ city?.name }}
          </h1>

          <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
            Consulta disponibilidad y precios. Elige ciudad, fechas y horarios y
            renta un vehículo por días, semanas o el tiempo que necesites.
          </p>

          <!-- Single CTA: WhatsApp, same treatment as the home hero. Landing
               mode only — in results mode the Searcher is the action. -->
          <div
            v-if="mode !== 'results'"
            class="mt-6 flex flex-row items-stretch gap-3 justify-center lg:justify-start"
          >
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contáctanos por WhatsApp"
              class="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 text-base font-semibold rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>

        <!--
          Engine column — mode-aware (F3):
            - mode === 'results': the Searcher engine, preserved untouched
              (same component → same data-testid, #109 CLS guard). This is the
              buscar-vehiculos results route refining in-situ.
            - mode === 'landing': NO Searcher; the shared hero visual (car +
              corner video), with the WhatsApp CTA in the text column. The city
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
             that used to hold a lone CTA on flat red)
             that navigates (SPA) to /reservas. NO Searcher engine here
             (SCEN-F3-03). The car image uses an aspect-ratio box → footprint
             reserved (no CLS); eager + high fetchpriority as the landing LCP. -->
        <!-- landing — the SAME visual the home hero renders (car cutout + corner
             video), via the shared component. Replaces the lone vehicle photo
             card and its navigation CTA: WhatsApp now lives in the text
             column, matching the home. -->
        <HomeHeroVisual
          v-else
          :car-alt="`Carro disponible para alquilar en ${city?.name}`"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type { City } from '@rentacar-main/logic/utils'

/** imports */
import { defineAsyncComponent } from 'vue'
import { IconsStarIcon as StarIcon } from '#components'

/** props */
withDefaults(
  defineProps<{
    city: City
    /**
     * Hero engine mode (F3 — issue #112):
     *   - 'results' (default, fail-safe): mounts the <Searcher> engine to refine
     *     a search in-situ (buscar-vehiculos route).
     *   - 'landing': marketing-only city landing — no engine; the shared hero
     *     visual plus the WhatsApp CTA.
     * Each page file passes this explicitly (no router-based detection); if a
     * caller forgets, the engine stays present rather than silently breaking.
     */
    mode?: 'landing' | 'results'
  }>(),
  { mode: 'results' },
)

// NOTE: the hero used to carry a hidden operator action (issue #41) — clicking
// the location pin inside the h1 copied the current search params into a
// prefilled WhatsApp message. The pin was removed by request, so that shortcut
// is gone with it; `useShareSearchParams` is no longer wired here. Reinstate it
// on a REAL, focusable control if the operator still needs it.

const { franchise } = useAppConfig()


const Searcher = defineAsyncComponent(() => import('../Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../Placeholders/Searcher.vue'),
)
</script>
