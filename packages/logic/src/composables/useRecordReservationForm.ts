// External dependencies
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { $fetch } from 'ofetch';
import type { FetchError } from 'ofetch';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';
import useStoreSearchData from '../stores/useStoreSearchData';

// Internal dependencies - utils
import { readStoredAttribution, normalizePhoneNumber, IVA_PERCENTAGE } from '@rentacar-main/logic/utils';
import { RECORD_FETCH_TIMEOUT_MS } from '../utils/fetchTimeouts';

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
    referido,
    selectedDays,
    haveTotalInsurance,
    haveMonthlyReservation,
    selectedMonthlyMileage,
    attribution,
  } = storeToRefs(storeForm);

  const { selectedCategory } = storeToRefs(useStoreSearchData());

  let formData: FormRecordFields | {} = {};

  const partialData: Partial<FormRecordFields> = {
    fullname: `${nombreCompleto.value} ${apellidos.value}`,
    identification_type: tipoIdentificacion.value,
    identification: identificacion.value,
    phone: normalizePhoneNumber(telefono.value),
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
    // Flight branch removed (issue #322 SCEN-322-X07): no form ever collected
    // aerolinea/numeroVueloIda, so this was ALWAYS 0/null on the wire. Keep the
    // explicit "no flight" flag; aeroline/flight_number (always null) dropped.
    flight: 0,
  };

  if (referido.value) partialData["user"] = referido.value;

  // Marketing attribution: prefer the store's last-touch, fall back to storage
  // (e.g. store re-created mid-session). Always send an object — `{}` signals
  // "Directo" to the dashboard; an absent key would signal "Desconocido".
  partialData.attribution = attribution.value ?? readStoredAttribution() ?? {};

  let total_price_to_pay: number = 0,
    total_price: number = 0;

  // reserva de mensualidad
  if (haveMonthlyReservation.value && selectedMonthlyMileage.value) {
    total_price_to_pay = selectedCategory.value?.getActualTotalPrice ?? 0;
    // Issue #314: back out the pre-IVA base using the category's IVA rate
    // instead of a magic 1.19, so the rate has a single named source shared with
    // getIVAFeePrice. Today the number is unchanged: monthly cards are built by
    // createCategoryAvailability (catalog), which does not set IVAFeePercentage,
    // so ivaPct resolves to the IVA_PERCENTAGE fallback (1 + 19/100 = 1.19).
    // Intentional invariant: the IVA embedded in the monthly catalog price and
    // this rate are assumed equal (IVA is fixed by law at 19%). If the dashboard
    // ever emits a per-category rate that reaches monthly and diverges from the
    // price's embedded IVA, this back-out drifts — revisit then.
    const ivaPct = selectedCategory.value?.ivaFeePercentage ?? IVA_PERCENTAGE;
    total_price = total_price_to_pay
      ? Math.round(total_price_to_pay / (1 + ivaPct / 100))
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
      timeout: RECORD_FETCH_TIMEOUT_MS,
      body: formData,
    });

    data.value = response;
  } catch (e: any) {
    error.value = e as FetchError;
  }

  return { data, error };
}
