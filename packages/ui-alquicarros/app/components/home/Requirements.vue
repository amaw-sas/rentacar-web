<template>
  <!--
    Requirements — mirrored photographic layout (#requisitos). The desktop bleed
    image frames the subject on the LEFT, with a right→left white scrim so the
    copy column reads on the RIGHT. The mobile banner keeps the top-image /
    bottom-blur stack. Each requirement carries a distinct semantic lucide icon
    (UIcon) in a brand-tinted tile instead of the old uniform green check.

    The requirement list is static marketing copy (no API source); texts mirror
    the golden verbatim. The "Reserva Ahora" CTA is wired to the brand
    reservation website (NOT hardcoded), so it stays brand-correct across the
    shared codebase.

    Background asset lives in public/images/requirements/. Gradients use the v4
    bg-linear-to-* utility (F0 lesson: the deprecated v3 alias renders
    background-image:none with custom @theme tokens).
  -->
  <section
    id="requisitos"
    class="relative isolate overflow-hidden bg-white flex flex-col md:flex-row md:items-center md:min-h-[550px]"
  >
    <!-- Desktop: photographic bleed, subject framed left (hidden on mobile) -->
    <NuxtImg
      src="/images/requirements/requisitos-derecha.webp"
      alt=""
      width="1536"
      height="838"
      loading="lazy"
      decoding="async"
      class="hidden md:block absolute inset-0 -z-10 w-full h-full object-cover object-[30%_20%]"
    />
    <!-- Desktop: legibility scrim (transparent left → white right) -->
    <div
      class="hidden md:block absolute inset-0 -z-10 bg-linear-to-l from-white from-0% via-white/70 via-[26%] to-transparent to-[48%]"
      aria-hidden="true"
    />
    <!-- Mobile: banner zoomed on the client, blurring toward the text -->
    <div
      class="md:hidden relative h-64 bg-no-repeat"
      style="background-image:url('/images/requirements/requisitos-derecha.webp'); background-size:185%; background-position:30% 14%;"
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
      <div class="max-w-xl ml-auto text-right">
        <div class="h-1 w-10 rounded-full bg-brand-600 mb-4 ml-auto" aria-hidden="true" />
        <h2
          class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-8"
        >
          Requisitos para Alquilar
        </h2>

        <ul class="space-y-3">
          <li
            v-for="(req, index) in requirements"
            :key="req.text"
            class="flex flex-row-reverse items-center gap-3 req-item"
            :style="{ animationDelay: `${index * 150}ms` }"
          >
            <span
              class="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-600/10 text-brand-800 flex items-center justify-center"
              aria-hidden="true"
            >
              <UIcon :name="req.icon" class="size-5" />
            </span>
            <span class="text-gray-700 text-base md:text-lg leading-snug">
              {{ req.text }}
            </span>
          </li>
        </ul>

        <div class="mt-9 flex justify-end">
          <a
            :href="reservation.website"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-600 text-gray-900 font-semibold shadow-lg shadow-black/25 hover:bg-brand-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            Reserva Ahora
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { reservation } = useAppConfig()

// Golden requirements list (static marketing copy — no API source). Each item
// pairs its verbatim text with a semantic lucide icon.
interface Requirement {
  text: string
  icon: string
}

const requirements: Requirement[] = [
  { text: 'Realizar una reserva previa.', icon: 'i-lucide-calendar-check' },
  { text: 'Cédula de ciudadanía o pasaporte vigente', icon: 'i-lucide-id-card' },
  { text: 'Licencia de conducción vigente', icon: 'i-lucide-car-front' },
  { text: 'Tarjeta de crédito a nombre del conductor', icon: 'i-lucide-credit-card' },
  { text: 'Ser mayor de 18 años', icon: 'i-lucide-user-round-check' },
]
</script>
