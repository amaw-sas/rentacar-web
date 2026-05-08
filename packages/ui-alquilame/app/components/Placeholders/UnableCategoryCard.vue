<template>
  <div class="categoria categoria-no-disponible">
    <!-- Banner top: razon concreta de no disponibilidad -->
    <div class="bg-red-50 border-l-4 border-red-500 px-4 py-3 flex items-start gap-2">
      <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
      <div>
        <div class="text-sm font-semibold text-red-800">No disponible</div>
        <div
          v-if="bannerText !== 'No disponible para tu búsqueda'"
          class="text-xs text-red-700 mt-0.5"
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

    <!-- Bloque inferior: titulo + CTAs -->
    <div class="contenedor-descripcion-carro px-5 py-4">
      <div class="text-gray-600 text-sm">Grupo {{ categoryCode }}</div>
      <h3 class="text-2xl font-semibold mt-1 text-gray-800">
        {{ vehicleCategory?.descripcion_corta }}
      </h3>

      <div class="space-y-2 mt-4">
        <UButton
          color="neutral"
          size="lg"
          block
          class="bg-gray-900 hover:bg-black text-white"
          @click="scrollToSearcher"
        >
          <template #trailing>
            <ChevronRightIcon cls="size-5" />
          </template>
          Probar otras fechas
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          block
          class="text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50"
          @click="scrollToSearcher"
        >
          <template #trailing>
            <ChevronRightIcon cls="size-5" />
          </template>
          Cambiar sucursal
        </UButton>
      </div>
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
const { bannerText } = useUnavailabilityContext();

/** functions */
function scrollToSearcher() {
  if (typeof document === 'undefined') return;
  document.getElementById('searcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
