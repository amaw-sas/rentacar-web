// External dependencies
import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { watchDebounced } from "@vueuse/core";

// Internal dependencies - stores
import useStoreAdminData from '../stores/useStoreAdminData';
import useStoreSearchData from '../stores/useStoreSearchData';
import useStoreReservationForm from '../stores/useStoreReservationForm';

// Internal dependencies - composables
import useMessages from './useMessages';

// Internal dependencies - utils
import {
  createTimeFromString,
  createCurrentDateObject,
  toDatetime,
  formatHumanTime,
  formatTime,
  formatTime12h,
} from '@rentacar-main/logic/utils';

// Types
import type { BranchData } from '@rentacar-main/logic/utils';

// Opciones de hora estáticas (se generan una sola vez al cargar el módulo)
// Evita regenerar 48 opciones en cada re-render
const generateHourOptions = () => {
  const options: Array<{ value: string; label: string }> = [];
  let initHour = createTimeFromString('00:00');
  const endHour = createTimeFromString('23:30');

  while (initHour.compare(endHour) < 0) {
    if (initHour.toString() === "00:00:00") {
      options.push({ value: "00:00", label: "MEDIANOCHE" });
    } else if (initHour.toString() === "12:00:00") {
      options.push({ value: "12:00", label: "MEDIODIA" });
    } else {
      const datetime = toDatetime(createCurrentDateObject(), initHour);
      options.push({ value: formatTime(datetime), label: formatHumanTime(datetime) });
    }
    initHour = initHour.add({ minutes: 30 });
  }
  return options;
};

// Cache estático de opciones de hora (generado una vez)
let _cachedHourOptions: Array<{ value: string; label: string }> | null = null;
const getHourOptions = () => {
  if (!_cachedHourOptions) {
    _cachedHourOptions = generateHourOptions();
  }
  return _cachedHourOptions;
};

