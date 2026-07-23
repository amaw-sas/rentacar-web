<template>
  <!--
    Requirements — golden parity (#requirements). Full-bleed photographic layout:
    a desktop bleed image with a left→right white scrim for legibility, a mobile
    banner with a bottom blur-to-white, and the copy column on the left.

    The requirement list is static marketing copy (no API source); it mirrors the
    golden verbatim. The "Reserva Ahora" CTA navigates internally to /reservas
    (client-side, same as the other reserve CTAs) instead of a full-page jump to
    the external brand home.

    Background asset lives in public/images/requirements/. Gradients use the v4
    bg-linear-to-* utility (F0 lesson: the deprecated v3 alias renders
    background-image:none with custom @theme tokens).
  -->
  <section
    id="requisitos"
    class="relative isolate overflow-hidden bg-white flex flex-col md:flex-row md:items-center md:min-h-[550px]"
  >
    <!-- Desktop: photographic bleed (hidden on mobile) -->
    <NuxtImg
      src="/images/requirements/requisitos-fondo-2.webp"
      alt=""
      width="1536"
      height="1024"
      loading="lazy"
      decoding="async"
      class="hidden md:block absolute inset-0 -z-10 w-full h-full object-cover object-[62%_18%]"
    />
    <!-- Desktop: legibility scrim (white left → transparent right) -->
    <div
      class="hidden md:block absolute inset-0 -z-10 bg-linear-to-r from-white from-0% via-white/70 via-[26%] to-transparent to-[48%]"
      aria-hidden="true"
    />
    <!-- Mobile: banner zoomed on the client, blurring toward the text -->
    <div
      class="md:hidden relative h-64 bg-no-repeat"
      style="background-image:url('/images/requirements/requisitos-fondo-2.webp'); background-size:185%; background-position:63% 14%;"
      role="img"
      aria-label="Clienta sonriente con las llaves de su carro de alquiler junto a un vehículo blanco moderno"
    >
      <!-- Blur to white toward the text -->
      <div
        class="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-white via-white/75 to-transparent"
        aria-hidden="true"
      />
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-0">
      <div class="max-w-xl">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-4" aria-hidden="true" />
        <h2
          class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-8"
        >
          Requisitos para Alquilar
        </h2>

        <ul class="space-y-3">
          <li
            v-for="(req, index) in requirements"
            :key="req"
            class="flex items-center gap-3 req-item"
            :style="{ animationDelay: `${index * 150}ms` }"
          >
            <span
              class="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                class="w-3 h-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span class="text-gray-700 text-base md:text-lg leading-snug">
              {{ req }}
            </span>
          </li>
        </ul>

        <div class="mt-9">
          <NuxtLink
            to="/reservas"
            class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-red-600 text-white font-semibold shadow-lg shadow-black/25 hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            Reserva Ahora
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">

// Golden requirements list (static marketing copy — no API source).
const requirements: string[] = [
  'Realizar una reserva previa.',
  'Cédula de ciudadanía o pasaporte vigente',
  'Licencia de conducción vigente',
  'Tarjeta de crédito a nombre del conductor',
  'Ser mayor de 18 años',
]
</script>
