// External
import { computed, type ComputedRef } from 'vue'

// Internal
import { isBookable } from '../utils/isBookable'

/**
 * Live count of active service cities, derived from the Supabase-backed
 * rentacar-data (`useFetchRentacarData().cities`, filtered to status=active
 * upstream). Marketing copy ("N ciudades de Colombia") binds to this instead
 * of a hardcoded number, so the figure tracks the dashboard — there is no
 * literal to drift. The cities array is SSR-hydrated by the `rentacar-data`
 * plugin before component setup, so the count is present at first paint
 * (CLS-safe); reading it inside `computed` tracks the underlying `useState`,
 * so it follows the ≤1h SWR refetch.
 *
 * FALLBACK_CITY_COUNT guards the degraded path: when the rentacar-data state
 * is null (SSR before the plugin resolves, or a failed/partial fetch),
 * `useFetchRentacarData` returns a frozen sentinel with `cities: []`. We treat
 * an empty/absent list as "not loaded" and render the fallback so the UI never
 * shows "0 ciudades". A genuine zero-city state is not a real operating
 * condition (the business always serves cities); if it ever became one, the
 * marketing strings — not this guard — would need to handle it explicitly.
 *
 * In practice the live count is always a plural number (19 at the time of
 * writing), so consumers hardcode the plural noun ("N ciudades"); singular
 * ("1 ciudad") is not handled.
 *
 * FALLBACK_CITY_COUNT tracks the current real active-city count (19). The live
 * derivation auto-updates the visible figures the moment a city is added in
 * Supabase; this constant (and the one build-time SEO literal that mirrors it)
 * are the only spots to bump by hand when that happens.
 */
export const FALLBACK_CITY_COUNT = 19

export const useCityCount = (): ComputedRef<number> =>
  computed(() => {
    const { cities } = useFetchRentacarData()
    // Explicit: fall back only when the list is genuinely unavailable, not by
    // coercing a real 0 — `|| FALLBACK` would conflate the two.
    //
    // The AVAILABILITY check reads the raw list; the FIGURE counts only the cities still on sale.
    // Keeping those two apart matters: a city stays published so its page survives, and letting
    // it keep inflating this number would have us claim we operate somewhere we refuse bookings.
    // Filtering before the emptiness check instead would make "the catalog failed to load" and
    // "every city is off" indistinguishable, and quietly show the fallback for the second one.
    //
    // `isBookable` rather than reading the field: the payload is cached for an hour, so right
    // after the deploy no city carries it, and absent means on sale.
    return Array.isArray(cities) && cities.length > 0
      ? cities.filter(isBookable).length
      : FALLBACK_CITY_COUNT
  })
