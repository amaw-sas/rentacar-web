<template>
  <!--
    Hero — golden parity (astro-alquilame #hero). Red gradient bg via the v4
    bg-linear-to-* utility (custom @theme tokens render background-image:none
    with the v3 alias — F0 lesson). Headline left / visual card right.

    Golden's visual column is a looping <video> (autoplay/muted/loop/playsinline
    + poster). We reproduce the exact golden card (max-w-lg, aspect-[16/9],
    rounded + shadow + ring) — the aspect box reserves space so the poster→video
    swap never shifts layout (no CLS). Assets live in public/videos/.

    CTAs match the golden exactly: "Ver Precios" (#fleet) + WhatsApp. WhatsApp
    is a CONTACT CTA pointing at franchise.whatsapp (already a full
    https://wa.me/... URL — never re-wrapped); the golden's hardcoded number is
    the same brand line.
  -->
  <section
    id="hero"
    class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <!-- Text + CTA column -->
        <div class="text-center lg:text-left">
          <h1
            class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold font-heading text-white leading-[1.1]"
          >
            Alquiler de Carros en Colombia al Mejor Precio
          </h1>
          <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
            Sin anticipos, sin fila. Flota con menos de 2 años y mantenimiento incluido.
            Reserva por WhatsApp en {{ cityCount }} ciudades.
          </p>

          <!-- CTA row: "Ver Precios" (jumps to #fleet) + contact WhatsApp -->
          <div class="mt-6 flex flex-row items-stretch gap-3 justify-center lg:justify-start">
            <a
              href="#fleet"
              class="inline-flex items-center justify-center px-6 sm:px-7 py-3.5 text-base font-semibold rounded-full bg-white text-red-700 hover:bg-gray-100 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
            >
              Ver Precios
            </a>
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contáctanos por WhatsApp"
              class="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 text-base font-semibold rounded-full bg-[#090] text-white hover:brightness-110 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
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

        <!-- Visual column (golden card, aspect-[16/9] reserves space → no CLS) -->
        <div class="flex items-center justify-center">
          <!--
            CLS guard: the aspect-[16/9] utility rule ships in Nuxt's JS-injected
            stylesheet (not the inlined critical CSS), and the <video> below has
            no width/height attrs, so pre-CSS the card falls back to the 300×150
            video default and shifts when the real ratio applies (home CLS 0.129).
            The INLINE aspect-ratio reserves the box in the SSR HTML from the
            first paint, independent of stylesheet timing.
          -->
          <div
            class="w-full max-w-lg aspect-[16/9] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-white/10"
            style="aspect-ratio: 16 / 9"
          >
            <video
              class="w-full h-full object-cover"
              poster="/videos/hero-poster.jpg"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
              aria-label="Video promocional de Alquilame Colombia"
            >
              <source src="/videos/hero.webm" type="video/webm" />
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

// Live active-city count (Supabase) for the subheading — tracks the dashboard.
const cityCount = useCityCount()
</script>
