<template>
  <picture>
    <!-- AVIF Desktop -->
    <source
      type="image/avif"
      media="(min-width: 768px)"
      srcset="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia.avif?alt=media&token=a14e3f1c-428e-40b2-ad1e-0d724579e487"
      width="2000"
      height="1620"
    />
    <!-- AVIF Mobile -->
    <source
      type="image/avif"
      media="(max-width: 767px)"
      srcset="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia-movil.avif?alt=media&token=09ef76e8-4f99-4188-8d9a-57e13e198c4b"
      width="760"
      height="616"
    />
    <!-- WebP Desktop (fallback) -->
    <source
      type="image/webp"
      media="(min-width: 768px)"
      srcset="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia.webp?alt=media&token=3a180793-69a9-471f-a1d1-8f720ba14662"
      width="2000"
      height="1620"
    />
    <!-- WebP Mobile (fallback) -->
    <source
      type="image/webp"
      media="(max-width: 767px)"
      srcset="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia-movil.webp?alt=media&token=ba908a15-bfaa-4c82-88e4-538fee298fae"
      width="760"
      height="616"
    />
    <!-- Fallback img (WebP - supported by 97%+ browsers) -->
    <img
      src="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Ffamilia-movil.webp?alt=media&token=ba908a15-bfaa-4c82-88e4-538fee298fae"
      alt="Familia disfrutando de un viaje en carro alquilado en Colombia"
      width="760"
      height="616"
      sizes="(max-width: 767px) 100vw, 50vw"
      loading="eager"
      decoding="async"
      fetchpriority="high"
      class="mx-auto"
    />
  </picture>
</template>
