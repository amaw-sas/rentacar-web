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
  dayDifference,
  rentalDayCount,
  extraHourChipLabel,
  formatHumanDate,
  formatHumanDateShort,
  formatHumanTime,
  toDatetime,
  buildAttributionTouch,
  persistAttribution,
  readStoredAttribution,
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
  AttributionInput,
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

  // Marketing attribution (click-id + utm + external referrer). Captured by the
  // per-brand client plugin on load; the record composable reads it at submit.
  const attribution = ref<AttributionInput | null>(null);

  // Client-only. Reads the current URL + referrer; if this load is a real touch
  // (has a click-id/utm or an external referrer) it overwrites the stored
  // last-touch. Otherwise it seeds from storage so a signal captured earlier in
  // the funnel survives to the reservation. Never throws — attribution must
  // never break hydration or the reservation flow.
  function captureAttribution(): void {
    if (typeof window === 'undefined') return;
    try {
      const { attribution: touch, isTouch } = buildAttributionTouch(
        window.location.search,
        document.referrer,
        window.location.hostname,
      );
      if (isTouch) {
        attribution.value = touch;
        persistAttribution(touch);
      } else if (attribution.value === null) {
        attribution.value = readStoredAttribution();
      }
    } catch {
      /* never block the flow on attribution capture */
    }
  }
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
  // Tras enviar, el código del vehículo cuya entrada `/categoria/X` puede quedar
  // en el historial (el slideover empuja entradas; ver CategorySelectionSection).
  // El watcher de auto-apertura lo consulta para NO reabrir el slideover si el
  // usuario retrocede hasta esa entrada después de enviar. One-shot por código.
  const lastSubmittedCode = ref<string | null>(null);
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

  const humanFormattedPickupDateShort = computed<string | undefined>(
    () => selectedPickupDate.value ? formatHumanDateShort(selectedPickupDate.value) : ''
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

  // Calendar-day span between pickup and return (issue #152). Plain date
  // subtraction — ignores time-of-day, unlike selectedDays/rentalDayCount which
  // counts billable days. Drives the day-count chip in the Searcher; returns 0
  // when either date is missing so the chip can hide (empty state).
  const rentalDays = computed<number>(() => {
    const pickupDate = selectedPickupDate.value;
    const returnDate = selectedReturnDate.value;
    if (!pickupDate || !returnDate) return 0;

    return dayDifference(pickupDate, returnDate);
  });

  // Extra-hour surcharge hint for the Searcher's return-hour chip. Delegates to
  // extraHourChipLabel, which compares the chosen TIME-OF-DAY of return vs pickup
  // (not the full datetime) so it stays consistent with the calendar-day chip
  // (rentalDays) and with the GRACE_HOURS billing rule.
  const extraHoursLabel = computed<string | null>(() =>
    extraHourChipLabel(selectedPickupHour.value, selectedReturnHour.value)
  );

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
    // Marcar el código enviado: el slideover empuja entradas `/categoria/X` al
    // historial; sin esto, retroceder hasta ellas tras enviar reabriría el
    // resumen. El watcher de auto-apertura las ignora una vez (one-shot).
    lastSubmittedCode.value = vehiculo.value;
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
    lastSubmittedCode,
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
    attribution,
    // other vars
    selectedDays,
    rentalDays,
    extraHoursLabel,
    selectedMonthlyMileage,
    isSubmittingForm,
    haveTotalInsurance,
    haveMonthlyReservation,
    haveFlight,
    // functions
    captureAttribution,
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
    humanFormattedPickupDateShort,
    humanFormattedReturnDate,
    humanFormattedPickupHour,
    humanFormattedReturnHour,
  };
});

export default useStoreReservationForm;