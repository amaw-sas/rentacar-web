// External dependencies
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { $fetch } from 'ofetch';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';

// Helpers
import { mapAvailabilityFetchError } from '../utils/helpers/mapAvailabilityFetchError';

// Types
import type { CategoryAvailabilityData, LocalizaErrorResponse } from '@rentacar-main/logic/utils';

export default async function useFetchCategoriesAvailabilityData() {
  const config = useRuntimeConfig();
  const endpoint =
    config.public.rentacarApiReservasCategoriesAvailabilityEndpoint;
  const { lugarRecogida, lugarDevolucion, fullPickupDate, fullReturnDate } =
    storeToRefs(useStoreReservationForm());
  const data = ref<CategoryAvailabilityData[] | null>(null);
  const error = ref<LocalizaErrorResponse | null>(null);

  // Validate required parameters before making the API request
  if (!lugarRecogida.value || !lugarDevolucion.value || !fullPickupDate.value || !fullReturnDate.value) {
    error.value = {
      error: 'missing_parameters',
      message: 'Faltan parámetros requeridos para la búsqueda'
    } as LocalizaErrorResponse;
    return { data, error };
  }

  try {
    // Endpoint is a same-origin Nuxt server route (/api/reservations/availability)
    // that proxies to the admin and injects the API key server-side.
    const response = await $fetch<CategoryAvailabilityData[]>(endpoint, {
      method: "POST",
      body: {
        franchise: config.public.rentacarFranchise,
        pickupLocation: lugarRecogida.value,
        returnLocation: lugarDevolucion.value,
        pickupDateTime: fullPickupDate.value,
        returnDateTime: fullReturnDate.value,
      },
    });

    data.value = response;
  } catch (e) {
    // Forward genuine Localiza codes; downgrade infra failures (incl. the Nitro
    // {error:true} envelope) to a friendly server_error — never leak raw tech
    // strings to the toast (ISSUE-003).
    error.value = mapAvailabilityFetchError(e);
  }

  return { data, error };
}
