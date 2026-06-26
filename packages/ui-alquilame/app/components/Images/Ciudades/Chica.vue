<template>
  <div class="flex justify-center md:items-start">
    <!--
      Brand-specific #descripcion illustration (alquilame only). The previous
      shared illustration from the logic layer was identical across the three
      brands, which made the alquilame city page mirror alquilatucarro. alquilame
      now uses its own flat illustration. Generated via Vercel AI Gateway
      (openai/gpt-image-2), brand red #CC022B, white background, square 800x800.
    -->
    <NuxtImg
      src="/images/cities/descripcion.webp"
      :alt="`Cliente satisfecho con su carro de alquiler en ${cityName} Colombia`"
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
