<template>
  <!--
    Aviso de ciudad sin servicio (SCEN-008).

    Ocupa el sitio del buscador cuando `cities.bookable` es false. TODO lo demas de la pagina
    -descripcion, testimonios, FAQs, schema de producto, enlaces internos- se queda: la pagina
    tiene que seguir respondiendo 200 con su contenido, que es exactamente el motivo por el que
    esta feature existe en vez de apagar `status` (eso dejo /pereira en 404 y hundio su SEO).

    El texto es literal del diseno §3, aprobado por directiva. No improvisar aqui: dice "por
    ahora" a proposito -deja abierto el regreso sin comprometer fecha-, no promete stock en las
    ciudades cercanas (invita a buscar, no afirma que hay carros) y no explica el motivo ni se
    disculpa, porque el incidente no es asunto del cliente.

    Sin ciudades cercanas reservables queda solo el titulo: el segundo parrafo y los botones
    desaparecen antes que mentir sobre una salida que no tenemos.
  -->
  <section class="w-full">
    <div class="mx-auto max-w-2xl rounded-lg bg-white/95 p-6 text-center shadow-md md:p-8">
      <h2 class="text-2xl font-bold text-gray-900 md:text-3xl">
        Por ahora no estamos alquilando en {{ cityName }}
      </h2>

      <template v-if="nearby.length > 0">
        <p class="mt-3 text-sm text-gray-600 md:text-base">
          No tenemos carros disponibles en esta ciudad.
          {{ nearbySentence }}
        </p>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <NuxtLink
            v-for="city in nearby"
            :key="city.id"
            :to="`/${city.id}`"
            class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-brand-700"
          >
            Buscar carros en {{ city.name }}
          </NuxtLink>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
// `computed` se importa explicitamente: Nuxt lo auto-importa en runtime, pero un montaje
// aislado en vitest no pasa por ese resolver y el componente reventaba con "computed is not
// defined" solo bajo test.
import { computed } from 'vue'
import type { RelatedCity } from '@rentacar-main/logic/utils'

const props = defineProps<{
  cityName: string
  nearby: RelatedCity[]
}>()

// La copy aprobada nombra DOS cercanas. Con una sola, la frase en plural mentiria sobre lo que
// viene detras, asi que se ajusta el numero en vez de dejar un hueco o inventar una segunda.
const nearbySentence = computed(() => {
  const parts = props.nearby.map((c) => `${c.name}, a ${c.distance}`)
  return parts.length > 1
    ? `Las sedes más cercanas están en ${parts.slice(0, -1).join(', ')}, y en ${parts[parts.length - 1]}.`
    : `La sede más cercana está en ${parts[0]}.`
})
</script>
