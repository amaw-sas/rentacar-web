<template>
  <!--
    FleetCard — presentación de una card estática de flota (catálogo de
    marketing), extraída de Fleet.vue. Recibe `card` (categoría + precios reales
    ya resueltos) y `plan` (diario/mensual). NO contiene lógica de datos: el
    orquestador (Fleet.vue) provee precios reales fail-soft.

    Jerarquía (mockup card-estatica): badge de categoría superpuesto sobre la
    imagen, modelos como título, precio prominente de marca, specs en chips,
    CTA full-width que abre el modal -> SelectBranch (flujo de reserva intacto).

    Color de marca: #ef9600 = bg-brand-600. Tailwind 4: usar bg-linear-to-* (no
    el alias v3 bg-gradient-to-*, que con tokens @theme renderiza none).
  -->
  <div
    class="bg-[#F4F5F9] rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-gray-200 group flex flex-col"
  >
    <!-- Imagen (full-bleed top); relative para el badge; aspect reserva CLS -->
    <div class="relative aspect-[16/10] bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
      <NuxtImg
        :src="card.image"
        :alt="card.alt"
        width="508"
        height="318"
        sizes="100vw md:50vw lg:380px"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <!-- Badge categoría + transmisión, superpuesto abajo-izquierda -->
      <span class="absolute bottom-3 left-3 bg-brand-600 text-gray-900 font-bold text-sm rounded-lg px-3 py-1.5 shadow-sm">
        {{ card.title }} - {{ card.transmission }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-6 flex flex-col flex-1">
      <!-- Título: modelos -->
      <h3 class="text-xl font-bold font-heading text-gray-900 mb-2 leading-snug">
        {{ card.example }} o similar
      </h3>
      <p class="text-sm text-gray-600 mb-4 leading-snug">{{ card.description }}</p>

      <!-- Price: real; omitido (fail-soft) cuando undefined -->
      <div class="mb-5 min-h-[2.5rem]">
        <p
          v-if="plan === 'daily' && card.dailyPrice !== undefined"
          class="flex items-baseline gap-2 flex-wrap"
        >
          <span class="text-sm text-gray-500">Desde</span>
          <span class="text-3xl font-extrabold font-heading text-brand-600">${{ moneyFormat(card.dailyPrice) }}/día</span>
          <span class="text-sm text-gray-400">+ IVA</span>
        </p>
        <p
          v-else-if="plan === 'monthly' && card.monthlyPrice !== undefined"
          class="flex items-baseline gap-2 flex-wrap"
        >
          <span class="text-sm text-gray-500">Desde</span>
          <span class="text-3xl font-extrabold font-heading text-brand-600">${{ moneyFormat(card.monthlyPrice) }}/mes</span>
          <span class="text-sm font-medium text-emerald-600">IVA incluido</span>
        </p>
      </div>

      <!-- Specs en chips redondeados -->
      <div class="flex flex-wrap items-center gap-2 mb-5">
        <span
          class="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700"
          :title="`${card.passengers} pasajeros`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          {{ card.passengers }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700"
          :title="`${card.luggage} maletas`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h0" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          {{ card.luggage }}
        </span>
        <span class="inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700">
          {{ plan === 'daily' ? 'Kilometraje ilimitado' : '1.000 km/mes incluidos' }}
        </span>
      </div>

      <!-- CTA: drives the internal engine (modal -> SelectBranch) -->
      <!-- hydrate-on-visible (not -interaction): on touch the first tap is
           consumed by interaction-hydration and never opens the modal.
           rootMargin pre-hydrates ~200px early so the island is interactive
           before the thumb arrives on slow devices. -->
      <LazyUModal
        :hydrate-on-visible="{ rootMargin: '200px' }"
        class="mt-auto"
        :ui="{ content: 'bg-white', close: 'bg-black text-white rounded-full' }"
      >
        <template #body>
          <div class="mb-4 text-black text-lg">
            ¿En que ciudad<br>deseas recoger tu carro?
          </div>
          <div class="min-w-80 my-3">
            <SelectBranch variant="gray" />
          </div>
        </template>
        <UButton
          data-testid="fleet-card-cta-test"
          class="block w-full text-center py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-gray-900 font-bold uppercase transition-colors"
        >
          Ver disponibilidad
        </UButton>
      </LazyUModal>
    </div>
  </div>
</template>

<script setup lang="ts">
type Card = {
  code: string
  title: string
  transmission: string
  example: string
  description: string
  passengers: number
  luggage: number
  image: string
  alt: string
  dailyPrice?: number
  monthlyPrice?: number
}

defineProps<{
  card: Card
  plan: 'daily' | 'monthly'
}>()

// Auto-imported layer composable; el card es un objeto plano (no refs), así que
// moneyFormat(card.dailyPrice) opera sobre un number — sin trampa de unwrapping.
const { moneyFormat } = useMoneyFormat()
</script>
