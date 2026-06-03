---
name: issue-28-ola-d-remove-fallbacks
created_by: pablo
created_at: 2026-06-03T00:00:00Z
---

# Issue #28 Ola D — remove transitional fallbacks

Final wave of issue #28: the dashboard (Supabase) is now the SOLE source of truth
for pico y placa exemption and geographic visibility. Migrations 053
(`picoyplaca_exempt`) and 054 (geo backfill) are applied + verified in prod
(2026-06-03), and prod render was validated on real data. These scenarios lock
the end-state contract — the decision derives ONLY from dashboard data, with NO
hardcoded category lists surviving in the web. Removing the fallbacks must not
change the observable behavior for the backfilled categories, and must change it
for the now-impossible "missing data" inputs (no silent hardcoded whitelist).

## SCEN-D01: dashboard marks a gama exempt → badge shows
**Given**: a category whose `picoyplaca_exempt` column arrives as `true`
**When**: the web resolves its pico y placa exemption
**Then**: it is exempt (the "sin pico y placa" badge renders)
**Evidence**: `resolvePicoyPlacaExempt(true)` returns `true`; prod render shows FU/FL/GL/LU with "sin pico y placa" badge in Bogotá

## SCEN-D02: dashboard revokes exemption on a historically-exempt gama → no badge
**Given**: gama FU (hardcoded as exempt before Ola B2) whose `picoyplaca_exempt` column now arrives as `false`
**When**: the web resolves its pico y placa exemption
**Then**: it is NOT exempt — the column overrides any legacy whitelist, so no badge renders
**Evidence**: `resolvePicoyPlacaExempt(false)` returns `false` (the old `EXEMPT_FALLBACK` whitelist no longer forces FU exempt)

## SCEN-D03: exemption column absent → not exempt (no hardcoded fallback)
**Given**: a category whose `picoyplaca_exempt` arrives as `null`/`undefined` (e.g. stale cache or a new category before save)
**When**: the web resolves its pico y placa exemption
**Then**: it is NOT exempt — there is no hardcoded list to fall back to; absence means "not exempt" (operators grant exemption explicitly in the dashboard)
**Evidence**: `resolvePicoyPlacaExempt(null)` returns `false` and `resolvePicoyPlacaExempt(undefined)` returns `false`

## SCEN-D04: visibility_mode 'all' → visible anywhere, even a historically Bogotá-only gama
**Given**: gama FU (hardcoded Bogotá-only before Ola C) whose `visibility_mode` arrives as `'all'` with no city rows
**When**: the web decides visibility for a Medellín pickup
**Then**: it IS visible — `'all'` imposes no geographic constraint; the legacy BOGOTA_ONLY list no longer hides it
**Evidence**: `isCategoryVisibleInCity('all', [], 'medellin')` returns `true`

## SCEN-D05: restricted category visible only in its whitelisted cities
**Given**: a category with `visibility_mode='restricted'` and `allowed_cities=['bogota']`
**When**: the web decides visibility for different pickups
**Then**: visible in Bogotá, hidden in Medellín — purely from the data, no category-code branching
**Evidence**: `isCategoryVisibleInCity('restricted', ['bogota'], 'bogota')` returns `true`; `isCategoryVisibleInCity('restricted', ['bogota'], 'medellin')` returns `false`

## SCEN-D06: restricted but unbackfilled cities → fail open (permanent revenue guard)
**Given**: a category an operator marked `restricted` but for which no `allowed_cities` were added yet
**When**: the web decides visibility for any pickup city
**Then**: it stays visible nationwide — a half-configured restriction must never silently delist a sellable category; operators must populate cities to actually restrict
**Evidence**: `isCategoryVisibleInCity('restricted', [], 'medellin')` returns `true`

## SCEN-D07: no pickup city selected → don't hide
**Given**: a `restricted` category and a search where no pickup city is resolved yet (`null`)
**When**: the web decides visibility
**Then**: it stays visible — visibility is only narrowed once a city is known
**Evidence**: `isCategoryVisibleInCity('restricted', ['bogota'], null)` returns `true`
