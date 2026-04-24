// External dependencies
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { $fetch } from 'ofetch';
import type { FetchError } from 'ofetch';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';
import useStoreSearchData from '../stores/useStoreSearchData';

// Types
import type { FormRecordFields, RecordReservationApiData } from '@rentacar-main/logic/utils';

export default async function useRecordReservationForm() {
  const config = useRuntimeConfig();
  const endpoint = config.public.rentacarApiReservasFormRecordEndpoint;
  const franchise = config.public.rentacarFranchise;
  const data = ref<RecordReservationApiData | null>();
  const error = ref();

  const storeForm = useStoreReservationForm();

  const {
    nombreCompleto,
    apellidos,
    tipoIdentificacion,
    identificacion,
    telefono,
    email,
    vehiculo,
    lugarDevolucion,
    lugarRecogida,
    fechaRecogida,
    fechaDevolucion,
    horaRecogida,
    horaDevolucion,
    aerolinea,
    numeroVueloIda,
    referido,
    selectedDays,
    haveTotalInsurance,
    haveMonthlyReservation,
    selectedMonthlyMileage,
  } = storeToRefs(storeForm);

  const { selectedCategory } = storeToRefs(useStoreSearchData());

  let formData: FormRecordFields | {} = {};

  const partialData: Partial<FormRecordFields> = {
    fullname: `${nombreCompleto.value} ${apellidos.value}`,
    identification_type: tipoIdentificacion.value,
    identification: identificacion.value,
    phone: telefono.value,
    email: email.value,
    category: vehiculo.value,
    pickup_location: lugarRecogida.value,
    pickup_date: fechaRecogida.value,
    pickup_hour: horaRecogida.value,
    return_location: lugarDevolucion.value,
    return_date: fechaDevolucion.value,
    return_hour: horaDevolucion.value,
    return_fee: selectedCategory.value?.returnFeeAmount,
    selected_days: selectedDays.value,
    coverage_days: selectedCategory.value?.coverageQuantity,
    coverage_price: selectedCategory.value?.coverageTotalAmount,
    franchise: franchise,
    total_insurance: haveTotalInsurance.value,
    reference_token: selectedCategory.value?.referenceToken,
    rate_qualifier: selectedCategory.value?.rateQualifier,
    extra_driver: selectedCategory.value?.withExtraDriver ? 1 : 0,
    baby_seat: selectedCategory.value?.withBabySeat ? 1 : 0,
    wash: selectedCategory.value?.withWash ? 1 : 0,
    flight: aerolinea.value ? 1 : 0,
    aeroline: aerolinea.value,
    flight_number: numeroVueloIda.value,
  };

  if (referido.value) partialData["user"] = referido.value;

  let total_price_to_pay: number = 0,
    total_price: number = 0;

  // reserva de mensualidad
  if (haveMonthlyReservation.value && selectedMonthlyMileage.value) {
    total_price_to_pay = selectedCategory.value?.getActualTotalPrice ?? 0;
    total_price = total_price_to_pay
      ? Math.round(total_price_to_pay / 1.19)
      : 0;

    formData = {
      ...partialData,
      coverage_days: 0,
      coverage_price: 0,
      extra_hours: 0,
      extra_hours_price: 0,
      tax_fee: 0,
      iva_fee: 0,
      total_price,
      total_price_to_pay,
      monthly_mileage: selectedMonthlyMileage.value,
      //TODO add user field
    };
  }
  // reserva regular
  else {
    total_price_to_pay = selectedCategory.value?.getActualTotalPrice ?? 0;
    total_price =
      (selectedCategory.value?.getSubtotal ?? 0) +
      (selectedCategory.value?.getTaxFeePrice ?? 0);

    formData = {
      ...partialData,
      extra_hours: selectedCategory.value?.extraHoursQuantity,
      extra_hours_price: selectedCategory.value?.extraHoursTotalAmount,
      tax_fee: selectedCategory.value?.getTaxFeePrice,
      iva_fee: selectedCategory.value?.getIVAFeePrice,
      total_price,
      total_price_to_pay,
      //TODO add user field
    };
  }

  try {
    // Endpoint is a same-origin Nuxt server route (/api/reservations/record)
    // that proxies to the admin and injects the API key server-side.
    const response = await $fetch<RecordReservationApiData>(endpoint, {
      method: "POST",
      body: formData,
    });

    data.value = response;
  } catch (e: any) {
    error.value = e as FetchError;
  }

  return { data, error };
}
