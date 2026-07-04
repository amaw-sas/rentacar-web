// External
import { computed, type ComputedRef } from 'vue'

import { SERVICE_CITIES } from '../utils/serviceCities'

/**
 * Count of active service cities, derived from the deterministic build-time
 * SERVICE_CITIES list (see serviceCities.ts) — NOT from live Supabase data.
 *
 * HISTORY. Operator correction #3 (docs/specs/city-count-derivation) replaced 7
 * scattered hardcoded "N ciudades" literals with a live count off
 * `useFetchRentacarData().cities`, so the figure self-corrected from the
 * dashboard. Issue #221 then found that the SAME live derivation caused
 * intermittent hydration mismatches on ISR pages: the footer and home "Ciudades"
 * section render a different node count / number on the server vs the client
 * when the ISR HTML and the hydration `_payload.json` capture different `cities`
 * snapshots. Those two requirements are mutually exclusive for an SSR text node
 * under ISR — a number cannot both track a value that may drift and be
 * drift-proof.
 *
 * Resolution (directive, 2026-07-04): keep operator #3's DURABLE intent — ONE
 * guarded source of truth, never scattered literals — but make that source the
 * deterministic SERVICE_CITIES list instead of live data, so the server render
 * and the client's first render always agree. Adding/removing a city is now a
 * coordinated edit of SERVICE_CITIES + each brand's `isr` routeRules + the
 * build-time SEO literals (adding a city already required the ISR route). See
 * SERVICE_CITIES for the lockstep contract, and the AMEND note in
 * docs/specs/city-count-derivation/scenarios/city-count-derivation.scenarios.md.
 *
 * Kept as a composable returning a ComputedRef<number> so every call site
 * (`{{ cityCount }}`, `cityCount.value`) is unchanged — it simply never drifts
 * now. The count is always a plural number (19 at the time of writing), so
 * consumers hardcode the plural noun ("N ciudades"); singular is not handled.
 */
export const useCityCount = (): ComputedRef<number> =>
  computed(() => SERVICE_CITIES.length)
