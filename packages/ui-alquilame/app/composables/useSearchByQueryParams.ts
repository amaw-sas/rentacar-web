// SCEN-003 (alquilame only, issue #112 F3): /reservas drives its in-place search
// from the QUERY STRING, not from path params. This composable mirrors the shared
// `useSearchByRouteParams` (packages/logic) — which reads route.params on a
// `/[city]/buscar-vehiculos/...` deep URL — but reads `route.query` instead, and
// RE-RUNS when the query changes (so the back/forward button and a fresh submit
// both re-search). It lives in the app layer to keep packages/logic and the other
// brands untouched (F3 cross-brand isolation).
//
// Guard: it only fires `doSearch()` when the required search keys are present in
// the query. A clean `/reservas` (no query) must NOT run a search — it stays the
// indexable landing/search page.
//
// SSR-safety: all store access happens inside onMounted, exactly like the shared
// route-param driver, to avoid Pinia-before-app SSR errors.
import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  parseTime12hOr24h,
  formatTime,
  toDatetime,
  createCurrentDateObject,
} from '@rentacar-main/logic/utils';

export default function useSearchByQueryParams() {
  const route = useRoute();

  onMounted(() => {
    // stores (client-only — SSR-safe, mirrors useSearchByRouteParams)
    const storeForm = useStoreReservationForm();
    const storeAdminData = useStoreAdminData();
    const { doSearch } = useSearch();

    const {
      lugarRecogida,
      lugarDevolucion,
      fechaRecogida,
      fechaDevolucion,
      horaRecogida,
      horaDevolucion,
      referido,
    } = storeToRefs(storeForm);

    const runSearchFromQuery = () => {
      const slugRecogida = route.query.lugar_recogida?.toString();
      const slugDevolucion = route.query.lugar_devolucion?.toString();
      const fecha_recogida = route.query.fecha_recogida?.toString();
      const fecha_devolucion = route.query.fecha_devolucion?.toString();
      const hora_recogida = route.query.hora_recogida?.toString();
      const hora_devolucion = route.query.hora_devolucion?.toString();

      // Guard: a clean /reservas (no results query) must NOT trigger a search, so
      // the page stays a plain indexable landing/search page. lugar_recogida +
      // fecha_recogida are the essentials the availability fetch needs (and the
      // canonical "results query present" signal, same as hasResultsQuery + robots).
      if (!route.query.lugar_recogida || !route.query.fecha_recogida) {
        return;
      }

      // Convert slugs to branch codes (mirrors the route-param driver).
      const branchRecogida = storeAdminData.searchBranchBySlug(slugRecogida ?? '');
      const branchDevolucion = storeAdminData.searchBranchBySlug(slugDevolucion ?? '');

      lugarRecogida.value = branchRecogida?.code ?? null;
      lugarDevolucion.value = branchDevolucion?.code ?? null;
      fechaRecogida.value = fecha_recogida ?? null;
      fechaDevolucion.value = fecha_devolucion ?? null;
      referido.value = route.query.referido?.toString() ?? null;

      // Parse times (12h from the URL or 24h), normalize to the store's 24h format.
      const pickupTime = parseTime12hOr24h(hora_recogida ?? '');
      const returnTime = parseTime12hOr24h(hora_devolucion ?? '');

      horaRecogida.value = pickupTime
        ? formatTime(toDatetime(createCurrentDateObject(), pickupTime))
        : null;
      horaDevolucion.value = returnTime
        ? formatTime(toDatetime(createCurrentDateObject(), returnTime))
        : null;

      doSearch();
    };

    // Run on mount (handles direct load / refresh on a shared /reservas?... link)…
    runSearchFromQuery();
    // …and re-run whenever the query changes (a new submit on /reservas updates the
    // query in-place; back/forward navigates between query states). Deep watch so a
    // changed value inside the same query object is caught.
    watch(() => route.query, () => runSearchFromQuery(), { deep: true });
  });
}
