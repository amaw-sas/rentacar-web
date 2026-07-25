<template>
  <div class="categoria categoria-no-disponible">
    <!-- Carrusel del modelo (dimmed via CSS .categoria-no-disponible img) -->
    <div class="carrusel">
      <Carrusel
        :models="categoryModels"
        :vehicleModels="vehicleCategory?.modelos"
        :category="categoryCode"
      />
    </div>

    <!-- Titulo + detalle expandible: misma estructura que las tarjetas
         disponibles (nombre grande + grupo debajo, y la flecha ⌄ abre la
         descripción larga). Antes iba al revés y sin detalle. -->
    <UCollapsible class="contenedor-descripcion-carro">
      <UButton
        class="boton-contenedor-descripcion-carro group"
        size="xl"
        :ui="{
          base: 'rounded-none',
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200',
        }"
      >
        <template #leading>
          <span class="text-left text-gray-700 items-center">
            <span class="descripcion-corta">{{ vehicleCategory?.descripcion_corta }}</span>
            <span class="fila-etiquetas-grupo">
              <span class="categoria-carro">Grupo {{ categoryCode }} ({{ vehicleCategory?.grupo }})</span>
            </span>
          </span>
        </template>
        <template #trailing>
          <ChevronDownIcon cls="size-7" />
        </template>
      </UButton>
      <template #content>
        <div class="px-4 py-0 text-sm">
          <p class="descripcion-larga" v-text="vehicleCategory?.descripcion_larga"></p>
          <div class="contenedor-etiquetas">
            <span
              v-for="tag in vehicleCategory?.tags"
              :key="`tag-${tag}`"
              v-text="tag"
              class="etiqueta-carro"
            ></span>
          </div>
        </div>
      </template>
    </UCollapsible>

    <!-- Razón de no disponibilidad: banner a lo ANCHO de la tarjeta (full-bleed),
         con la línea roja a AMBOS lados. Fondo gris y texto negro; el rojo se
         reserva para el icono de alerta y las líneas laterales. -->
    <div class="bg-gray-100 border-x-4 border-red-500 px-5 py-8 flex items-start gap-2">
      <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
      <div>
        <div class="text-lg font-semibold text-gray-900 leading-tight">No disponible</div>
        <!-- Fecha y sucursal en dos líneas, sin repetir "No disponible" (ya está
             en el título de arriba). -->
        <div
          v-if="isSpecific"
          class="text-sm text-gray-900 mt-0.5 leading-snug"
        >
          <div>el {{ pickupDateLabel }}</div>
          <div>en {{ locationLabel }}</div>
        </div>
        <!-- Invitación dentro del gris; el listado con su título va en el
             cuerpo blanco de abajo. Solo si hay otras sucursales. -->
        <div v-if="nearbyBranches.length" class="text-sm text-gray-900 mt-1">
          Intenta con sucursales cercanas
        </div>
      </div>
    </div>

    <!-- Cuerpo de CTAs: fondo BLANCO. pt más amplio para separar el título
         "Sucursales cercanas:" del banner gris de arriba. -->
    <div class="bg-white px-5 pt-6 pb-4 rounded-b-lg space-y-3">
      <!-- Primero las sucursales cercanas (si la ciudad tiene otras), como
           enlaces verdes a la misma búsqueda; el botón verde va al final. Si no
           hay ninguna, todo el bloque (texto incluido) se oculta. -->
      <div v-if="nearbyBranches.length">
        <p class="text-sm font-semibold text-gray-900">Sucursales cercanas:</p>
        <ul class="mt-3 space-y-1.5">
          <li v-for="branch in nearbyBranches" :key="branch.slug">
            <NuxtLink
              :to="urlForBranch(branch.slug!)"
              class="text-sm font-medium text-green-700 hover:text-green-800 inline-flex items-center gap-1.5"
            >
              <UIcon name="i-lucide-map-pin" class="size-4 text-green-600 shrink-0" />
              {{ branch.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <UButton
        color="neutral"
        size="xl"
        block
        class="bg-green-700 hover:bg-green-800 text-white py-4"
        @click="scrollToSearcher"
      >
        <template #trailing>
          <ChevronRightIcon cls="size-5" />
        </template>
        Probar otras fechas
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/** External */
import { computed, defineAsyncComponent } from 'vue';

/** Internal components */
import ChevronRightIcon from '~/components/Icons/ChevronRightIcon.vue';
import ChevronDownIcon from '~/components/Icons/ChevronDownIcon.vue';
const Carrusel = defineAsyncComponent(() => import('../Carrusel.vue'));

/** Types */
import type { CategoryProps } from '@rentacar-main/logic/utils';

type NearbyBranch = { city: string; name: string; slug?: string };

/** props */
const props = withDefaults(defineProps<CategoryProps>(), {});

/** refs */
const { categoryCode, categoryModels } = props.category;

/** composables (auto-imported via Nuxt layer @rentacar-main/logic) */
const { pickupDateLabel, locationLabel, isSpecific } = useUnavailabilityContext();
const route = useRoute();
const { selectedPickupLocation } = storeToRefs(useStoreReservationForm());

// Otras sucursales de la MISMA ciudad (excluye la actual): TODAS las que haya.
// Reactivo: re-lee el snapshot como useData, para no congelar el sentinel vacío.
const allBranches = computed<NearbyBranch[]>(
  () => useFetchRentacarData().branches as NearbyBranch[],
);
const nearbyBranches = computed<NearbyBranch[]>(() => {
  const current = selectedPickupLocation.value;
  if (!current) return [];
  return allBranches.value.filter(
    (b) => b.city === current.city && b.slug && b.slug !== current.slug,
  );
});

// Enlace a la MISMA búsqueda (mismas fechas/horas) cambiando solo la sucursal:
// intercambia el slug en los segmentos de recogida y devolución de la ruta.
function urlForBranch(slug: string): string {
  return route.path
    .replace(/(\/lugar-recogida\/)[^/]+/, `$1${slug}`)
    .replace(/(\/lugar-devolucion\/)[^/]+/, `$1${slug}`);
}

/** functions */
function scrollToSearcher() {
  if (typeof window === 'undefined') return;
  // Hasta arriba: el buscador vive al tope de /reservas. Ir al ancla intermedia
  // (#searcher) dejaba al usuario a mitad del formulario.
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
