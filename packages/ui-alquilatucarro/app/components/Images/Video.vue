<template>
  <picture>
    <!-- video avif movil -->
    <source
      type="image/avif"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo-movil.avif?alt=media&token=e5cb0fb6-d976-4218-9620-8f2873e2d053
      "
      width="333"
      height="270"
    />
    <!-- video webp -->
    <source
      type="image/webp"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo.webp?alt=media&token=424d037e-4aab-47ef-af6f-0fa0caa24e7f
      "
      width="2000"
      height="1620"
    />
    <!-- video webp movil -->
    <source
      type="image/webp"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo-movil.webp?alt=media&token=d43a8380-d542-49b3-beab-e512053d40ac
      "
      width="333"
      height="270"
    />
    <!-- video png -->
    <source
      type="image/png"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo.png?alt=media&token=a0fa2d81-0563-4109-954e-2707ad56ae22
      "
      width="2000"
      height="1620"
    />
    <!-- video movil png -->
    <source
      type="image/png"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo-movil.png?alt=media&token=4af04e5d-6ae3-43c2-8d24-07acf5397562
      "
      width="333"
      height="270"
    />
    <!-- video defecto -->
    <img
      v-youtube-lazy="videoID"
      src="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo.png?alt=media&token=a0fa2d81-0563-4109-954e-2707ad56ae22"
      alt="Video promocional de descuentos en alquiler de carros hasta 60% de descuento"
      width="2000"
      height="1620"
      loading="lazy"
      class="mx-auto w-full h-full object-contain cursor-pointer"
    />
  </picture>
</template>
<script lang="ts" setup>
const videoID = "_MVNhinVYHE";
</script>