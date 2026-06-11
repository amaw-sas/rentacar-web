<template>
  <!--
    F1 how-it-works — new presentational section ported from the design's
    #how-it-works (3 steps). Pure marketing copy from the design.

    Headings adopt the project `.heading-*` utilities (→ Plus Jakarta) instead
    of the design's raw `font-heading` (closes F0-03 debt). Gradients use the
    v4 linear gradient utility — never the legacy v3 alias, which renders
    background-image:none against the custom @theme tokens (F0 lesson).
  -->
  <section
    id="how-it-works"
    class="relative overflow-hidden bg-[#EDF0F5] py-16 md:py-24"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12 md:mb-20">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto" />
        <h2 class="heading-section text-3xl md:text-4xl font-extrabold text-gray-900">
          Cómo Funciona
        </h2>
        <p class="mt-3 text-base md:text-lg text-gray-600">
          Alquila tu carro en 3 simples pasos
        </p>
      </div>

      <!-- Steps -->
      <div class="flex flex-col md:flex-row md:items-stretch gap-12 md:gap-0 max-w-6xl mx-auto">
        <template v-for="(step, index) in steps" :key="step.number">
          <article
            class="relative flex-1 bg-[#F8F9FC] rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 pt-12 pb-9 px-6 flex flex-col items-center text-center"
          >
            <!-- Number badge -->
            <span
              class="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-[#FF294D] to-[#CB032C] ring-4 ring-[#EDF0F5] shadow-[0_4px_10px_rgba(216,23,58,0.30)] flex items-center justify-center font-extrabold text-white text-lg md:text-xl"
              aria-hidden="true"
            >
              {{ step.number }}
            </span>

            <!-- Illustration -->
            <div class="w-full aspect-[4/3] rounded-2xl bg-[#F4F5F9] overflow-hidden mb-7">
              <img
                :src="step.image"
                :alt="step.imageAlt"
                loading="lazy"
                decoding="async"
                class="w-full h-full object-contain"
              >
            </div>

            <h3 class="heading-sub text-lg md:text-xl font-bold text-gray-900 mb-2">
              {{ step.title }}
            </h3>
            <p class="text-sm md:text-base text-gray-500 leading-relaxed">
              {{ step.description }}
            </p>
            <span
              class="mt-6 block w-16 h-1 rounded-full bg-red-600"
              aria-hidden="true"
            />
          </article>

          <!-- Connector arrow between steps (desktop only) -->
          <div
            v-if="index < steps.length - 1"
            class="hidden md:flex items-center justify-center px-3 lg:px-5 text-red-600"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </template>
      </div>

      <!-- Trust footer -->
      <div class="mt-14 md:mt-20 text-center">
        <p class="inline-flex items-center gap-2 text-base font-semibold text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-red-600"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Seguridad • Transparencia • Soporte 24/7
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Estamos contigo en todo el proceso.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Step {
  number: string
  title: string
  description: string
  image: string
  imageAlt: string
}

// Marketing copy ported verbatim from the design's #how-it-works.
const steps: Step[] = [
  {
    number: '01',
    title: 'Elige tu Ciudad y Vehículo',
    description:
      'Selecciona ciudad, fechas y horas. Te mostramos los carros disponibles ordenados por precio.',
    image: '/images/howitworks/paso-escoge.jpg',
    imageAlt: 'App mostrando un mapa con la ubicación y un vehículo disponible',
  },
  {
    number: '02',
    title: 'Reserva con anticipación',
    description:
      'Compartes tus datos y enviamos la solicitud. Confirmamos disponibilidad y respondemos en minutos.',
    image: '/images/howitworks/paso-reserva.jpg',
    imageAlt: 'Calendario con una fecha marcada y una reserva confirmada',
  },
  {
    number: '03',
    title: 'Recoge y Disfruta',
    description:
      'Recoges el vehículo en la ciudad y hora pactadas. Mantenimiento incluido para que solo te preocupes por disfrutar.',
    image: '/images/howitworks/paso-recoge.jpg',
    imageAlt: 'Asesor entregando las llaves del carro a una clienta',
  },
]
</script>
