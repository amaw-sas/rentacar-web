// External dependencies
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { $fetch } from 'ofetch';
import type { FetchError } from 'ofetch';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';

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
  } catch (e: any) {
    const er = e as FetchError;
    if (er.data && typeof er.data === 'object' && 'error' in er.data) {
      error.value = er.data as LocalizaErrorResponse;
    } else {
      error.value = {
        error: 'server_error',
        message: 'El servicio no está disponible en este momento. Por favor, intenta de nuevo en unos minutos.',
      } as LocalizaErrorResponse;
    }
  }

  return { data, error };
}
