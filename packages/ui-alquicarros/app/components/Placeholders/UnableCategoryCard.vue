<template>
  <div class="categoria categoria-no-disponible">
    <!-- Banner top: razon concreta de no disponibilidad -->
    <div class="bg-red-50 border-l-4 border-red-500 px-4 py-3 flex items-start gap-2">
      <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
      <div>
        <div class="text-2xl font-semibold text-red-800 leading-tight">No disponible</div>
        <div
          v-if="isSpecific"
          class="text-sm text-red-700 mt-0.5"
        >
          {{ bannerText }}
        </div>
      </div>
    </div>

    <!-- Carrusel del modelo (dimmed via CSS .categoria-no-disponible img) -->
    <div class="carrusel">
      <Carrusel
        :models="categoryModels"
        :vehicleModels="vehicleCategory?.modelos"
        :category="categoryCode"
      />
    </div>

    <!-- Bloque inferior: titulo de categoria -->
    <div class="contenedor-descripcion-carro px-5 pt-4 pb-3">
      <div class="categoria-carro text-gray-700">Grupo {{ categoryCode }}</div>
      <h3 class="text-2xl font-semibold mt-1 text-gray-800">
        {{ vehicleCategory?.descripcion_corta }}
      </h3>
    </div>

    <!-- Cuerpo de CTAs: fondo difuminado (sutil-fondo) que separa los botones
         del titulo, espejo del cuerpo de precios de la tarjeta disponible -->
    <div class="sutil-fondo px-5 py-4 rounded-b-lg space-y-2">
      <UButton
        color="neutral"
        size="xl"
        block
        class="bg-gray-900 hover:bg-black text-white py-4"
        @click="scrollToSearcher"
      >
        <template #trailing>
          <ChevronRightIcon cls="size-5" />
        </template>
        Probar otras fechas
      </UButton>

      <UButton
        color="neutral"
        size="xl"
        block
        class="bg-gray-900 hover:bg-black text-white py-4"
        @click="scrollToSearcher"
      >
        <template #trailing>
          <ChevronRightIcon cls="size-5" />
        </template>
        Probar otra sucursal cercana
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/** External */
import { defineAsyncComponent } from 'vue';

/** Internal components */
import ChevronRightIcon from '~/components/Icons/ChevronRightIcon.vue';
const Carrusel = defineAsyncComponent(() => import('../Carrusel.vue'));

/** Types */
import type { CategoryProps } from '@rentacar-main/logic/utils';

/** props */
const props = withDefaults(defineProps<CategoryProps>(), {});

/** refs */
const { categoryCode, categoryModels } = props.category;

/** composables (auto-imported via Nuxt layer @rentacar-main/logic) */
const { bannerText, isSpecific } = useUnavailabilityContext();

/** functions */
function scrollToSearcher() {
  if (typeof document === 'undefined') return;
  document.getElementById('searcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
