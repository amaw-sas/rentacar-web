<template>
  <!--
    how-it-works — sección "Cómo Funciona" rediseñada (mockup): un stepper
    horizontal decorativo (1-2-3, paso 1 activo) sobre 3 cards con icono de línea
    (UIcon/lucide) + copy corto. El trust footer se conserva.

    Stepper estático: paso 1 activo (naranja de marca), 2/3 inactivos; conector
    1→2 naranja, 2→3 gris. Sin transform hand-rolled — centrado con flex, así que
    no toca el critical CSS de translate (gotcha de doble-offset v4).
  -->
  <section
    id="how-it-works"
    class="relative overflow-hidden bg-[#EDF0F5] py-16 md:py-24"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12 md:mb-16">
        <div class="h-1 w-10 rounded-full bg-brand-600 mb-4 mx-auto" />
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          Cómo Funciona
        </h2>
        <p class="mt-3 text-base md:text-lg text-gray-600">
          Alquila tu carro en 3 simples pasos
        </p>
      </div>

      <!-- Stepper rail (decorativo): paso 1 activo, conector 1→2 naranja -->
      <div
        data-testid="howitworks-stepper-test"
        class="flex items-center justify-center mb-12 md:mb-16"
        aria-hidden="true"
      >
        <template v-for="(step, index) in steps" :key="`marker-${step.number}`">
          <span
            :data-testid="`step-marker-${step.number}`"
            class="flex items-center justify-center size-11 md:size-12 rounded-full font-extrabold text-base shrink-0 bg-brand-600 text-white shadow-[0_4px_12px_rgba(239,150,0,0.35)]"
          >
            {{ step.number }}
          </span>
          <span
            v-if="index < steps.length - 1"
            :data-testid="`step-connector-${step.number}`"
            class="h-1 w-12 sm:w-20 md:w-28 rounded-full bg-brand-600"
          />
        </template>
      </div>

      <!-- Steps -->
      <div class="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        <article
          v-for="step in steps"
          :key="step.number"
          data-testid="howitworks-step-card"
          class="bg-white rounded-2xl border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 p-8 flex flex-col items-center text-center"
        >
          <UIcon
            :name="step.icon"
            data-testid="step-icon"
            class="text-brand-700 size-10 md:size-12 mb-5"
            aria-hidden="true"
          />
          <h3 class="heading-sub text-lg md:text-xl font-bold text-gray-900 mb-2">
            {{ step.title }}
          </h3>
          <p class="text-sm md:text-base text-gray-500 leading-relaxed">
            {{ step.description }}
          </p>
        </article>
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
            class="text-brand-700"
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
  icon: string
}

// Copy corto del mockup. icon → lucide (set ya usado en el repo).
const steps: Step[] = [
  {
    number: '1',
    title: 'Elige ciudad y auto',
    description: 'Selecciona la ciudad y el vehículo que mejor se adapte a tu viaje.',
    icon: 'i-lucide-map-pin',
  },
  {
    number: '2',
    title: 'Reserva en minutos',
    description: 'Elige fechas, confirma y recibe tu confirmación al instante.',
    icon: 'i-lucide-calendar-check',
  },
  {
    number: '3',
    title: 'Recoge y conduce',
    description: 'Recoge tu auto en la sucursal seleccionada y comienza tu aventura.',
    icon: 'i-lucide-key',
  },
]
</script>
