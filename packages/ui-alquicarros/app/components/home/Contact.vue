<template>
  <!--
    contact — CTA "Reserva tu Carro Hoy", paridad visual con golden 10-contact.html.

    Decisión de directiva: PARIDAD VISUAL → botones (Reserva Ahora + WhatsApp),
    NO formulario. Conserva los links reales:
      - "Reserva Ahora" → motor interno; el ancla es configurable por página
        host (home: #hero / city landing: #searcher) vía reserveAnchor.
      - WhatsApp → franchise.whatsapp (URL completa, jamás re-envuelta).

    Background: réplica del gradiente del golden re-skinned a NARANJA (radiales
    cálidos + linear naranja-ámbar) como inline style — los radiales no son
    expresables con utilidades Tailwind. Botón WhatsApp = bg-[#090] (único verde
    legítimo de marca). SUV transparente flota sobre el naranja (desktop alineado
    al contenedor, móvil full-width debajo), igual al golden.
  -->
  <section
    id="contact"
    class="relative isolate overflow-hidden flex items-center lg:min-h-[520px] py-12 lg:py-0 [--ctx-text-primary:#fff]"
    :style="bgStyle"
  >
    <!-- Capa de textura sutil (puntos) -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]"
      aria-hidden="true"
    />
    <!-- Glow difuso detrás del SUV -->
    <div
      class="pointer-events-none absolute right-[14%] top-1/2 -z-10 hidden h-[460px] w-[460px] -translate-y-1/2 rounded-full bg-[#ff6b1c]/45 blur-[95px] lg:block"
      aria-hidden="true"
    />
    <!-- Viñeta de profundidad -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_0_200px_70px_rgba(67,20,7,0.45)]"
      aria-hidden="true"
    />
    <!-- Sheen superior -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-white/15"
      aria-hidden="true"
    />

    <!-- Desktop: composición transparente alineada al contenedor → margen
         derecho = margen izquierdo del texto -->
    <div class="hidden lg:block absolute inset-0 -z-10" aria-hidden="true">
      <div class="relative mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <NuxtImg
          src="/images/cta/cta-suv.webp"
          alt=""
          width="1152"
          height="684"
          sizes="lg:600px"
          loading="lazy"
          decoding="async"
          class="absolute right-0 top-0 h-full w-[44%] object-contain object-right drop-shadow-[0_25px_45px_rgba(0,0,0,0.35)] xl:w-[52%]"
        />
      </div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="max-w-lg mx-auto text-center lg:mx-0 lg:text-left">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-white mb-5">
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
            class="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 text-lg font-semibold rounded-full bg-white text-brand-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Reserva Ahora
          </a>

          <!-- Contact via WhatsApp → franchise.whatsapp (full URL, not re-wrapped).
               bg-[#090] = único verde legítimo de marca. -->
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Habla con un asesor por WhatsApp"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 text-lg font-semibold rounded-full bg-[#090] text-white hover:brightness-110 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
          >
            <WhatsappIcon cls="size-5" />
            Habla con un Asesor
          </a>
        </div>

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
// (#hero); the city landing passes '#searcher'.
withDefaults(defineProps<{ reserveAnchor?: string }>(), { reserveAnchor: '#hero' })

const { franchise } = useAppConfig()

// golden 10-contact.html background re-skinned to NARANJA: a radial-gradient
// stack (warm orange glows) over a linear orange→amber base. Radials aren't
// Tailwind utilities → bound inline.
const bgStyle =
  'background:' +
  'radial-gradient(60% 110% at 73% 42%, rgba(255,146,96,0.72) 0%, rgba(255,107,28,0.40) 34%, rgba(255,107,28,0) 62%),' +
  'radial-gradient(55% 90% at 6% 12%, rgba(255,126,80,0.34) 0%, rgba(255,126,80,0) 55%),' +
  'radial-gradient(135% 115% at 50% 138%, rgba(67,20,7,0.74) 0%, rgba(67,20,7,0) 58%),' +
  'linear-gradient(122deg, #ff8a00 0%, #e35d0a 47%, #7c2d12 100%);'
</script>
