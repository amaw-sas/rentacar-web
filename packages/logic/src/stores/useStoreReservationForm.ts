// External dependencies
import { defineStore } from 'pinia';
import { ref, computed, type WritableComputedRef } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';

// Internal dependencies - stores
import useStoreAdminData from './useStoreAdminData';

// Internal dependencies - composables
import useRecordReservationForm from '../composables/useRecordReservationForm';

// Internal dependencies - utils
import {
  createCurrentDateObject,
  createDateFromString,
  createTimeFromString,
  dayDifference,
  hourDifference,
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
    let days = 0;
    let hours = selectedHours.value;

    if (selectedPickupDate.value && selectedReturnDate.value) {
      days = dayDifference(selectedPickupDate.value, selectedReturnDate.value);
      if (days == 0) {
        if (hours > 0) days = 1;
      } else if (days > 0 && hours > 4) {
        days++;
      }
    }

    return days;
  });

  const selectedHours = computed<number>(() => {
    return selectedPickupHour.value && selectedReturnHour.value
      ? hourDifference(selectedPickupHour.value, selectedReturnHour.value)
      : 0;
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

  const submitForm = async (_event: FormSubmitEvent<ReservationFormValidationSchemaType | ReservationWithFlightFormValidationSchemaType>) => {
    isSubmittingForm.value = true;

    const { data: dataRecord, error: errorRecord } =
      await useRecordReservationForm();

    if (dataRecord.value) {
      console.log("record ok");
      isSubmittingForm.value = false;
      
      if(dataRecord.value.reservationStatus == "Pendiente")
        navigateTo({path: "/pendiente"});
      else if(dataRecord.value.reservationStatus == "Confirmado"){
        navigateTo({path: `/reservado/${dataRecord.value.reserveCode}`});
      }
        
      return;
    } else if (errorRecord.value)
      navigateTo({path: "/sindisponibilidad"});

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