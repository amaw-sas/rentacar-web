<template>
  <u-form
    :state="formState"
    :schema="validationSchema"
    @submit="submitForm"
    class="flex flex-col gap-3"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-30 items-start">
      <ReservationResume :category="selectedCategory" :show-button="false" />
      <ReservationForm :form-state />
    </div>
    <div class="flex flex-row justify-end gap-2">
      <u-button
        color="info"
        >Anterior
        <template #leading>
          <ChevronLeftIcon cls="size-5" />
        </template>
      </u-button>
      <u-button 
        type="submit"
        :loading="isSubmittingForm"
        :disabled="isSubmittingForm"
        >Solicitar reserva
        <template #trailing>
          <ChevronRightIcon cls="size-5" />
        </template>
      </u-button>
    </div>
  </u-form>
</template>

<script setup lang="ts">
/** stores */
import {
  IconsChevronLeftIcon as ChevronLeftIcon,
  IconsChevronRightIcon as ChevronRightIcon,
} from '#components'
const storeSearch = useStoreSearchData();
const storeForm = useStoreReservationForm();

/** vars */
const { selectedCategory } = storeToRefs(storeSearch);
const {
  nombreCompleto,
  apellidos,
  identificacion,
  tipoIdentificacion,
  telefono,
  email,
  politicaPrivacidad,
  aerolinea,
  numeroVueloIda,
  vehiculo,
  haveFlight,
  isSubmittingForm,
} = storeToRefs(storeForm);

const baseForm = {
  nombreCompleto,
  apellidos,
  identificacion,
  tipoIdentificacion,
  telefono,
  email,
  politicaPrivacidad,
  vehiculo,
};

const reservationFormState = reactive(baseForm);
const reservationWithFlightFormState = reactive({
  ...baseForm,
  aerolinea,
  numeroVueloIda,
});

const formState = ref(
  haveFlight.value ? reservationWithFlightFormState : reservationFormState
);
const validationSchema = ref(
  haveFlight.value
    ? ReservationWithFlightFormValidationSchema
    : ReservationFormValidationSchema
);

/** functions */
const { submitForm } = storeForm;
</script>

