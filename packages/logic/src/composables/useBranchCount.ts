// External
import { computed, type ComputedRef } from 'vue'

/**
 * Live count of branches, derived from the Supabase-backed rentacar-data
 * (`useFetchRentacarData().branches`) — the same state `useStoreAdminData`
 * reads for the per-city badges in Cities.vue.
 *
 * This exists because the number was written by hand. The 2026-08-14 audit found
 * "27 sedes" live on the alquilatucarro home and in three blog surfaces, plus a
 * "19 sedes" in the corpus that also confused branches with cities — all while
 * the real figure was 31. Nobody wrote 27 carelessly; it was true once. A
 * literal cannot stay true, so the fix is to stop writing one.
 *
 * Mirrors useCityCount deliberately, including the fallback shape: when the
 * rentacar-data state is null (SSR before the plugin resolves, or a failed
 * fetch), `useFetchRentacarData` returns a frozen sentinel with `branches: []`.
 * An empty list means "not loaded", not "no branches", so the copy renders the
 * fallback instead of announcing "0 sedes". A genuine zero-branch business is
 * not a real operating condition.
 *
 * Consumers hardcode the plural noun ("N sedes"); the live count has never been
 * 1 and singular is not handled.
 *
 * FALLBACK_BRANCH_COUNT tracks the current real count (31 at the time of
 * writing). It is the only spot to bump by hand, and only matters on the
 * degraded path — the visible figure updates on its own the moment a branch is
 * added upstream.
 */
export const FALLBACK_BRANCH_COUNT = 31

export const useBranchCount = (): ComputedRef<number> =>
  computed(() => {
    const { branches } = useFetchRentacarData()
    // Explicit: fall back only when the list is genuinely unavailable, never by
    // coercing a real 0 — `|| FALLBACK` would conflate the two.
    return Array.isArray(branches) && branches.length > 0
      ? branches.length
      : FALLBACK_BRANCH_COUNT
  })
