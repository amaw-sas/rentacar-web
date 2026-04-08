<template>
  <NuxtImg
    v-youtube-lazy="videoID"
    src="/images/video/video.webp"
    alt="Video promocional de descuentos en alquiler de carros hasta 60% de descuento"
    width="2000"
    height="1620"
    sizes="sm:100vw md:50vw"
    loading="lazy"
    class="mx-auto w-full h-full object-contain cursor-pointer"
  />
</template>
<script lang="ts" setup>
const videoID = "_MVNhinVYHE";
</script>
