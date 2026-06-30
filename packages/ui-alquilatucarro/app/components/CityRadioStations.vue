<template>
  <section
    v-if="radio && radio.stations.length"
    id="emisoras-radio"
    class="bg-gray-50 text-black py-8 md:py-12 px-4 md:px-8"
  >
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl md:text-3xl font-bold text-center mb-3">
        <span class="text-red-700">Emisoras de radio más escuchadas</span>{{ ' ' }}<span class="text-black">{{ radio.nearbyOf ? `cerca de ${cityName}` : `en ${cityName}` }}</span>
      </h2>
      <p class="text-gray-600 text-center max-w-2xl mx-auto mb-8">
        Disfruta tu viaje con la mejor música. Sintoniza por internet las emisoras
        favoritas{{ radio.nearbyOf ? ` de ${radio.nearbyOf}` : ` de ${cityName}` }} y
        rueda sin interrupciones en la vía.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="station in radio.stations"
          :key="station.url"
          class="flex flex-col items-center text-center bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <!-- Logo (lazy) o fallback con la inicial -->
          <img
            v-if="station.logo && !broken.has(station.url)"
            :src="station.logo"
            :alt="`Logo de ${station.name}`"
            loading="lazy"
            decoding="async"
            class="w-16 h-16 object-contain mb-3"
            @error="broken.add(station.url)"
          >
          <span
            v-else
            aria-hidden="true"
            class="w-16 h-16 mb-3 rounded-full bg-red-100 text-red-700 font-bold text-2xl flex items-center justify-center"
          >{{ station.name.charAt(0) }}</span>

          <span class="font-semibold text-gray-900 leading-tight">{{ station.name }}</span>
          <span class="text-sm text-gray-500 mb-4">{{ station.frequency }}</span>

          <a
            :href="station.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Escuchar ${station.name} en otra pestaña`"
            class="mt-auto inline-flex items-center gap-1.5 bg-red-600 text-white font-semibold text-sm px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
          >
            <span aria-hidden="true">▶</span> Escuchar
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { getCityRadio } from '../data/radioStations';

const props = defineProps<{
  cityId?: string;
  cityName?: string;
}>();

const radio = computed(() => getCityRadio(props.cityId));

// Logos que fallaron al cargar (host caído / ruta cambiada) → caen al fallback
// con la inicial, para que ninguna tarjeta quede con imagen rota.
const broken = reactive(new Set<string>());
</script>
