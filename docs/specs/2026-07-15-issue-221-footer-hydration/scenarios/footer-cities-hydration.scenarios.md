---
name: footer-cities-hydration
created_by: pabloandi
created_at: 2026-07-15T21:12:47Z
issue: 221
---

# Footer cities list/count — hydration-safe snapshot (issue #221)

Hydration mismatch warnings appeared when scrolling to the footer on alquilame
and alquicarros. Root cause: the footer column of city links (`v-for`) and the
marketing "presencia en N ciudades" figure both depend on the live
`rentacar-data` cities snapshot. If the client first paint sees a different
list (or empty sentinel + `FALLBACK_CITY_COUNT`) than the SSR/ISR HTML, Vue
reports children/text mismatches on the footer.

Dates in deep-links are already hydration-safe (issue #109: null until
`onMounted`). This holdout covers the **list length and count**, not href dates.

## SCEN-001: Same payload → same footer city list on SSR and first client paint
**Given**: a page whose Nuxt payload carries `rentacar-data` with an active
`cities` array of length K (K ≥ 1), ordered as stored in the payload
**When**: the layout footer renders on the server and again on the client's
first paint (before any post-hydration refresh)
**Then**: both paints render exactly K city links with the same `city.id` set
and order as the payload snapshot
**Evidence**: unit test that, for a fixed payload of K cities, the cities array
exposed to the footer equals that snapshot on two consecutive reads that
simulate SSR setup then client setup against the same useState; no network
refetch is allowed to replace the snapshot while hydrating

## SCEN-002: City count text matches the list length from the same snapshot
**Given**: the same payload as SCEN-001 with K cities (K ≥ 1)
**When**: the footer renders "presencia en N ciudades" (or brand-equivalent)
alongside the city links column
**Then**: N equals K (the length of the same cities array used in the `v-for`),
not a divergent hardcoded or fallback figure
**Evidence**: unit test asserting `useCityCount()` equals `cities.length` when
the payload cities array is non-empty

## SCEN-003: Client hydration must not network-fetch a divergent cities snapshot
**Given**: the SSR payload already includes `rentacar-data` (useAsyncData key
and/or useState) with cities snapshot S
**When**: the `rentacar-data` plugin runs on the client during hydration
**Then**: it does not call `$fetch('/api/rentacar-data')` to replace S; the
useState value remains S for the first client paint
**Evidence**: plugin unit test with a pre-populated useState (or payload cache)
asserts the fetch factory is not invoked / useState is not overwritten with a
different object during the hydrate path

## SCEN-004: Empty/unavailable cities — count fallback is stable on both paints
**Given**: rentacar-data state is null or `cities` is empty (sentinel / degraded)
**When**: the footer count helper is evaluated on server and on first client paint
**Then**: both paints return the same positive `FALLBACK_CITY_COUNT` (never 0);
the city links `v-for` is empty on both paints (no SSR-full vs client-empty
children mismatch from this degraded path alone)
**Evidence**: existing `useCityCount` empty/undefined tests plus plugin test that
an empty client state is not filled from a network response *during* hydration
when no payload snapshot exists (stay empty/sentinel until after hydrate)

## SCEN-005: Brands share the wiring (no brand-only escape hatch)
**Given**: alquilame, alquicarros, and alquilatucarro layout footers
**When**: each footer city column and count are inspected after the fix
**Then**: each still sources cities from the shared rentacar-data path
(`useData` / `useFetchRentacarData` / `useCityCount`) — no brand-local hardcoded
city list; deep-link dates remain null until `onMounted` (issue #109 intact)
**Evidence**: grep/source lock that the three `layouts/default.vue` still call
`useData` + `useCityCount` and set reservation dates only in `onMounted`
