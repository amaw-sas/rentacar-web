<template>
  <!--
    Card lean de vehículo (Paso 2 nivel 2). Reúso REDUCIDO de CategoryCard: solo
    carrusel + specs + precio + "Elegir" — SIN los radios de seguro ni el bloque
    de adicionales (esos son Pasos 3 y 4 del wizard). Al elegir emite la instancia
    useCategory (mismo contrato que CategoryCard @selected-category), para que el
    step fije `selectedCategory` y avance.
  -->
  <div
    class="flex flex-col overflow-hidden rounded-2xl border bg-white transition-colors"
    :class="selected ? 'border-brand-600 ring-2 ring-brand-600' : 'border-gray-200'"
    :data-testid="`wizard-vehicle-${categoryCode}-test`"
  >
    <div class="carrusel">
      <Carrusel
        :models="categoryModels"
        :vehicle-models="modelos"
        :category="categoryCode"
        :priority="priority"
      />
    </div>

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h4 class="heading-sub text-gray-900">
          Grupo {{ categoryCode }}
          <span class="body-sm font-normal text-gray-500">({{ grupo }})</span>
        </h4>
        <p v-if="vehicleCategory?.descripcion_corta" class="body-sm text-gray-500">
          {{ vehicleCategory.descripcion_corta }}
        </p>
      </div>

      <div class="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
        <div>
          <p class="body-xs text-gray-400">Precio total · {{ getFormattedDays }}</p>
          <p class="price-md font-heading text-brand-700">$ {{ currencyTotalPrice }}</p>
          <p class="body-xs text-gray-400">$ {{ currencyDailyPrice }} / día</p>
        </div>
        <UButton
          size="lg"
          class="shrink-0 justify-center rounded-full font-bold"
          :class="
            selected
              ? 'bg-brand-100 text-brand-800 hover:bg-brand-200'
              : 'bg-brand-600 text-gray-900 hover:bg-brand-700'
          "
          :data-testid="`wizard-select-${categoryCode}-test`"
          @click="$emit('select', category)"
        >
          <template v-if="selected" #leading>
            <UIcon name="i-lucide-check" class="size-5" />
          </template>
          {{ selected ? 'Elegido' : 'Elegir' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// External
import { computed, defineAsyncComponent } from 'vue'

// Types
import type { CategoryAvailabilityData, VehicleCategory } from '@rentacar-main/logic/utils'

const Carrusel = defineAsyncComponent(() => import('../Carrusel.vue'))

// Props tipados explícitos (NO reúso CategoryProps: su `vehicleCategory` está mal
// tipado como el mapa VehicleCategoryData en vez de la entrada VehicleCategory).
// `priority` es local a la card (LCP de la primera del segmento).
const props = withDefaults(
  defineProps<{
    category: CategoryAvailabilityData
    vehicleCategory?: VehicleCategory
    priority?: boolean
    selected?: boolean
  }>(),
  {
    priority: false,
    selected: false,
  },
)

defineEmits<{
  select: [category: ReturnType<typeof useCategory>]
}>()

// Instancia useCategory para los precios de ESTA gama. Se emite tal cual al
// elegir; el step la fija como selectedCategory (mismo contrato que CategoryCard).
const category: ReturnType<typeof useCategory> = useCategory(props.category)
const { categoryCode, categoryModels, currencyTotalPrice, currencyDailyPrice, getFormattedDays } =
  category

const modelos = computed(() => props.vehicleCategory?.modelos ?? [])
const grupo = computed(() => props.vehicleCategory?.grupo ?? '')
</script>
