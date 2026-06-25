// SCEN-003 (alquilame only, issue #112 F3): /reservas drives its in-place search
// from the QUERY STRING, not from path params. This composable mirrors the shared
// `useSearchByRouteParams` (packages/logic) — which reads route.params on a
// `/[city]/buscar-vehiculos/...` deep URL — but reads `route.query` instead, and
// RE-RUNS when the search-relevant query changes (so the back/forward button and a
// fresh submit both re-search). It lives in the app layer to keep packages/logic
// and the other brands untouched (F3 cross-brand isolation).
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

// Vue Router query values are `string | string[] | null` — a duplicated key
// (?lugar_recogida=a&lugar_recogida=b, from a hand-edited or doubly-appended link)
// arrives as an ARRAY. Take the first element so the slug resolves to `a` instead
// of the comma-joined `"a,b"` that `.toString()` would produce (which matches no
// branch → silent empty results).
function firstQueryValue(v: unknown): string | undefined {
  const raw = Array.isArray(v) ? v[0] : v;
  return raw == null ? undefined : String(raw);
}

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
      // Guard: a clean /reservas (no results query) must NOT trigger a search, so
      // the page stays a plain indexable landing/search page. Require the same
      // essentials the submit button's guard requires (lugar_recogida + both
      // dates) so a truncated/hand-crafted link can't fire a malformed search.
      if (
        !route.query.lugar_recogida ||
        !route.query.fecha_recogida ||
        !route.query.fecha_devolucion
      ) {
        return;
      }

      const slugRecogida = firstQueryValue(route.query.lugar_recogida);
      const slugDevolucion = firstQueryValue(route.query.lugar_devolucion);
      const fecha_recogida = firstQueryValue(route.query.fecha_recogida);
      const fecha_devolucion = firstQueryValue(route.query.fecha_devolucion);
      const hora_recogida = firstQueryValue(route.query.hora_recogida);
      const hora_devolucion = firstQueryValue(route.query.hora_devolucion);

      // Convert slugs to branch codes (mirrors the route-param driver).
      const branchRecogida = storeAdminData.searchBranchBySlug(slugRecogida ?? '');
      const branchDevolucion = storeAdminData.searchBranchBySlug(slugDevolucion ?? '');

      lugarRecogida.value = branchRecogida?.code ?? null;
      lugarDevolucion.value = branchDevolucion?.code ?? null;
      fechaRecogida.value = fecha_recogida ?? null;
      fechaDevolucion.value = fecha_devolucion ?? null;
      referido.value = firstQueryValue(route.query.referido) ?? null;

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
    // …and re-run only when a SEARCH-relevant query value changes (a new submit on
    // /reservas, or back/forward between query states). The getter returns a joined
    // key of just the search params, so the watch's value-equality skips redundant
    // re-fetches: an identical re-submit and unrelated params (utm_*, fbclid, …) do
    // NOT re-trigger doSearch().
    watch(
      () =>
        [
          route.query.lugar_recogida,
          route.query.lugar_devolucion,
          route.query.fecha_recogida,
          route.query.fecha_devolucion,
          route.query.hora_recogida,
          route.query.hora_devolucion,
        ]
          .map((v) => firstQueryValue(v) ?? '')
          .join('|'),
      () => runSearchFromQuery(),
    );
  });
}
