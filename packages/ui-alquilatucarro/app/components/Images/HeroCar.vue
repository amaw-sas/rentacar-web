<template>
  <!-- Carro decorativo del hero: SOLO desktop (lg+). La imagen se referencia
       únicamente dentro del @media lg, así que en móvil/tablet no se descarga
       (0 bytes) ni se renderiza — el hero móvil queda intacto. aspect-ratio
       reserva el espacio en desktop para evitar CLS. -->
  <div class="hero-car max-lg:hidden w-full lg:max-w-[480px] lg:mx-auto" aria-hidden="true" />
</template>

<style scoped>
@media (min-width: 1024px) {
  .hero-car {
    aspect-ratio: 1203 / 600; /* car.webp (sedán sin placa, fondo transparente + sombra) */
    background-image: url('/images/hero/car.webp');
    background-size: contain;
    background-position: center bottom;
    background-repeat: no-repeat;
  }
}
</style>
