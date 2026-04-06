<template>
  <picture>
    <!-- persona avif -->
    <source
      type="image/avif"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona.avif?alt=media&token=39468446-a9bb-4793-8c08-f334e797d36d
      "
      width="2000"
      height="1620"
    />
    <!-- persona avif movil -->
    <source
      type="image/avif"
      media="(max-width: 767px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona-movil.avif?alt=media&token=0085aaff-80de-4260-9a36-12412ae77b4c
      "
      width="333"
      height="270"
    />
    <!-- persona webp -->
    <source
      type="image/webp"
      media="(min-width: 768px)"
      srcset="
        https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona.webp?alt=media&token=8d98ef71-c9b8-4357-8093-ba9cf0aaa2e8
      "
      width="2000"
      height="1620"
    />
    <!-- persona defecto -->
    <img
      src="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fpersona.webp?alt=media&token=8d98ef71-c9b8-4357-8093-ba9cf0aaa2e8"
      alt="Persona mostrando los requisitos para alquilar un carro en Colombia"
      width="2000"
      height="1620"
      loading="lazy"
      class="mx-auto w-full h-full object-contain"
    />
  </picture>
</template>