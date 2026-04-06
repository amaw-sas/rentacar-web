<template>
    <UCarousel
      v-slot="{ item }"
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
        <picture>
          <source 
            :srcset="item.imagenes.avif"
            type="image/avif"
          >
          <source 
            :srcset="item.imagenes.webp"
            type="image/webp"
          >
          <img 
            :src="item.imagenes.jpg"
            :alt="item.nombre" 
            width="800" 
            height="480" 
            loading="lazy" 
            decoding="async"
            class="w-full"
          >
        </picture>
      </div>
    </UCarousel>
</template>

<script setup lang="ts">

interface CarruselProps {
  category: CategoryType;
  models?: CategoryModelData[];
  vehicleModels?: VehicleCategoryModel[]
}

const props = defineProps<CarruselProps>();

props.vehicleModels?.forEach((model: VehicleCategoryModel, i) => {
  if(model?.imagenes?.jpg){
    defineImage({
      url: model.imagenes.jpg,
    });
  }
});
</script>

