<template>
  <!--
    value-props — sección "¿Por Qué Elegir …?" (4 props). Rediseño: cada prop es
    una card centrada con un badge de icono (UIcon/lucide) arriba, consistente
    con las cards de "Cómo Funciona". Los iconos son de Nuxt UI (lucide), no SVG
    inline dibujados a mano.

    El nombre de marca del headline sale de `organization.brand` (capitalizado),
    nunca hardcodeado ni el identificador en minúscula.
  -->
  <section class="bg-white py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          ¿Por Qué Elegir {{ brand }}?
        </h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="prop in valueProps"
          :key="prop.title"
          data-testid="valueprop-card"
          class="bg-[#F8F9FC] rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <div
            data-testid="valueprop-icon-badge"
            class="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-4"
          >
            <UIcon :name="prop.icon" data-testid="valueprop-icon" class="size-7" aria-hidden="true" />
          </div>
          <h3 class="heading-sub text-lg font-bold text-gray-900 mb-1">
            {{ prop.title }}
          </h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            {{ prop.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface ValueProp {
  title: string
  description: string
  // Nombre de icono de Nuxt UI (lucide).
  icon: string
}

// Brand name for the headline — sourced from app config, never hardcoded and
// never the lowercase brand identifier.
const { organization } = useAppConfig()
const brand = organization.brand

// Live active-city count — drives the "Cobertura Nacional" figure.
const cityCount = useCityCount()

// computed so the coverage figure tracks cityCount; the rest stays verbatim.
const valueProps = computed<ValueProp[]>(() => [
  {
    title: 'Sin Anticipos',
    description: 'Reserva tu vehículo sin depósitos ni pagos adelantados.',
    icon: 'i-lucide-wallet',
  },
  {
    title: 'Flota Nueva',
    description: 'Vehículos con menos de 2 años de antigüedad.',
    icon: 'i-lucide-car',
  },
  {
    title: 'Asistencia 24/7',
    description: 'Soporte y asistencia en carretera las 24 horas.',
    icon: 'i-lucide-headset',
  },
  {
    title: 'Cobertura Nacional',
    description: `Presentes en ${cityCount.value} ciudades de Colombia.`,
    icon: 'i-lucide-map-pinned',
  },
])
</script>
