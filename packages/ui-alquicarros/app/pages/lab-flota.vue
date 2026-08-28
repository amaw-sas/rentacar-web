<script setup lang="ts">
/**
 * MAQUETA · tres formas de resolver el arranque del bloque de flota.
 *
 * El problema: la franja quedaba blanca entre el hero (foto oscura) y las
 * tarjetas (oscuras), así que se leía como un hueco. Las tres propuestas
 * atacan eso por vías distintas: fondo, composición y posición.
 */
definePageMeta({ layout: false })
useSeoMeta({ robots: 'noindex, nofollow' })

const PROPUESTAS = [
  {
    n: 1,
    titulo: 'Fondo oscuro continuo',
    nota: 'La sección se pone oscura y las tarjetas dejan de flotar sobre un hueco blanco. Es lo que más rápido quita la sensación de «pegado aparte», porque el hero, el bloque y las tarjetas pasan a ser una sola masa.',
  },
  {
    n: 2,
    titulo: 'Encabezado a la izquierda, selector a la derecha',
    nota: 'Rompe el eje centrado, que es lo que hace que un título suelto parezca una isla. Usa el ancho y presenta el selector como un control, no como un adorno.',
  },
  {
    n: 3,
    titulo: 'El selector monta sobre el hero',
    nota: 'La barra sube y se solapa con el borde de la foto: cose las dos secciones y elimina la franja intermedia. La más arriesgada y la que menos altura gasta.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-white">
    <header class="mx-auto max-w-7xl px-6 pt-12 pb-8">
      <p class="font-heading text-xs font-semibold tracking-widest text-brand-800 uppercase">
        Maqueta · alquicarros
      </p>
      <h1 class="mt-2 font-heading text-3xl font-extrabold text-gray-900">
        El arranque del bloque de flota — tres propuestas
      </h1>
      <p class="mt-2 max-w-2xl text-gray-600">
        Cada propuesta se ve completa, con las tarjetas reales debajo. Arriba de cada una
        va un trozo del hero para que se juzgue la costura, que es donde estaba el problema.
      </p>
    </header>

    <section v-for="p in PROPUESTAS" :key="p.n" class="border-t border-gray-200">
      <div class="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <div class="flex items-baseline gap-3">
          <span class="font-heading text-sm font-extrabold text-brand-800">{{ p.n }}</span>
          <h2 class="font-heading text-xl font-bold text-gray-900">{{ p.titulo }}</h2>
        </div>
        <p class="mt-1 max-w-3xl text-sm text-gray-600">{{ p.nota }}</p>
      </div>

      <!-- Cola del hero, para ver cómo empalma -->
      <div class="relative isolate h-40 overflow-hidden">
        <NuxtImg
          src="/images/hero/carretera.webp"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 -z-20 h-full w-full object-cover object-bottom"
          width="1306"
          height="816"
          sizes="100vw"
          loading="lazy"
        />
        <div class="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
      </div>

      <HomeFleet :variante="p.n" />
    </section>
  </div>
</template>
