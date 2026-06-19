---
name: city-count-derivation
created_by: pablo
created_at: 2026-06-19T00:00:00Z
---

# City-count derivation (operator correction #3: "19 ciudades" → live count)

Operators reported the marketing copy claims "19 ciudades" but coverage is now 20.
The number was hardcoded in 7 source spots across 3 brands and did NOT track the
live active-cities list (Supabase via `useFetchRentacarData`). Root-cause fix:
derive the count from the live data so it self-corrects (20 today, 21 tomorrow),
never a literal to drift again.

The number must render server-side (SSR) so it never pops in after paint — the
Stats band is explicitly CLS-sensitive (see its component header comment).

## SCEN-001: Home Stats band reflects the live active-city count
**Given**: the alquilame home is server-rendered with live rentacar-data whose
`cities` array has N active cities (N = 20 at time of writing)
**When**: a user views the "Ciudades" figure in the Stats band
**Then**: the rendered figure equals N (so "20" now), not the old hardcoded "19"
**Evidence**: rendered DOM text of the ciudades stat value === `cities.length`;
the number appears in the raw SSR HTML (curl), proving it is not client-only

## SCEN-002: No hardcoded city count survives in alquilame components
**Given**: the alquilame source after the fix
**When**: the alquilame Vue components that mention city coverage are inspected
(`Stats.vue`, `ValueProps.vue`, `Hero.vue`, layout `default.vue` footer)
**Then**: none contains a literal city count (`value: '19'`, `19 ciudades`,
`en 19 ciudades`, `más de 19 ciudades`); each derives the number from the live
count helper
**Evidence**: grep for the literal patterns returns no match in those files;
each file references the derived count (`useCityCount` / `cities.length`)

## SCEN-003: The count helper derives from live data with a safe fallback
**Given**: the `rentacar-data` state populated with a `cities` array of length K
**When**: the city-count helper is evaluated
**Then**: it returns K; when the state is null/empty, it returns a documented
positive fallback (never 0, so no "0 ciudades" in any degraded state)
**Evidence**: unit test asserting the helper returns 20 for K=20, 21 for K=21,
and the fallback (not 0) when cities is empty/unavailable

## SCEN-004: All three brands are consistent; none claims "19"
**Given**: alquilame, alquilatucarro and alquicarros sources after the fix
**When**: each brand's runtime city-count mentions are inspected
**Then**: every Vue-rendered mention (home sections + layout footers, all brands)
derives the count — no literal "19"; the one build-time string that cannot read
runtime data (alquilatucarro `nuxt.config.ts` SEO description) reads "20" and is
recorded as residual debt
**Evidence**: grep across the 3 brands shows no runtime literal "19 ciudades";
the alquilatucarro SEO description string contains "20"; rendered footer text on
each brand equals the live count

## SCEN-005: CLS-safe and no regression
**Given**: the alquilame home in a real desktop browser
**When**: the page loads and hydrates
**Then**: the ciudades number is present in the first SSR paint (no layout shift
as data settles); the footer cities `v-for` list still renders; zero console
errors and zero failed network requests
**Evidence**: curl SSR HTML contains the number before any JS runs; agent-browser
reports 0 console errors / 0 failed requests; footer city links still present
