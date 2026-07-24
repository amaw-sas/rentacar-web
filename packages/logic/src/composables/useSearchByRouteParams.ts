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
import {
  SEARCH_PARAM_NOTICE_KEY,
  SEARCH_PARAM_NOTICES,
  readNoticeCodes,
} from '../utils/searchParamNotices';

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
      referido,
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
    referido.value = (route.params.referido as string | undefined) ?? null;

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

    // functions — useSearch is a shared composable (issue #322 SCEN-322-V04):
    // when the page's Searcher already instantiated it, this call reuses that
    // instance instead of registering a duplicate set of sync watchers.
    const { doSearch } = useSearch();

    // Perform search after setting params
    doSearch();

    announceRouteCorrections();
  });

  /**
   * Turns the codes validateSearchParams parked in the URL back into toasts
   * (issue #406).
   *
   * The middleware cannot show these itself: it always redirects right after
   * raising one, and a redirect destroys it twice over — a server-side 302
   * carries no payload, and on a client navigation doSearch's flushMessages()
   * wipes the toast about 50 ms after it appears. So the notice rides the
   * redirect in the query and is spoken for here, once the search is out.
   *
   * Order is deliberate. This runs AFTER doSearch so the flush has already
   * happened, and the URL is stripped BEFORE the toast is created: should the
   * replace ever start remounting the page, the extra doSearch's flush would
   * land while there is still nothing to destroy.
   *
   * Codes resolve through the catalog and nothing else — `aviso` is
   * user-writable, so an unrecognised value produces no message, and its raw
   * text never reaches the DOM. It is stripped either way; junk should not
   * outlive the page load.
   */
  function announceRouteCorrections() {
    if (!(SEARCH_PARAM_NOTICE_KEY in route.query)) return;

    const codes = readNoticeCodes(route.query[SEARCH_PARAM_NOTICE_KEY]);
    const { [SEARCH_PARAM_NOTICE_KEY]: _carrier, ...cleanQuery } = route.query;
    const { createMessage } = useMessages();

    // `replace`, not `push`: cleaning up the URL is not a place the user can
    // navigate back to. A rejected navigation (an aborting guard) must not
    // swallow the notice, hence the catch before the announcement.
    useRouter()
      .replace({ query: cleanQuery })
      .catch(() => undefined)
      .then(() => {
        for (const code of codes) createMessage(SEARCH_PARAM_NOTICES[code]);
      });
  }
}