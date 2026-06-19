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
        @pointerdown="onPointerDown"
        @pointercancel="onPointerCancel"
        @click="onImageClick"
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

// Umbral (px) para distinguir un tap real de un swipe del carrusel. Coincide
// con el dragThreshold por defecto de Embla.
const SWIPE_THRESHOLD_PX = 10;

// Guarda la posición del pointerdown para distinguir un tap real de un
// arrastre/swipe del carrusel. Así el tap en la imagen abre el flujo de
// reserva sin afectar la navegación existente (flechas, puntos y deslizar).
let pointerStart: { x: number; y: number } | null = null;

function onPointerDown(event: PointerEvent) {
  pointerStart = { x: event.clientX, y: event.clientY };
}

// Un pointerdown sin click posterior (swipe que el carrusel captura,
// pointercancel del SO, drag fuera del elemento) dejaría una posición obsoleta.
// Se limpia para que el próximo tap se mida contra su propio gesto.
function onPointerCancel() {
  pointerStart = null;
}

function onImageClick(event: MouseEvent) {
  const start = pointerStart;
  pointerStart = null;
  // Click sin pointerdown propio (sintético, o cuyo pointerdown capturó el
  // carrusel): no hay gesto que medir → no se abre, para evitar un emit espurio.
  if (!start) return;
  const dx = Math.abs(event.clientX - start.x);
  const dy = Math.abs(event.clientY - start.y);
  // Si el pointer se movió más que el umbral fue un swipe: no abrir el modal.
  if (dx > SWIPE_THRESHOLD_PX || dy > SWIPE_THRESHOLD_PX) return;
  emit('select');
}

// Camino de teclado (Enter/Espacio): no hay desplazamiento que medir, abre directo.
function onActivate() {
  pointerStart = null;
  emit('select');
}
</script>
