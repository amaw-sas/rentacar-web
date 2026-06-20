<template>
    <UCarousel
      v-slot="{ item, index }"
      :items="vehicleModels"
      dots
      prev-icon="lucide:chevron-left"
      next-icon="lucide:chevron-right"
      arrows
      :ui="{
        viewport: 'rounded-t-lg',
        dots: 'bottom-5 gap-1',
        dot: 'size-2 bg-gray-400/70 rounded-full transition-all duration-300 data-[state=active]:w-6 data-[state=active]:bg-white'
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
// nuestro `@click` solo se dispara en un tap real.
function onActivate() {
  emit('select');
}
</script>
