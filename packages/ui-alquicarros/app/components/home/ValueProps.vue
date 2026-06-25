<template>
  <!--
    F1 value-props — new presentational section ported from the design's
    "¿Por Qué Elegir …?" block (4 props). Pure marketing copy from the design.

    The headline brand name is derived from the capitalized `organization.brand`
    — NOT hardcoded, and NOT the lowercase brand identifier.
    Headings adopt the project `.heading-*` utilities.
  -->
  <section class="bg-white py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          ¿Por Qué Elegir {{ brand }}?
        </h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        <div
          v-for="prop in props"
          :key="prop.title"
          class="flex items-start gap-4"
        >
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="prop.icon"
            />
          </div>
          <div>
            <h3 class="heading-sub text-lg font-bold text-gray-900 mb-1">
              {{ prop.title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              {{ prop.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface ValueProp {
  title: string
  description: string
  // Inner SVG markup (paths/shapes) for the prop icon.
  icon: string
}

// Brand name for the headline — sourced from app config, never hardcoded and
// never the lowercase brand identifier.
const { organization } = useAppConfig()
const brand = organization.brand

// Live active-city count — drives the "Cobertura Nacional" figure.
const cityCount = useCityCount()

// computed so the coverage figure tracks cityCount; the rest stays verbatim.
const props = computed<ValueProp[]>(() => [
  {
    title: 'Sin Anticipos',
    description: 'Reserva tu vehículo sin depósitos ni pagos adelantados.',
    icon: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  },
  {
    title: 'Flota Nueva',
    description: 'Vehículos con menos de 2 años de antigüedad.',
    icon: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  },
  {
    title: 'Asistencia 24/7',
    description: 'Soporte y asistencia en carretera las 24 horas.',
    icon: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  },
  {
    title: 'Cobertura Nacional',
    description: `Presentes en ${cityCount.value} ciudades de Colombia.`,
    icon: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  },
])
</script>
