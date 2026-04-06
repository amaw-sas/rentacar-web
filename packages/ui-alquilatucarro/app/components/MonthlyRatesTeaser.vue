<template>
  <section class="bg-gradient-to-r from-[#0B1A2E] to-[#162d4a] text-white py-8 md:py-10 px-4 md:px-8">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="text-center sm:text-left">
        <h3 class="text-lg md:text-xl font-bold">
          Arriendos mensuales desde
          <span class="text-green-400">{{ formatCOP(minDaily) }}/día</span>
        </h3>
        <p class="text-white/60 text-sm mt-1">
          Planes de 1.000 y 2.000 kms · IVA y seguro incluidos
        </p>
      </div>
      <NuxtLink
        to="/tarifas"
        class="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shrink-0"
      >
        Ver tarifas
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { tarifasConfig } from '@rentacar-main/logic/config';

const minDaily = tarifasConfig.gamas[0].plan1k.daily;

function formatCOP(value: number): string {
  return '$' + value.toLocaleString('es-CO');
}
</script>
