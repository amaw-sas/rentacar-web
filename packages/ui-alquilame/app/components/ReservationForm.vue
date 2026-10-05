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
        <u-form-field
          class="col-span-2"
          name="tipoLicencia"
          :ui="formFieldUi"
          label="¿Tu licencia de conducción es colombiana o extranjera?"
        >
          <u-radio-group
            v-model="formState.tipoLicencia"
            orientation="horizontal"
            :items="licenseTypeOptions"
            aria-label="¿Tu licencia de conducción es colombiana o extranjera?"
            data-testid="driver-license-type"
          />
        </u-form-field>
        <!-- Región viva SIEMPRE montada: si naciera con el v-if junto al texto,
             el lector de pantalla no anuncia el primer aviso. El aviso es solo
             UI: no viaja en el payload (useRecordReservationForm no lo lee). -->
        <div class="col-span-2" role="status" aria-live="polite">
          <p
            v-if="licenseNotice"
            class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            data-testid="license-document-notice"
          >{{ licenseNotice }}</p>
        </div>
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
          <component
            :is="phoneComponent"
            v-if="phoneComponent"
            v-model="formState.telefono"
            mode="international"
            :default-country="phoneInitialCountry"
            :dropdownOptions="phoneDropdownOptions"
            :inputOptions="phoneInputOptions"
            :preferred-countries="phonePreferredCountries"
            @blur="validatePhoneField"
            @country-changed="onPhoneCountryChanged"
          />
          <!-- Holds the input's place. id="telefono" + tabindex="-1" let the
               first-invalid-field scroll land here while the input is missing. -->
          <div v-else id="telefono" tabindex="-1">
            <!-- A failed import stays failed for the life of the page
                 (whatwg/html#6768): only a reload brings the field back.
                 force: a click must reload even inside reloadNuxtApp's 10 s
                 loop guard. -->
            <div
              v-if="phoneLoadFailed"
              role="alert"
              class="flex min-h-[46px] flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              <span>No pudimos cargar el campo del teléfono.</span>
              <button
                type="button"
                class="underline font-medium text-blue-700 hover:text-blue-800"
                @click="reloadNuxtApp({ force: true })"
              >Recargar la página</button>
            </div>
            <!-- Same height and frame as the loaded .vue-tel-input (46px measured
                 in the browser on the 3 brands: 1px border + 44px input), so the
                 fields below don't jump when it swaps in. -->
            <div
              v-else
              aria-hidden="true"
              class="h-[46px] rounded-lg border border-gray-400 bg-gray-100"
            ></div>
          </div>
          <!-- SCEN-016..018: a Colombian mobile typed under a foreign flag is
               also a valid number there, so this is help text, never an error. -->
          <!-- Always mounted: a live region that appears with v-if is often not announced. -->
          <p id="telefono-hint" aria-live="polite" class="text-xs text-amber-800" :class="{ 'mt-1.5': showColombianMobileHint }"><span v-if="showColombianMobileHint">¿Es un celular de Colombia? Cambia la bandera a Colombia.</span></p>
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
          <p class="col-span-2 font-heading text-base font-bold text-gray-900 mt-2">Conductor adicional</p>
          <u-form-field class="col-span-2" name="conductorAdicionalNombre" :ui="formFieldUi" label="Nombre del conductor adicional">
            <u-input
              v-model="formState.conductorAdicionalNombre"
              class="w-full"
              placeholder="Nombres y apellidos del conductor adicional*"
              aria-label="Nombre del conductor adicional"
              data-testid="extra-driver-name"
              :ui="inputUi"
            ></u-input>
          </u-form-field>
          <u-form-field class="col-span-2" name="conductorAdicionalIdentificacion" :ui="formFieldUi" label="Cédula o documento del conductor adicional">
            <u-input
              v-model="formState.conductorAdicionalIdentificacion"
              class="w-full"
              placeholder="Cédula o pasaporte del conductor adicional*"
              aria-label="Cédula o documento del conductor adicional"
              data-testid="extra-driver-document"
              :ui="inputUi"
            ></u-input>
          </u-form-field>
          <p class="col-span-2 text-xs text-gray-800" data-testid="extra-driver-notice">
            Enviamos estos datos a Localiza para autorizar al conductor adicional. Avísale que sus
            datos se tratan según nuestra
            <nuxt-link
              class="underline font-medium text-blue-700 hover:text-blue-800"
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
  DRIVER_LICENSE_OPTIONS,
  driverLicenseNotice,
  shouldHintColombianMobile,
} from '@rentacar-main/logic/utils';

// The phone field appears only once the input component, the full phone
// metadata and the visitor's country are ready (see usePhoneFieldLoader).
// A flag change alone leaves `telefono` untouched, so the debounced revalidation
// never runs: re-check here, only while an error is showing.
const { phoneComponent, phoneInitialCountry, phoneLoadFailed, onPhoneCountryChanged } =
  usePhoneFieldLoader(() => import('vue-tel-input').then((m) => m.VueTelInput), {
    onCountryChanged: () => {
      if (phoneFieldInvalid.value) validatePhoneField();
    },
  });

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
  tipoLicencia,
  telefono,
  telefonoPais,
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

// Pregunta de licencia: textos y opciones viven en packages/logic (una sola
// fuente para las 3 marcas). El spread evita el readonly del `as const`.
const licenseTypeOptions = [...DRIVER_LICENSE_OPTIONS];
const licenseNotice = computed(() => driverLicenseNotice(tipoLicencia.value));

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
  tipoLicencia,
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
  phoneFieldInvalid,
  validatePhoneField,
} = usePhoneField(reservationForm, () => formState.value.telefono);

// Flag on screen vs typed number (SCEN-016..018). The field only mounts once
// the validator is loaded, so both inputs here are reactive refs.
const showColombianMobileHint = computed(() => shouldHintColombianMobile(formState.value.telefono, telefonoPais.value));



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
