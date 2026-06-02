// External dependencies
import { defineStore } from 'pinia';
import { ref, computed, type WritableComputedRef } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';

// Internal dependencies - stores
import useStoreAdminData from './useStoreAdminData';

// Internal dependencies - composables
import useRecordReservationForm from '../composables/useRecordReservationForm';
import { routeForReservationStatus } from '../utils/reservationStatusRoute';

// Internal dependencies - utils
import {
  createCurrentDateObject,
  createDateFromString,
  createTimeFromString,
  rentalDayCount,
  formatHumanDate,
  formatHumanTime,
  toDatetime,
} from '@rentacar-main/logic/utils';

// Types
import type {
  CategoryType,
  BranchData,
  MonthlyMileage,
  IdentificationType,
  DateObject,
  TimeObject,
  ReservationWithFlightFormValidationSchemaType,
  ReservationFormValidationSchemaType,
} from '@rentacar-main/logic/utils';


const useStoreReservationForm = defineStore("reservationForm", () => {

  // default values
  const defaultFechaRecogida: string = createCurrentDateObject()
    .add({ days: 1 })
    .toString();
  const defaultFechaDevolucion: string = createCurrentDateObject()
    .add({ days: 8 })
    .toString();
  const defaultHoraRecogida: string = '12:00';
  const defaultHoraDevolucion: string = '12:00';

  // stores
  const { searchBranchByCode } = useStoreAdminData();

  // refs
  const nombreCompleto = ref<string | null>(null);
  const apellidos = ref<string | null>(null);
  const tipoIdentificacion = ref<IdentificationType | null>(null);
  const identificacion = ref<string | null>(null);
  const telefono = ref<string | null>(null);
  const email = ref<string | null>(null);

  const aerolinea = ref<string | null>(null);
  const numeroVueloIda = ref<string | null>(null);
  const referido = ref<string | null>(null);

  const vehiculo = ref<CategoryType | null>(null);
  const lugarRecogida = ref<string | null>(null);
  const lugarDevolucion = ref<string | null>(null);
  const fechaRecogida = ref<string | null>(defaultFechaRecogida);
  const fechaDevolucion = ref<string | null>(defaultFechaDevolucion);
  const horaRecogida = ref<string | null>(defaultHoraRecogida);
  const horaDevolucion = ref<string | null>(defaultHoraDevolucion);
  const politicaPrivacidad = ref<boolean | undefined>(true);

  // form states (currently unused, kept for future use)
  // const reservationFormState = reactive({
  //   nombreCompleto,
  //   apellidos,
  //   tipoIdentificacion,
  //   identificacion,
  //   telefono,
  //   email,
  //   vehiculo,
  //   lugarRecogida,
  //   lugarDevolucion,
  //   fechaRecogida,
  //   fechaDevolucion,
  //   horaRecogida,
  //   horaDevolucion,
  //   politicaPrivacidad,
  // })

  // let flightFormState = {
  //   aerolinea,
  //   numeroVueloIda
  // }

  // other vars ref
  const selectedMonthlyMileage = ref<MonthlyMileage | null>(null); // either 2_kms or 3_kms
  const isSubmittingForm = ref<boolean>(false);
  const haveTotalInsurance = ref<boolean>(false);
  const haveMonthlyReservation = ref<boolean>(false);
  const haveFlight = ref<boolean>(false);

  // computed
  const selectedPickupLocation = computed<BranchData | undefined | null>(
    () => lugarRecogida.value ? searchBranchByCode(lugarRecogida.value) : null 
  );

  const selectedReturnLocation = computed<BranchData | undefined | null>(
    () => lugarDevolucion.value ? searchBranchByCode(lugarDevolucion.value) : null
  );

  const selectedPickupDate: WritableComputedRef<DateObject | null> = computed({
    get() { return fechaRecogida.value ? createDateFromString(fechaRecogida.value) : null },
    set(newValue: DateObject) { fechaRecogida.value = newValue?.toString() }
  });

  const selectedPickupHour: WritableComputedRef<TimeObject | null> = computed({
    get() { return horaRecogida.value ? createTimeFromString(horaRecogida.value) : null },
    set(newValue: TimeObject) { horaRecogida.value = newValue?.toString() }
  });

  const selectedReturnDate: WritableComputedRef<DateObject | null> = computed({
    get() { return fechaDevolucion.value ? createDateFromString(fechaDevolucion.value) : null },
    set(newValue: DateObject) { fechaDevolucion.value = newValue?.toString() }
  });

  const selectedReturnHour: WritableComputedRef<TimeObject | null> = computed({
    get() { return horaDevolucion.value ? createTimeFromString(horaDevolucion.value) : null },
    set(newValue: TimeObject) { horaDevolucion.value = newValue?.toString() }
  });

  const fullPickupDate = computed<string | null>(() => {
    return fechaRecogida.value && horaRecogida.value
      ? `${fechaRecogida.value}T${horaRecogida.value}:00`
      : null;
  });

  const fullReturnDate = computed<string | null>(() => {
    return fechaDevolucion.value && horaDevolucion.value
      ? `${fechaDevolucion.value}T${horaDevolucion.value}:00`
      : null;
  });

  const humanFormattedPickupDate = computed<string | undefined>(
    () => selectedPickupDate.value ? formatHumanDate(selectedPickupDate.value) : ''
  );

  const humanFormattedReturnDate = computed<string | undefined>(
    () => selectedReturnDate.value ? formatHumanDate(selectedReturnDate.value) : ''
  );

  const humanFormattedPickupHour = computed<string | undefined>(
    () => selectedPickupHour.value ? formatHumanTime(toDatetime(createCurrentDateObject(), selectedPickupHour.value)) : ''
  );

  const humanFormattedReturnHour = computed<string | undefined>(
    () => selectedReturnHour.value ? formatHumanTime(toDatetime(createCurrentDateObject(), selectedReturnHour.value)) : ''
  );

  const selectedDays = computed<number>(() => {
    const pickupDate = selectedPickupDate.value;
    const returnDate = selectedReturnDate.value;
    if (!pickupDate || !returnDate) return 0;

    // Anchor each calendar date to its selected time-of-day (midnight when an
    // hour isn't picked yet) so the count reflects the real rental window, not
    // just the calendar-day gap. Mirrors the pickup/return datetimes the admin
    // backend prices against.
    const midnight = createTimeFromString('00:00');
    const pickupAt = toDatetime(pickupDate, selectedPickupHour.value ?? midnight);
    const returnAt = toDatetime(returnDate, selectedReturnHour.value ?? midnight);

    return rentalDayCount(pickupAt, returnAt);
  });

  const minPickupDate = computed<DateObject>(() => {
    return createCurrentDateObject();
  });

  const maxReturnDate = computed<DateObject | undefined>(() => {
    return selectedPickupDate.value
      ? selectedPickupDate.value.add({ days: 30 })
      : undefined;
  });

  // functions
  const registerConvertion = () => {
    const router = useRouter();
    router.push({ path: "/thanks" });
  };

  const serverFailed = () => {
    // submitingError.value =
    //   "Hubo un error al enviar la información. Por favor intentelo de nuevo.";
  };

  // Strip the reservation UI state from the current URL via history.replaceState
  // BEFORE navigating to a result page. Two pieces are cleared:
  //   - `?reservar=<code>` query → otherwise Back auto-reopens the form slideover
  //     and reka-ui Dialog modal lock blocks the Searcher even with `:overlay="false"`.
  //   - `/categoria/<code>` path segment → otherwise Back auto-reopens the resume
  //     slideover with a stale selectedCategory; a second submit from there hits
  //     the admin with a consumed reference_token (or duplicate) and is rejected
  //     as "sin_disponibilidad".
  // Clearing both means Back lands on the bare search URL, doSearch refreshes
  // availability, and the user starts a new reservation from a fresh state.
  const stripReservarParam = () => {
    if (!import.meta.client) return;
    const cleanPath = window.location.pathname.replace(/\/categoria\/[^/]+$/, '');
    const alreadyClean =
      cleanPath === window.location.pathname &&
      !window.location.search &&
      !window.location.hash;
    if (alreadyClean) return;
    window.history.replaceState(window.history.state, '', cleanPath);
  };

  const submitForm = async (_event: FormSubmitEvent<ReservationFormValidationSchemaType | ReservationWithFlightFormValidationSchemaType>) => {
    isSubmittingForm.value = true;

    const { data: dataRecord, error: errorRecord } =
      await useRecordReservationForm();

    if (dataRecord.value) {
      isSubmittingForm.value = false;

      const route = routeForReservationStatus(
        dataRecord.value.reservationStatus,
        dataRecord.value.reserveCode,
      );
      if (route) {
        stripReservarParam();
        navigateTo({ path: route });
      }

      return;
    } else if (errorRecord.value) {
      stripReservarParam();
      navigateTo({path: "/sindisponibilidad"});
    }

    isSubmittingForm.value = false;
  };

  return {
    // validation fields
    nombreCompleto,
    apellidos,
    tipoIdentificacion,
    identificacion,
    telefono,
    email,
    vehiculo,
    lugarRecogida,
    fechaRecogida,
    horaRecogida,
    lugarDevolucion,
    fechaDevolucion,
    horaDevolucion,
    aerolinea,
    numeroVueloIda,
    politicaPrivacidad,
    referido,
    // other vars
    selectedDays,
    selectedMonthlyMileage,
    isSubmittingForm,
    haveTotalInsurance,
    haveMonthlyReservation,
    haveFlight,
    // functions
    registerConvertion,
    serverFailed,
    submitForm,
    // computed functions
    selectedPickupLocation,
    selectedReturnLocation,
    selectedPickupDate,
    selectedPickupHour,
    selectedReturnDate,
    selectedReturnHour,
    fullPickupDate,
    fullReturnDate,
    minPickupDate,
    maxReturnDate,
    humanFormattedPickupDate,
    humanFormattedReturnDate,
    humanFormattedPickupHour,
    humanFormattedReturnHour,
  };
});

export default useStoreReservationForm;