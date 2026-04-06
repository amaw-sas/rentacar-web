<template>
  <picture class="flex justify-center md:items-start">
    <!-- chica avif -->
    <source
      type="image/avif"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.avif?alt=media&token=85c1b2b6-4b0b-4da5-bc61-9f0fac1a2d4c
      "
      width="800"
      height="800"
    />
    <!-- chica avif movil -->
    <source
      type="image/avif"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica-movil.avif?alt=media&token=85c1b2b6-4b0b-4da5-bc61-9f0fac1a2d4c
      "
      alt="chica"
      width="300"
      height="300"
      loading="lazy"
    />
    <!-- chica webp -->
    <source
      type="image/webp"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.webp?alt=media&token=345dbdf6-4162-4d8a-8542-9d7c5d06f28c
      "
      width="800"
      height="800"
    />
    <!-- chica webp movil -->
    <source
      type="image/webp"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica-movil.webp?alt=media&token=345dbdf6-4162-4d8a-8542-9d7c5d06f28c
      "
      alt="carros"
      width="300"
      height="300"
      loading="lazy"
    />
    <!-- chica jpg -->
    <source
      type="image/jpg"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.jpg?alt=media&token=8279f1f0-b56d-4f84-bc2e-d23d4fd55458
      "
      width="800"
      height="800"
    />
    <!-- chica movil png -->
    <source
      type="image/png"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.jpg?alt=media&token=8279f1f0-b56d-4f84-bc2e-d23d4fd55458
      "
      alt="chica"
      width="300"
      height="300"
      loading="lazy"
    />
    <!-- chica defecto -->
    <img
      src="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fciudades%2Fchica%2Fchica.jpg?alt=media&token=8279f1f0-b56d-4f84-bc2e-d23d4fd55458"
      :alt="`Cliente satisfecha con su experiencia de alquiler de carros en ${cityName} Colombia`"
      class="block w-full max-w-[400px] aspect-square object-contain"
      width="800"
      height="800"
      loading="lazy"
    />
  </picture>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  cityName?: string
}>(), {
  cityName: ''
})
</script>