export default function useSearch() {

  /** routes */
  const route = useRoute();
  const city = route.params.city as string;
  
  // stores
  const storeForm = useStoreReservationForm();
  const storeSearchData = useStoreSearchData();
  const storeAdminData = useStoreAdminData();
  
  // refs

  const {
    lugarRecogida,
    lugarDevolucion,
    fechaRecogida,
    fechaDevolucion,
    horaRecogida,
    horaDevolucion,
    referido,
    haveMonthlyReservation,
    selectedDays,
    selectedPickupDate,
    haveTotalInsurance,
    selectedPickupHour
  } = storeToRefs(storeForm);

  const { error: errorSearchResponse, categoriesAvailabilityData } = storeToRefs(storeSearchData);
  
  const firstSearch = ref<boolean>(true);
  const stopWatching = ref<boolean>(false);
  const animateSearchButton = ref<boolean>(true);
  // noAvailableCategories.value = false;
  
  // functions
  const { search } = storeSearchData;
  const { createMessage, flushMessages } = useMessages();
  const { searchBranchByCity, searchBranchByCode } = storeAdminData;
  
  const doSearch = () => {
    flushMessages();

    if (horaRecogida.value != horaDevolucion.value) {
      createMessage({
        type: "info",
        title: "Tarifa adicional por horas extras",
        message:
          "El tiempo extra de uso puede incrementar el precio total del alquiler",
      });
    }

    if (lugarRecogida.value != lugarDevolucion.value) {
      createMessage({
        type: "info",
        title: "Tarifa adicional por traslado",
        message:
          "Devolverlo en otra sede o ciudad puede incrementar el precio de alquiler",
      });
    }

    haveMonthlyReservation.value = selectedDays.value == 30;
    haveTotalInsurance.value = false;

    firstSearch.value = false;
    stopWatching.value = true;
    // noAvailableCategories.value = false;
    errorSearchResponse.value = null;


    search();
  }

  const changePickupLocation = function (branch_code: string) {
    lugarRecogida.value = branch_code;
    // selectedReturnLocation.value = selectedPickupLocation.value;
  };
  
  const removePickupLocation = function () {
    lugarRecogida.value = null;
    // selectedPickupLocation.value = undefined;
    // selectedReturnLocation.value = undefined;
  };
  
  /** watchers */

  // Watchers de sincronización pickup → return (flush: 'sync' evita cascada)
  // Se ejecutan sincrónicamente antes del siguiente tick de Vue
  watch(
    lugarRecogida,
    (newPickupLocation) => (lugarDevolucion.value = newPickupLocation),
    { flush: 'sync' }
  );

  watch(fechaRecogida, (): void => {
    if (selectedPickupDate.value)
      fechaDevolucion.value = selectedPickupDate.value.copy().add({ days: 7 }).toString() ?? null
  }, { flush: 'sync' });

  watch(
    horaRecogida,
    (newPickupHour) => (horaDevolucion.value = newPickupHour),
    { flush: 'sync' }
  );

  // Watcher debounced para resetear disponibilidad
  // Agrupa múltiples cambios rápidos en una sola ejecución (50ms)
  watchDebounced(
    [lugarRecogida, lugarDevolucion, fechaRecogida, fechaDevolucion, horaRecogida, horaDevolucion],
    () => {
      categoriesAvailabilityData.value = null;
      animateSearchButton.value = true;
    },
    { debounce: 50 }
  );

  // Desactivar animación cuando los vehículos están desplegados
  watch(categoriesAvailabilityData, (newValue) => {
    if (newValue !== null) {
      animateSearchButton.value = false;
    }
  });

  const defaultLugarRecogida: BranchData | undefined = searchBranchByCity(city) ?? searchBranchByCode(lugarRecogida.value ?? '') ?? searchBranchByCity('bogota');
  const defaultLugarDevolucion: BranchData | undefined = searchBranchByCity(city) ?? searchBranchByCode(lugarDevolucion.value ?? '') ?? searchBranchByCity('bogota');

  // const selectedPickupLocation = ref<BranchData | undefined>(
  //   defaultLugarRecogida
  // );
  // const selectedReturnLocation = ref<BranchData | undefined>(
  //   defaultLugarDevolucion
  // );

  lugarRecogida.value = lugarRecogida.value ?? defaultLugarRecogida?.code ?? null;
  lugarDevolucion.value = lugarDevolucion.value ?? defaultLugarDevolucion?.code ?? null;


  /** computed */
  const searchLinkName = computed(() => {
    return referido.value
      ? "city-buscar-vehiculos-referido-referido-lugar-recogida-lugar_recogida-lugar-devolucion-lugar_devolucion-fecha-recogida-fecha_recogida-fecha-devolucion-fecha_devolucion-hora-recogida-hora_recogida-hora-devolucion-hora_devolucion"
      : "city-buscar-vehiculos-lugar-recogida-lugar_recogida-lugar-devolucion-lugar_devolucion-fecha-recogida-fecha_recogida-fecha-devolucion-fecha_devolucion-hora-recogida-hora_recogida-hora-devolucion-hora_devolucion";
  });
  
  const searchLinkParams = computed(() => {
    const pickupBranch = searchBranchByCode(lugarRecogida.value ?? '');
    const returnBranch = searchBranchByCode(lugarDevolucion.value ?? '');

    // Convert stored 24h format to 12h for URLs
    const pickupTime = horaRecogida.value
      ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaRecogida.value)))
      : null;
    const returnTime = horaDevolucion.value
      ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaDevolucion.value)))
      : null;

    return {
      referido: referido.value,
      lugar_recogida: pickupBranch?.slug,
      lugar_devolucion: returnBranch?.slug,
      fecha_recogida: fechaRecogida.value,
      fecha_devolucion: fechaDevolucion.value,
      hora_recogida: pickupTime,
      hora_devolucion: returnTime,
    };
  });

  // Usa cache estático - no regenera 48 opciones en cada re-render
  const pickupHourOptions = computed(() => getHourOptions());

  // Filtra desde cache cuando hay restricción mensual
  const returnHourOptions = computed(() => {
    const allOptions = getHourOptions();

    // Sin restricción mensual, devuelve todas las opciones
    if (selectedDays.value !== 30 || !selectedPickupHour.value) {
      return allOptions;
    }

    // Filtra opciones hasta la hora de recogida (para reservas mensuales)
    const cutoffIndex = allOptions.findIndex(opt => {
      const optTime = createTimeFromString(opt.value);
      return optTime.compare(selectedPickupHour.value!) > 0;
    });

    return cutoffIndex === -1 ? allOptions : allOptions.slice(0, cutoffIndex);
  });
  
  return { 
    doSearch,
    changePickupLocation,
    removePickupLocation,
    firstSearch, 
    stopWatching, 
    animateSearchButton,
    // noAvailableCategories, 
    searchLinkName, 
    searchLinkParams,
    pickupHourOptions,
    returnHourOptions,
    // selectedPickupLocation,
    // selectedReturnLocation,
  };
}
