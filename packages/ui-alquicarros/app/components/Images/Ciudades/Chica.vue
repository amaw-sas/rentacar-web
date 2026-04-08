<template>
  <div class="flex justify-center md:items-start">
    <NuxtImg
      src="/images/ciudades/chica.webp"
      :alt="`Cliente satisfecha con su experiencia de alquiler de carros en ${cityName} Colombia`"
      width="800"
      height="800"
      sizes="sm:300px md:800px"
      loading="lazy"
      class="block w-full max-w-[400px] aspect-square object-contain"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  cityName?: string
}>(), {
  cityName: ''
})
</script>
