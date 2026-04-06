<template>
  <div class="reservation-resume">
      <div class="carrusel-container">
        <carrusel 
          :models="categoryModels"
          :vehicle-models="vehicleCategories[categoryCode]?.modelos"
          :category="categoryCode"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <!-- lado izquierdo -->
        <div class="reservation-data">
          
          <div class="category-name" v-text="`Gama ${categoryCode}`"></div>
          <div class="category-description" v-text="categoryDescription"></div>
          <div v-if="hasPicoyPlaca()" class="category-picoyplaca" >
            <span class="inline-block px-2 py-0.5 text-xs border border-blue-500 text-blue-600 rounded-full">sin pico y placa</span>
          </div>
          <div class="pickup-info">
            <div class="pickup-location">
              <div class="pickup-location-label">Recogida:</div>
              <div class="pickup-location-text" v-text="selectedPickupLocation?.name"></div>
            </div>
            <div class="pickup-date">
              <div class="pickup-date-label">Fecha</div>
              <div class="pickup-date-text" v-text="formattedPickupDate"></div>
            </div>
            <div class="pickup-hour">
              <div class="pickup-hour-label">Hora</div>
              <div class="pickup-hour-text" v-text="formattedPickupHour"></div>
            </div>
          </div>

          <div class="return-info">
            <div class="return-location">
              <div class="return-location-label">Entrega:</div>
              <div class="return-location-text" v-text="selectedReturnLocation?.name"></div>
            </div>
            <div class="return-date">
              <div class="return-date-label">Fecha</div>
              <div class="return-date-text" v-text="formattedReturnDate"></div>
            </div>
            <div class="return-hour">
              <div class="return-hour-label">Hora</div>
              <div class="return-hour-text" v-text="formattedReturnHour"></div>
            </div>
          </div>

          <div class="renting">
            <div class="renting-label">Alquiler:</div>
            <div class="renting-item">
              {{ selectedDays }} {{ (selectedDays > 1) ? 'días' : 'día' }}
              <span v-if="hasExtraHours() && extraHoursQuantity">
                + {{ extraHoursQuantity }} {{ (extraHoursQuantity > 1) ? 'Horas extras' : 'Hora extra'  }}
              </span>
            </div>
            <div v-if="selectedMonthlyMileage == '1k_kms'" class="renting-item">
              Kilometraje 1.000 kms
            </div>
            <div v-else-if="selectedMonthlyMileage == '2k_kms'" class="renting-item">
              Kilometraje 2.000 kms
            </div>
            <div v-else-if="selectedMonthlyMileage == '3k_kms'" class="renting-item">
              Kilometraje 3.000 kms
            </div>
            <div v-else class="renting-item">Kilometraje ilimitado</div>
            <div class="renting-item">
              {{ haveTotalInsurance ? "Con Seguro total" : "Con Seguro básico"}}
            </div>
          </div>
        </div>
        <!-- lado derecho -->
         <div class="prices">
            <div class="text-right text-sm font-bold">Tarifa Diaria</div>
            <div class="text-right text-sm line-through text-black" v-if="hasDiscount()">
              $ {{ currencyDailyBasePrice }}
            </div>
            <div class="text-right">
              <span class="bg-[#a3f78b] text-black text-xs px-1 inline-block">Dto Hoy {{ getDiscount }} %</span>
            </div>
            <div class="text-right text-sm">
              $ {{ currencyDailyPrice }}
            </div>
            <div v-if="hasExtraHours() || hasReturnFee()" class="text-right mt-3">
              <div class="font-bold">Otras tarifas</div>
              <div v-if="hasExtraHours()">
                {{ extraHoursQuantity }} Horas: $ {{ currencyExtraHoursPrice }}
              </div>
              <div v-if="hasReturnFee()">
                Traslado: $ {{ currencyReturnFee }}
              </div>
            </div>
            
            
            <div class="text-right mt-3">
              <div v-if="withExtraDriver || withBabySeat || withWash" class="font-bold">Adicionales</div>
              <div v-if="withExtraDriver">Conductor: $ {{ currencyExtraDriverPrice }}</div>
              <div v-if="withBabySeat">Silla bebé: $ {{ currencyBabySeatPrice }}</div>
              <div v-if="withWash">Lavado: $ {{ currencyWashPrice }}</div>
            </div>
            
            <div class="text-right mt-3">
              <div class="text-sm font-bold">Total a pagar</div>
              <div class="!text-xl">
                $ {{ currencyTotalPrice }}
              </div>
            </div>
            <div class="text-right text-[10px] text-gray-500">
              No incluye IVA ni tasa admin
            </div>
         </div>
      </div>
  </div>
</template>

<script setup lang="ts">
// Note: composables are auto-imported by Nuxt
import { defineAsyncComponent } from 'vue'
const Carrusel = defineAsyncComponent(() => import('./Carrusel.vue'))

/** types */
import type { ReservationResumeProps } from '@rentacar-main/logic/utils';

/** props */
const props = defineProps<ReservationResumeProps>();

/** stores */
const storeForm = useStoreReservationForm();
const storeSearch = useStoreSearchData();

/** refs */
const {
  categoryModels,
  categoryCode,
  categoryDescription,
  extraHoursQuantity,
  currencyExtraHoursPrice,
  currencyReturnFee,
  currencyTotalPrice,
  currencyDailyBasePrice,
  currencyDailyPrice,
  currencyExtraDriverPrice,
  currencyBabySeatPrice,
  currencyWashPrice,
  numberDays,
  hasPicoyPlaca,
  hasDiscount,
  hasExtraHours,
  hasReturnFee,
  getDiscount,
  hasAdditionalServices,
  withExtraDriver,
  withBabySeat,
  withWash,
} = props.category;

const {
    selectedPickupLocation,
    selectedReturnLocation,
    selectedMonthlyMileage,
    selectedDays,
    haveTotalInsurance,
    humanFormattedPickupDate: formattedPickupDate,
    humanFormattedReturnDate: formattedReturnDate,
    humanFormattedPickupHour: formattedPickupHour,
    humanFormattedReturnHour: formattedReturnHour,
} = storeToRefs(storeForm);

/** vars */
const { vehicleCategories } = useVehicleCategories();

</script>
