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
      <div class="relative">
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
</script>
