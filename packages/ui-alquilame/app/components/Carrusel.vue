<template>
    <UCarousel
      ref="carousel"
      v-slot="{ item, index }"
      :items="vehicleModels"
      :ui="{
        viewport: 'rounded-t-lg',
      }"
    >
      <div
        class="relative cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="`Reservar ${item.nombre}`"
        @click="onActivate"
        @keydown.enter.prevent="onActivate"
        @keydown.space.prevent="onActivate"
      >
        <div class="nombre-modelo">
          <span>{{ item.nombre }}</span>
        </div>
        <!--
          Navegación de fotos en la barra inferior: dos flechas en cuadros negros
          flanqueando el contador (reemplazan las flechas laterales sobre la foto).
          `@click.stop` para no disparar el @click de reserva del slide; llaman a
          la API de Embla que expone UCarousel (emblaApi.scrollPrev/scrollNext).
          Solo aparecen si hay más de una foto.
        -->
        <div class="contador-fotos">
          <button
            v-if="(vehicleModels?.length ?? 0) > 1"
            type="button"
            class="contador-flecha"
            aria-label="Foto anterior"
            @click.stop="scrollPrev"
            @keydown.enter.stop.prevent="scrollPrev"
            @keydown.space.stop.prevent="scrollPrev"
          >
            <UIcon name="i-lucide-chevron-left" class="size-4" />
          </button>
          <span class="contador-texto">Fotos {{ index + 1 }} de {{ vehicleModels?.length }}</span>
          <button
            v-if="(vehicleModels?.length ?? 0) > 1"
            type="button"
            class="contador-flecha"
            aria-label="Foto siguiente"
            @click.stop="scrollNext"
            @keydown.enter.stop.prevent="scrollNext"
            @keydown.space.stop.prevent="scrollNext"
          >
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </button>
        </div>
        <NuxtImg
          :src="item.image"
          :alt="item.nombre"
          width="800"
          height="480"
          sizes="100vw md:50vw lg:33vw"
          :loading="(priority && index === 0) ? 'eager' : 'lazy'"
          :fetchpriority="(priority && index === 0) ? 'high' : 'auto'"
          decoding="async"
          class="w-full aspect-[5/3] object-cover"
        />
      </div>
    </UCarousel>
</template>

<script setup lang="ts">
// `ref` explícito (no solo auto-import de Nuxt) para que el test de montaje
// (Carrusel.behavior.test.ts, sin auto-imports) resuelva el runtime de Vue.
import { ref } from 'vue'

interface CarruselProps {
  category: CategoryType;
  models?: CategoryModelData[];
  vehicleModels?: VehicleCategoryModel[]
  // LCP: solo la primera card pasa priority=true → su primer slide carga eager.
  priority?: boolean;
}

withDefaults(defineProps<CarruselProps>(), {
  priority: false,
});

const emit = defineEmits<{
  select: [];
}>();

// UCarousel expone { emblaRef, emblaApi } vía defineExpose; con este ref
// accedemos a la API de Embla para navegar sin recrear el estado del carrusel.
const carousel = ref();
function scrollPrev() {
  carousel.value?.emblaApi?.scrollPrev();
}
function scrollNext() {
  carousel.value?.emblaApi?.scrollNext();
}

// Tap/click en la foto o Enter/Espacio abren el flujo de reserva (emit `select`
// → goNextStep en el padre, mismo destino que "Solicitar este vehículo"). Las
// flechas del contador usan `@click.stop`, así que no llegan hasta aquí.
//
// No se rastrean pointer events para distinguir tap de swipe: Embla
// (UCarousel) ya suprime el `click` que sigue a un arrastre en fase de captura
// (`preventClick` + `stopPropagation` sobre el root del carrusel), así que
// nuestro `@click` solo se dispara en un tap real.
function onActivate() {
  emit('select');
}
</script>
