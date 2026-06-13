<template>
  <!-- Persona Section -->
  <UPageSection
    id="requisitos"
    orientation="horizontal"
    :reverse="true"
    class="bg-gray-200 text-black scroll-mt-20"
  >
    <template #title>
      <span class="block text-2xl md:text-3xl text-center">
        <span class="text-red-700">Requisitos</span>{{ ' ' }}<span class="text-black">para tu alquiler</span>
      </span>
    </template>
    <template #description>
      <div class="text-black justify-items-center">
        <div class="mb-4 text-center">
          En {{ franchise.shortname }} tu experiencia es sin complicaciones...
        </div>
        <ul class="flex flex-col gap-4">
          <li class="flex items-start gap-2">
            <IconsLocationIcon cls="text-red-600 size-5 mt-0.5" />
            <div>
              <div class="font-bold text-black">RESERVA PREVIA</div>
              <div class="text-black text-sm">(más anticipación más descuento)</div>
            </div>
          </li>
          <li class="flex items-start gap-2">
            <IconsLocationIcon cls="text-red-600 size-5 mt-0.5" />
            <div>
              <div class="font-bold text-black">DOCUMENTO DE IDENTIDAD</div>
              <div class="text-black text-sm">(18+ Cédula o pasaporte original)</div>
            </div>
          </li>
          <li class="flex items-start gap-2">
            <IconsLocationIcon cls="text-red-600 size-5 mt-0.5" />
            <div>
              <div class="font-bold text-black">TARJETA DE CRÉDITO</div>
              <div class="text-black text-sm">(Única forma de pago)</div>
            </div>
          </li>
          <li class="flex items-start gap-2">
            <IconsLocationIcon cls="text-red-600 size-5 mt-0.5" />
            <div>
              <div class="font-bold text-black">LICENCIA DE CONDUCIR</div>
              <div class="text-black text-sm">(física y vigente)</div>
            </div>
          </li>
        </ul>
      </div>
    </template>
    <template #default>
      <!-- CLS fix: reservar espacio con aspect-ratio antes de que cargue la imagen -->
      <div class="w-full aspect-[100/81]">
        <LazyImagesPersona hydrate-on-visible />
      </div>
    </template>
  </UPageSection>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig();
</script>
