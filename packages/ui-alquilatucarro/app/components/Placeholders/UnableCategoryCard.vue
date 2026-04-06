<template>
  <div class="categoria categoria-no-disponible">
    <div class="carrusel">
      <Carrusel
        :models="categoryModels"
        :vehicleModels="vehicleCategory?.modelos"
        :category="categoryCode"
      />
    </div>

    <UCollapsible class="contenedor-descripcion-carro" default-open>
      <UButton 
        class="boton-contenedor-descripcion-carro group"
        size="xl"
        :ui="{
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
        }"
      >
        <template #trailing>
          <ChevronDownIcon cls="size-5" />
        </template>
        <template #leading>
          <span class="text-left text-gray-700">
            <span class="categoria-carro">
                Grupo {{ categoryCode }}
                <span class="inline-block px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">no disponible</span>
            </span>
            <span class="descripcion-corta">
                {{ vehicleCategory?.descripcion_corta }}
            </span>
          </span>
        </template>

          <!-- <Icon :id="iconID" name="rentacar-reservas-icons:fle" alt="flecha" class="flecha" /> -->
      </UButton>
      <template #content>
        <div class=" text-gray-700">
          <div class="px-4 py-0 text-sm">
              <p class="descripcion-larga" v-text="vehicleCategory?.descripcion_larga"></p>
              <div id="etiquetas" class="contenedor-etiquetas">
                  <span
                    v-for="tag in vehicleCategory?.tags"
                    :key="`tag-${tag}`"
                    v-text="tag"
                    class="etiqueta-carro"
                  ></span>

              </div>
          </div>
        </div>   
      </template>
    </UCollapsible>

  </div>
</template>

<script setup lang="ts">
import type { CategoryProps } from '@rentacar-main/logic/utils';

/** types */

/** props */
const props = withDefaults(defineProps<CategoryProps>(), {});

/** refs */
const {
  categoryCode,
  categoryModels,
  categoryDescription
} = props.category;

const categoryID: string = `category-${categoryCode}`;
const contentID: string = `content-${categoryID}`;
const aditionalID: string = `aditional-${categoryID}`;
const iconID: string = `icon-${categoryID}`;

import { defineAsyncComponent } from 'vue'
const Carrusel = defineAsyncComponent(() => import('../Carrusel.vue'))
import ChevronDownIcon from '~/components/Icons/ChevronDownIcon.vue'



</script>
