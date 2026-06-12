<template>
  <!--
    F1 contact — new CTA section ported from the design's #contact band.

    Data sources (NEVER the mockup's hardcoded numbers — F1 rule):
      - WhatsApp CTA → franchise.whatsapp (already a full deep-link URL,
        consumed as-is, never re-wrapped).
      - Phone CTA → franchise.phone, wrapped in a tel: link (distinct number from
        WhatsApp).
      - "Reserva Ahora" reuses the internal engine: it anchors back to #hero
        (city selector) instead of the design's external reservation site —
        same fidelity principle applied in Hero.vue.

    Gradient uses the v4 bg-linear utility; the deprecated v3 alias
    renders background-image:none against the custom @theme tokens (F0 lesson).
    Headings adopt the project `.heading-*` utilities (→ Plus Jakarta), closing
    the F0-03 font debt instead of the design's raw font-heading.
  -->
  <section
    id="contact"
    class="relative isolate overflow-hidden bg-linear-to-br from-hero-from to-hero-to py-14 md:py-20 lg:py-24 [--ctx-text-primary:#fff]"
  >
    <!-- Subtle dotted texture overlay -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]"
      aria-hidden="true"
    />
    <!-- Depth vignette -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_0_200px_70px_rgba(74,0,11,0.45)]"
      aria-hidden="true"
    />

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="max-w-2xl mx-auto text-center lg:mx-0 lg:text-left">
        <h2 class="heading-section text-3xl md:text-4xl font-extrabold text-white mb-5">
          Reserva tu Carro Hoy
        </h2>
        <p class="text-lg md:text-xl text-white/85 mb-8">
          Sin anticipos. Sin cargos ocultos. Cancela gratis hasta 24 horas antes.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
          <!-- Reserve → internal engine; anchor is configurable per host page
               (home: #hero / city landing: #searcher) via the reserveAnchor prop. -->
          <a
            :href="reserveAnchor"
            class="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 text-lg font-semibold rounded-full bg-white text-red-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Reserva Ahora
          </a>

          <!-- Contact via WhatsApp → franchise.whatsapp (full URL, not re-wrapped) -->
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Habla con un asesor por WhatsApp"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 text-lg font-semibold rounded-full bg-[#25D366] text-white hover:brightness-110 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
          >
            <WhatsappIcon cls="size-5" />
            Habla con un Asesor
          </a>
        </div>

        <!-- Phone CTA → franchise.phone (distinct from WhatsApp) -->
        <p class="mt-6 text-white/85">
          o llámanos al
          {{ ' ' }}
          <a
            :href="`tel:${franchise.phone}`"
            class="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white transition-colors"
          >
            {{ franchise.phone }}
          </a>
        </p>

        <!-- Trust badges -->
        <ul class="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3">
          <li class="flex items-center gap-2 text-white/90 text-sm font-medium">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Sin anticipos
          </li>
          <li class="flex items-center gap-2 text-white/90 text-sm font-medium">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Cancela gratis 24h
          </li>
          <li class="flex items-center gap-2 text-white/90 text-sm font-medium">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            Soporte 24/7
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconsWhatsappIcon as WhatsappIcon } from '#components'

// "Reserva Ahora" anchor target. Defaults to the home's city-selector hero
// (#hero); the city landing passes '#searcher' (its hero has no #hero id).
withDefaults(defineProps<{ reserveAnchor?: string }>(), { reserveAnchor: '#hero' })

const { franchise } = useAppConfig()
</script>
