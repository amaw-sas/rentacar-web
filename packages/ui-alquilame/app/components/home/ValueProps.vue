<template>
  <!--
    "¿Por qué alquilar con …?" — ported verbatim from the reference design's
    VentajasCity: four FRAMED PHOTO cards (photo on top, gradient icon, title,
    description, red divider) replacing the old flat text-only props.

    The headline brand name stays config-driven (`organization.brand`), never the
    hardcoded literal — the brand token is interpolated into the "¿Por qué
    alquilar con {brand}?" headline, staying the single source of truth.

    Surface/frame tokens mirror the Fleet cards: bg-surface-soft section,
    bg-surface-softest card, 7px white border. Headings use font-heading.
  -->
  <section class="bg-surface-soft py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-10">
        <div class="h-1 w-10 rounded-full bg-brand-600 mb-4" />
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          ¿Por qué alquilar con {{ brand }}?
        </h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="ventaja in ventajas"
          :key="ventaja.title"
          class="group flex flex-col h-full overflow-hidden rounded-[22px] bg-surface-softest border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.055)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,17,34,0.09)] transition-all duration-200 p-[5px]"
        >
          <div class="relative aspect-[3/2] overflow-hidden rounded-[15px] bg-gray-100">
            <NuxtImg
              :src="ventaja.image"
              :alt="ventaja.title"
              width="900"
              height="600"
              format="webp"
              sizes="sm:100vw md:50vw lg:25vw"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
          <div class="flex-1 flex flex-col p-5">
            <div
              class="w-12 h-12 rounded-full bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-[0_4px_10px_rgba(216,23,58,0.30)] mb-4"
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
                v-html="ventaja.icon"
              />
            </div>
            <h3 class="text-xl font-bold font-heading text-gray-900 mb-2 leading-tight">
              {{ ventaja.title }}
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              {{ ventaja.description }}
            </p>
            <div class="h-1 w-10 rounded-full bg-brand-600 mt-4" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Ventaja {
  title: string
  description: string
  image: string
  // Inner SVG markup (paths/shapes) for the icon.
  icon: string
}

// Brand name for the headline — sourced from app config, never hardcoded and
// never the lowercase brand identifier.
const { organization } = useAppConfig()
const brand = organization.brand

// The 4 reference advantages, copy + photos ported verbatim from the design's
// colombia.ventajas. Icons inlined from the design's iconLibrary.
const ventajas: Ventaja[] = [
  {
    title: 'Sin anticipos para reservar',
    description:
      'Reserva por WhatsApp sin depósitos previos. Solo necesitas una tarjeta de crédito a tu nombre como respaldo el día de la entrega.',
    image: '/images/ventajas/sin-anticipos-foto.webp',
    icon: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  },
  {
    title: 'Plan diario con kilometraje ilimitado',
    description:
      'Recorre Colombia sin recargos por kilómetros. El plan diario incluye kilometraje ilimitado real, un diferencial frente a otras rentadoras.',
    image: '/images/ventajas/kilometraje-ilimitado-foto.webp',
    icon: '<path d="M4 19h16M4 19l2-14h4l-1 14M20 19l-2-14h-4l1 14M11 5h2M11 9h2M11 13h2M11 17h2"/>',
  },
  {
    title: 'Entrega en aeropuertos y puntos físicos',
    description:
      'Recoge el vehículo en aeropuertos y puntos de entrega de las principales ciudades. Coordinamos el punto exacto de encuentro al reservar.',
    image: '/images/ventajas/aeropuerto-eldorado-foto.webp',
    icon: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  },
  {
    title: 'Pico y placa controlado',
    description:
      'En las ciudades con restricción te confirmamos la placa antes de la entrega; si tu día de viaje está restringido, podemos cambiarte a otra placa disponible (sujeto a flota).',
    image: '/images/ventajas/pico-y-placa-foto.webp',
    icon: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  },
]
</script>
