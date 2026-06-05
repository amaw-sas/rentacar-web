<template>
  <u-form
    ref="reservationForm"
    :state="formState"
    :schema="validationSchema"
    @submit="onSubmit"
    class="light"
  >
      <div class="grid grid-cols-2 gap-2">
        <u-form-field name="nombreCompleto" label="Nombres">
          <u-input
            v-model="formState.nombreCompleto"
            class="w-full"
            placeholder="Nombres*"
            aria-label="Nombres"
            autocomplete="given-name"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field name="apellidos" label="Apellidos">
          <u-input
            v-model="formState.apellidos"
            class="w-full"
            placeholder="Apellidos*"
            aria-label="Apellidos"
            autocomplete="family-name"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field name="tipoIdentificacion" label="Tipo de identificación">
          <u-select
            v-model="formState.tipoIdentificacion"
            class="w-full"
            placeholder="ID Tipo*"
            aria-label="Tipo de identificación"
            :items="identificationTypeOptions"
            :ui="selectUi"
          ></u-select>
        </u-form-field>
        <u-form-field name="identificacion" label="Número de identificación">
          <u-input
            v-model="formState.identificacion"
            class="w-full"
            placeholder="ID Número*"
            aria-label="Número de identificación"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field class="col-span-2" name="email" label="Correo electrónico">
          <u-input
            v-model="formState.email"
            class="w-full"
            placeholder="Email*"
            aria-label="Correo electrónico"
            autocomplete="email"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field class="col-span-2" name="telefono">
          <!-- VueTelInput no usa useFormField, así que el label autogenerado de
               UFormField (for=useId()) no asocia su <input>. Label propio con
               for="telefono" ↔ inputOptions.id="telefono" → nombre accesible
               "Teléfono" determinista (issue #65 SCEN-008). -->
          <label for="telefono" class="block font-medium text-sm text-gray-900 mb-1.5">Teléfono</label>
          <VueTelInput
            v-model="formState.telefono"
            mode="international"
            defaultCountry="CO"
            :dropdownOptions="phoneDropdownOptions"
            :inputOptions="phoneInputOptions"
            :preferred-countries="phonePreferredCountries"
          />
        </u-form-field>
        <u-form-field class="col-span-2" name="politicaPrivacidad">
          <u-checkbox
            v-model="formState.politicaPrivacidad"
            color="neutral"
            label="He leído y estoy de acuerdo con los términos y condiciones como de la política de tratamiento de la información"
            :ui="{
              label: '!text-black text-sm',
              base: 'bg-gray-100 border border-gray-400 rounded',
            }"
          />
          <div class="ml-6 text-sm space-x-3">
            <nuxt-link
              class="underline text-gray-600"
              to="/terminos-condiciones"
              target="_blank"
            >Términos</nuxt-link>
            <nuxt-link
              class="underline text-gray-600"
              to="/politica-privacidad"
              target="_blank"
            >Privacidad</nuxt-link>
          </div>
        </u-form-field>
      </div>
    
  </u-form>
</template>

<script setup lang="ts">
import {
  ReservationFormValidationSchema,
  ReservationWithFlightFormValidationSchema,
} from '@rentacar-main/logic/utils';

// Lazy load vue-tel-input (solo se carga cuando se renderiza el formulario)
const VueTelInput = defineAsyncComponent(() =>
  import('vue-tel-input').then(m => m.VueTelInput)
);

/** stores */
const storeSearch = useStoreSearchData();
const storeForm = useStoreReservationForm();

/** refs */
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
} = storeToRefs(storeForm);

/** vars */
const {
  phoneDropdownOptions,
  phoneInputOptions,
  phonePreferredCountries,
} = usePhoneField();


const identificationTypeOptions = [
  { value: "Cedula Ciudadania", label: "Cédula" },
  { value: "Pasaporte", label: "Pasaporte" },
];

const inputUi = {
  base: 'bg-gray-100 border border-gray-300 text-black py-3',
};

const selectUi = {
  base: 'bg-gray-100 border border-gray-300 py-3',
  value: '!text-black',
  placeholder: '!text-gray-500',
};

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

const reservationForm = ref(null);



/** emits */
const emit = defineEmits(['submit']);
const submit = () => {
  reservationForm.value.submit();
}
defineExpose({submit});

/** functions */
const onSubmit = (event) => {
  emit('submit', event.data)
}

</script>
