// External dependencies
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';
import useStoreAdminData from '../stores/useStoreAdminData';

// Internal dependencies - composables
import useSearch from './useSearch';

// Internal dependencies - utils
import {
  parseTime12hOr24h,
  formatTime,
  toDatetime,
  createCurrentDateObject,
} from '../utils/useDateFunctions';

export default function useSearchByRouteParams() {
  const route = useRoute();

  // Move all store access inside onMounted to prevent Pinia SSR errors
  onMounted(() => {
    // stores
    const storeForm = useStoreReservationForm();
    const storeAdminData = useStoreAdminData();

    // refs
    const {
      lugarRecogida,
      lugarDevolucion,
      fechaRecogida,
      fechaDevolucion,
      horaRecogida,
      horaDevolucion,
    } = storeToRefs(storeForm);

    // Convert slugs from route params to branch codes
    const slugRecogida = route.params.lugar_recogida?.toString();
    const slugDevolucion = route.params.lugar_devolucion?.toString();

    const branchRecogida = storeAdminData.searchBranchBySlug(slugRecogida ?? '');
    const branchDevolucion = storeAdminData.searchBranchBySlug(slugDevolucion ?? '');

    // Set values from route params
    lugarRecogida.value = branchRecogida?.code ?? null;
    lugarDevolucion.value = branchDevolucion?.code ?? null;
    fechaRecogida.value = route.params.fecha_recogida as string;
    fechaDevolucion.value = route.params.fecha_devolucion as string;

    // Parse times (supporting both 12h and 24h formats)
    const pickupTimeString = route.params.hora_recogida as string;
    const returnTimeString = route.params.hora_devolucion as string;

    const pickupTime = parseTime12hOr24h(pickupTimeString);
    const returnTime = parseTime12hOr24h(returnTimeString);

    // Convert to 24h format for internal store
    horaRecogida.value = pickupTime
      ? formatTime(toDatetime(createCurrentDateObject(), pickupTime))
      : null;
    horaDevolucion.value = returnTime
      ? formatTime(toDatetime(createCurrentDateObject(), returnTime))
      : null;

    // functions
    const { doSearch } = useSearch();

    // Perform search after setting params
    doSearch();
  });
}