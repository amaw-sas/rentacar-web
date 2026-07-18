<template>
  <!-- Carro decorativo del hero: SOLO desktop (lg+). The explicit box and
       image styles preserve the production 480x239 paint geometry. -->
  <div class="hero-car max-lg:hidden w-full lg:max-w-[480px] lg:mx-auto" aria-hidden="true">
    <NuxtImg
      v-if="isMounted && isDesktop"
      src="/images/hero/car.webp"
      alt=""
      width="480"
      height="239"
      sizes="480px"
      densities="1x 2x"
      format="webp"
      loading="lazy"
      decoding="async"
      class="hero-car-image"
    />
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery, useMounted } from '@vueuse/core'

const isMounted = useMounted()
const isDesktop = useMediaQuery('(min-width: 1024px)')
</script>

<style scoped>
.hero-car {
  position: relative;
  aspect-ratio: 1203 / 600;
}

.hero-car-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}
</style>
