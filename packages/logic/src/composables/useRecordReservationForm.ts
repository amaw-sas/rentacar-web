// External dependencies
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { $fetch } from 'ofetch';
import type { FetchError } from 'ofetch';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';
import useStoreSearchData from '../stores/useStoreSearchData';

// Internal dependencies - utils
import {
  readStoredAttribution,
  normalizePhoneNumber,
  IVA_PERCENTAGE,
  trackAnalyticsEvent,
} from '@rentacar-main/logic/utils';
import { RECORD_FETCH_TIMEOUT_MS } from '../utils/fetchTimeouts';

// Types
import type { FormRecordFields, RecordReservationApiData } from '@rentacar-main/logic/utils';

// null = extra not selected (never 0 — downstream would read 0 as "free").
function frozenExtraPrice(
  selected: boolean | undefined,
  price: number | undefined,
): number | null {
  if (!selected || price == null) return null;
  return Math.round(price);
}

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
    // Freeze the agreed price of each selected extra so post-checkout surfaces
    // (voucher, email) can show the same total the client accepted. The getters
    // already resolve daily (days × day price) vs monthly (flat, mig 109).
    // Rounded to whole pesos — COP has no subunit (same invariant as #376).
    extra_driver_price: frozenExtraPrice(
      selectedCategory.value?.withExtraDriver,
      selectedCategory.value?.getExtraDriverPrice,
    ),
    baby_seat_price: frozenExtraPrice(
      selectedCategory.value?.withBabySeat,
      selectedCategory.value?.getBabySeatPrice,
    ),
    wash_price: frozenExtraPrice(
      selectedCategory.value?.withWash,
      selectedCategory.value?.getWashPrice,
    ),
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
    // Issue #376: round to whole pesos, same as the monthly branch above.
    // Without Seguro Total the getters return the raw upstream amounts (see
    // useCategory getTaxFeePrice/getIVAFeePrice/getSubtotal `else` paths), which
    // can carry sub-peso decimals; persisting them risks cent-level mismatches
    // downstream (dashboard, Localiza, reconciliation). COP has no subunit.
    //
    // Round each component, then derive total_price from the rounded parts so
    // the persisted fields keep an exact peso-level identity: here total_price
    // is subtotal + tax (this branch's total excludes IVA, unchanged). Rounding
    // the sum independently could drift ±1 COP from tax_fee, breaking any
    // downstream reconciliation of total_price − tax_fee.
    const roundedSubtotal = Math.round(selectedCategory.value?.getSubtotal ?? 0);
    const roundedTaxFee = Math.round(selectedCategory.value?.getTaxFeePrice ?? 0);
    total_price = roundedSubtotal + roundedTaxFee;

    formData = {
      ...partialData,
      extra_hours: selectedCategory.value?.extraHoursQuantity,
      extra_hours_price: selectedCategory.value?.extraHoursTotalAmount,
      tax_fee: roundedTaxFee,
      iva_fee: Math.round(selectedCategory.value?.getIVAFeePrice ?? 0),
      total_price,
      total_price_to_pay,
      //TODO add user field
    };
  }

  try {
    trackAnalyticsEvent('reservation_submit', {
      brand: String(franchise || 'unknown'),
      ...(total_price_to_pay > 0
        ? { currency: 'COP' as const, value: total_price_to_pay }
        : {}),
    });
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

  return { data, error, analyticsValue: total_price_to_pay };
}
