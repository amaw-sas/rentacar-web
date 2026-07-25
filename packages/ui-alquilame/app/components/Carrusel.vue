<template>
    <UCarousel
      v-slot="{ item, index }"
      :items="vehicleModels"
      prev-icon="lucide:chevron-left"
      next-icon="lucide:chevron-right"
      arrows
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
        <!-- Contador informativo, NO navegación: reemplaza los puntos, que sí
             eran clickeables. Cada slide conoce su propio `index`, así que no
             hace falta estado ni escuchar el evento `select` del carrusel. -->
        <div class="contador-fotos">Fotos {{ index + 1 }} de {{ vehicleModels?.length }}</div>
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

// Tap/click en la foto o Enter/Espacio abren el flujo de reserva (emit `select`
// → goNextStep en el padre, mismo destino que "Solicitar este vehículo").
//
// No se rastrean pointer events para distinguir tap de swipe: Embla
// (UCarousel) ya suprime el `click` que sigue a un arrastre en fase de captura
// (`preventClick` + `stopPropagation` sobre el root del carrusel), así que
// nuestro `@click` solo se dispara en un tap real. El intento anterior de
// medir el desplazamiento con `pointerdown`/`pointercancel` rompía el tap:
// Embla hace `preventDefault` en `touchmove`, el navegador emite
// `pointercancel` ante el micro-movimiento de un tap normal, eso borraba la
// posición registrada y el `click` quedaba sin emitir.
function onActivate() {
  emit('select');
}
</script>
