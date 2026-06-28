<template>
  <section
    v-if="minDaily !== null"
    id="arriendos-mensuales"
    class="relative w-full overflow-hidden bg-[#0B1A2E]"
  >
    <!-- Background photo (AI-generated scene, no baked-in text).
         Mobile: cover. Desktop: pulled back & anchored right; navy fills the left (text area). -->
    <div
      role="img"
      aria-label="Arriendo mensual de carros en Bogotá"
      style="background-image: url('/images/monthly/teaser-suv-bogota.webp')"
      class="absolute inset-0 bg-no-repeat bg-cover bg-[position:72%_center] md:bg-[length:85%_auto] md:bg-[position:right_35%]"
    ></div>
    <!-- Navy gradient for text legibility. Desktop: solid navy stays opaque until 20%
         (covers the photo's left edge → seamless join), then fades to reveal the car. -->
    <div class="absolute inset-0 bg-gradient-to-r from-[#0B1A2E] via-[#0B1A2E]/85 to-[#0B1A2E]/10 md:from-20% md:via-[#0B1A2E]/45 md:via-60% md:to-transparent"></div>

    <!-- Real HTML content on top -->
    <div class="relative max-w-7xl mx-auto flex flex-col items-start justify-center text-white min-h-[460px] md:min-h-[540px] px-6 md:px-12 py-12">
      <h3 class="font-extrabold leading-[1.05] tracking-tight">
        <span class="block text-2xl md:text-5xl">Arriendos mensuales</span>
        <span class="block text-3xl md:text-6xl text-green-400 mt-1">
          desde {{ formatCOP(minDaily) }}<span class="text-lg md:text-3xl font-bold">/día</span>
        </span>
      </h3>
      <p class="text-white/75 text-sm md:text-lg mt-4 max-w-md">
        Planes de 1.000 y 2.000 kms · IVA y seguro incluidos
      </p>
      <NuxtLink
        to="/tarifas"
        class="mt-8 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-colors"
      >
        Ver tarifas
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import useTariffs from '@rentacar-main/logic/composables/useTariffs';

const tariffs = useTariffs();

const minDaily = computed(() => {
  if (tariffs.gamas.length === 0) return null;
  return Math.min(...tariffs.gamas.map((g) => g.plan1k.daily));
});

function formatCOP(value: number): string {
  return '$' + value.toLocaleString('es-CO');
}
</script>
