<template>
  <!-- Carro decorativo del hero: SOLO desktop (lg+). El import de Vite da una
       URL versionada y NuxtImg la enruta por el optimizador responsivo. -->
  <div class="max-lg:hidden w-full lg:max-w-[480px] lg:mx-auto aspect-[1203/600]" aria-hidden="true">
    <NuxtImg
      v-if="isMounted && isDesktop"
      :src="heroCarSrc"
      alt=""
      width="1203"
      height="600"
      sizes="lg:480px"
      format="webp"
      loading="lazy"
      decoding="async"
      class="w-full h-full object-contain object-bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery, useMounted } from '@vueuse/core'
import heroCarSrc from '~/assets/images/hero/car.webp'

const isMounted = useMounted()
const isDesktop = useMediaQuery('(min-width: 1024px)')
</script>
