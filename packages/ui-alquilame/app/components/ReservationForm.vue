<template>
  <u-form
    ref="reservationForm"
    :state="formState"
    :schema="validationSchema"
    @submit="onSubmit"
    class="light"
  >
      <!-- Requisitos para reservar: texto plano, sin recuadro ni modal anidado
           (el slideover ya es un diálogo; anidar otro reintroduce el bug #65). -->
      <div class="mb-5 text-gray-800">
        <p class="text-sm">
          Completa el formulario con los datos del <strong>titular de la tarjeta de crédito</strong>, incluso si el conductor será otra persona.
        </p>
        <p class="font-heading text-base font-bold text-gray-900 mt-3 mb-1">Requisitos para alquilar:</p>
        <ul class="space-y-1 text-sm">
          <li class="flex items-start gap-2"><span class="vineta-requisito" aria-hidden="true"></span><span>Contar con una tarjeta de crédito</span></li>
          <li class="flex items-start gap-2"><span class="vineta-requisito" aria-hidden="true"></span><span>Ser mayor de edad con cédula o pasaporte</span></li>
          <li class="flex items-start gap-2"><span class="vineta-requisito" aria-hidden="true"></span><span>Contar con licencia de conducción vigente.</span></li>
        </ul>
      </div>

      <!-- Brand section header (alquilame): red accent bar + Jakarta heading.
           Lives inside the white .light form card → dark heading text is correct;
           no [--ctx-text-primary:#fff] override (that is for dark/red surfaces). -->
      <!-- Sin raya de acento y sin rojo: el Resumen reserva el rojo para la
           marca y usa gris-900 en los títulos. Los dos pasos viven en el mismo
           slideover y deben leerse igual. -->
      <div class="mb-4">
        <h3 class="font-heading text-gray-900 text-base font-bold">Tus datos</h3>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <u-form-field name="nombreCompleto" :ui="formFieldUi" label="Nombres">
          <u-input
            v-model="formState.nombreCompleto"
            class="w-full"
            placeholder="Nombres*"
            aria-label="Nombres"
            autocomplete="given-name"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field name="apellidos" :ui="formFieldUi" label="Apellidos">
          <u-input
            v-model="formState.apellidos"
            class="w-full"
            placeholder="Apellidos*"
            aria-label="Apellidos"
            autocomplete="family-name"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field name="tipoIdentificacion" :ui="formFieldUi" label="Tipo de identificación">
          <u-select
            v-model="formState.tipoIdentificacion"
            class="w-full"
            placeholder="ID Tipo*"
            aria-label="Tipo de identificación"
            :items="identificationTypeOptions"
            :ui="selectUi"
          ></u-select>
        </u-form-field>
        <u-form-field name="identificacion" :ui="formFieldUi" label="Número de identificación">
          <u-input
            v-model="formState.identificacion"
            class="w-full"
            placeholder="ID Número*"
            aria-label="Número de identificación"
            :ui="inputUi"
          ></u-input>
        </u-form-field>
        <u-form-field class="col-span-2" name="email" :ui="formFieldUi" label="Correo electrónico">
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
          <label for="telefono" class="block font-medium text-sm text-gray-800 mb-1.5">Teléfono</label>
          <VueTelInput
            v-model="formState.telefono"
            mode="international"
            defaultCountry="CO"
            :dropdownOptions="phoneDropdownOptions"
            :inputOptions="phoneInputOptions"
            :preferred-countries="phonePreferredCountries"
            @blur="validatePhoneField"
          />
          <!-- SCEN-322-X01: deterministic id for the error message so the input's
               aria-describedby (set via phoneInputOptions while invalid) points
               here. UFormField wraps this slot in its own error container. -->
          <template #error="{ error }">
            <span id="telefono-error">{{ error }}</span>
          </template>
        </u-form-field>
        <!-- Conductor adicional (#396): la tarifa lo incluye, así que Localiza
             necesita saber a quién autorizar. El bloque entero cuelga del espejo
             de `withExtraDriver`, que vive en el store de búsqueda. -->
        <template v-if="formState.conductorAdicional">
          <p class="col-span-2 text-sm font-semibold text-gray-900 mt-2">Conductor adicional</p>
          <u-form-field class="col-span-2" name="conductorAdicionalNombre" label="Nombre del conductor adicional">
            <u-input
              v-model="formState.conductorAdicionalNombre"
              class="w-full"
              placeholder="Nombres y apellidos del conductor adicional*"
              aria-label="Nombre del conductor adicional"
              data-testid="extra-driver-name"
              :ui="inputUi"
            ></u-input>
          </u-form-field>
          <u-form-field class="col-span-2" name="conductorAdicionalIdentificacion" label="Cédula o documento del conductor adicional">
            <u-input
              v-model="formState.conductorAdicionalIdentificacion"
              class="w-full"
              placeholder="Cédula o pasaporte del conductor adicional*"
              aria-label="Cédula o documento del conductor adicional"
              data-testid="extra-driver-document"
              :ui="inputUi"
            ></u-input>
          </u-form-field>
          <p class="col-span-2 text-xs text-gray-600" data-testid="extra-driver-notice">
            Enviamos estos datos a Localiza para autorizar al conductor adicional. Avísale que sus
            datos se tratan según nuestra
            <nuxt-link
              class="underline font-medium text-gray-700 hover:text-gray-900"
              to="/politica-privacidad"
              target="_blank"
            >política de tratamiento de la información</nuxt-link>.
          </p>
        </template>
        <u-form-field class="col-span-2" name="politicaPrivacidad">
          <!-- Checkbox y texto como hermanos (no usar el slot label): así clic en
               los enlaces navega sin marcar/desmarcar el checkbox. El cuadrito
               (verde con chulo al marcar) es lo único que togglea. -->
          <div class="flex items-start gap-2">
            <u-checkbox
              v-model="formState.politicaPrivacidad"
              color="success"
              class="mt-0.5"
              aria-label="Acepto los términos y el tratamiento de datos personales"
              data-testid="privacy-consent-checkbox-test"
            />
            <p class="text-sm text-gray-800">
              He leído y estoy de acuerdo con los
              <nuxt-link
                class="underline font-medium text-blue-700 hover:text-blue-800"
                to="/terminos-condiciones"
                target="_blank"
              >términos y condiciones</nuxt-link>
              y con la
              <nuxt-link
                class="underline font-medium text-blue-700 hover:text-blue-800"
                to="/politica-privacidad"
                target="_blank"
              >política de tratamiento de la información</nuxt-link>
            </p>
          </div>
        </u-form-field>
      </div>
    
  </u-form>
</template>

<script setup lang="ts">
import {
  ReservationFormValidationSchema,
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
  conductorAdicionalNombre,
  conductorAdicionalIdentificacion,
  vehiculo,
} = storeToRefs(storeForm);

// Issue #396: el flag del conductor adicional vive en la categoría seleccionada,
// fuera del formState que valida valibot. Se refleja como campo derivado de solo
// lectura para que las reglas cruzadas puedan verlo. Sin este espejo el schema
// recibe `false` por defecto y NUNCA exige los datos — fallo mudo.
const conductorAdicional = computed(() => selectedCategory.value?.withExtraDriver === true);

/** vars */
const identificationTypeOptions = [
  { value: "Cedula Ciudadania", label: "Cédula" },
  { value: "Pasaporte", label: "Pasaporte" },
];

// El label de UFormField sale en zinc-700 por defecto: otra rampa de gris que
// convivía con el gris-800 del resto del cuerpo. Se fuerza la tinta del Resumen.
const formFieldUi = {
  label: 'text-gray-800',
};

const inputUi = {
  base: 'bg-gray-100 border border-gray-300 text-gray-800 py-3',
};

const selectUi = {
  base: 'bg-gray-100 border border-gray-300 py-3',
  value: '!text-gray-800',
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
  conductorAdicional,
  conductorAdicionalNombre,
  conductorAdicionalIdentificacion,
  vehiculo,
};

// Flight schema branch removed (issue 322 SCEN-322-D02).
const reservationFormState = reactive(baseForm);
const formState = ref(
  reservationFormState
);
const validationSchema = ref(
  ReservationFormValidationSchema
);

const reservationForm = ref(null);

// usePhoneField needs formState + reservationForm defined first: it wires the
// telefono revalidation bridge (VueTelInput doesn't integrate with UFormField,
// so the field's error goes stale after the user fixes the number — issue #276).
const {
  phoneDropdownOptions,
  phoneInputOptions,
  phonePreferredCountries,
  validatePhoneField,
} = usePhoneField(reservationForm, () => formState.value.telefono);



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

<style scoped>
/* Punto neutro en vez del emoji de chulo: su verde era el mismo del CTA y del
   pill de descuento, tres señales distintas compartiendo color. `currentColor`
   lo ata a la tinta de cuerpo (gris-800), así que sigue al texto si cambia.
   CSS plano y no @apply: en un <style scoped> las utilidades de Tailwind v4
   necesitan @reference y no vale la pena para tres reglas. */
.vineta-requisito {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 9999px;
  background: currentColor;
}
</style>
