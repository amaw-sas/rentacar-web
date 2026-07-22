<template>
  <!--
    Hero — textured red banner + car cutout (parity with astro-alquilame). Red
    gradient via the v4 bg-linear-to-* utility, overlaid with the fondo-banner
    pattern. The car (carro_hero.webp, alpha) is the main visual; a small corner
    video loops muted and plays WITH audio on click.

    Perf: the car webp reserves space via width/height (no CLS). The muted preview
    is off the critical path — it activates after the hero is visible + browser
    idle (skipped under prefers-reduced-motion / data-saver). The full audio video
    is preload="none" → it downloads only when the user clicks "Activar sonido".
  -->
  <section
    id="hero"
    class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
  >
    <!-- Textured banner pattern over the red gradient. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-center bg-cover opacity-60"
      style="background-image: url('/images/fondo-banner.webp')"
    />
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-12 w-full">
      <div class="grid lg:grid-cols-2 gap-3 lg:gap-10 items-center">
        <div class="text-center lg:text-left">
          <!-- Trust signal: "4.9 reviews" star badge (parity with the city hero). -->
          <div
            class="flex flex-row space-x-0.5 justify-center lg:justify-start items-center text-sm text-white mb-3"
          >
            <IconsStarIcon v-for="i in [1, 2, 3, 4, 5]" :key="i" cls="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span class="ml-2">4.9 reviews</span>
          </div>

          <!-- The ramp is spelled out instead of leaning on `.heading-hero`:
               that utility applies `text-4xl md:text-5xl lg:text-7xl
               leading-tight`, which silently beat both the size ramp declared
               here and `leading-[1.1]` — the headline rendered at 72px/90px
               while the markup said 48px/1.1. Explicit wins are debuggable. -->
          <h1
            class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold font-heading text-white leading-[1.1]"
          >
            Alquiler de Carros en Colombia
          </h1>
          <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
            Sin anticipos, sin fila. Flota con menos de 2 años y mantenimiento incluido.
            Reserva por WhatsApp en {{ cityCount }} ciudades.
          </p>

          <!-- Single CTA: WhatsApp. The former secondary pill only scrolled to
               the fleet section — a destination the page already reaches by
               scrolling — while competing for attention with the action that
               actually converts. -->
          <div class="mt-6 flex flex-row items-stretch gap-3 justify-center lg:justify-start">
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

        <HomeHeroVisual />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()
const cityCount = useCityCount()
</script>
