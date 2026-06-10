---
name: city-representative-price
created_by: brainstorming
created_at: 2026-06-10T12:00:00Z
---

# Issue #68 — Representative per-category price in city-page JSON-LD (no JS)

Holdout for replacing the fabricated `cityPricing × priceMultiplier` matrix in
`useCityProductSchema` with the real `one_day_price` from `category_pricing`, selected
date-free as the cheapest positive active rate. SCEN-001/002/006 carry exact-value oracles
in the `pickRepresentativeDailyPrice` unit test; SCEN-003/004/005 are runtime-asserted on
the emitted schema object; SCEN-007 is a determinism invariant.

## SCEN-001: real price replaces the fabricated value
**Given**: `categories` contains category `C` whose only `active` `category_pricing` row has `one_day_price = 90000`
**When**: `pickRepresentativeDailyPrice(month_prices)` selects the row and the city product schema is built
**Then**: the `C` `Product`'s `offers.price` is exactly `90000`, and no value derivable from the deleted `cityPricing × priceMultiplier` formula (e.g. `198000` for a Bogotá SUV) appears in the output
**Evidence**: `pickRepresentativeDailyPrice` unit test returns the row with `one_day_price === 90000`; composable runtime test captures `productSchemas[i].offers.price === 90000`

## SCEN-002: "desde" picks the cheapest active positive rate, ignoring inactive
**Given**: category `C` has `active` rows with `one_day_price` of `120000` and `90000`, plus an `inactive` row with `one_day_price = 70000`
**When**: `pickRepresentativeDailyPrice(month_prices)` runs
**Then**: it returns the row with `one_day_price === 90000` — the minimum among **active** rows; the cheaper inactive `70000` is ignored
**Evidence**: unit test asserts the returned row's `one_day_price === 90000`

## SCEN-003: the daily unit is explicit in the offer
**Given**: any category that yields a representative price
**When**: its `Offer` is emitted into the JSON-LD
**Then**: the offer carries `priceCurrency: 'COP'` and a `priceSpecification` of `@type` `UnitPriceSpecification` with `unitCode: 'DAY'`, so the number cannot be misread as a rental total
**Evidence**: composable runtime test asserts `offers.priceSpecification['@type'] === 'UnitPriceSpecification'` and `offers.priceSpecification.unitCode === 'DAY'` and `offers.priceCurrency === 'COP'`

## SCEN-004: seller/brand use the human brand label per brand
**Given**: an app config where `organization.brand === 'Alquilame'`
**When**: a city page renders its product schema
**Then**: every emitted `seller.name` and `brand.name` equals the exact string `'Alquilame'` — never the previously-hardcoded `'Alquilatucarro'`, and never the domain `'alquilame.co'` (which is `franchise.name`)
**Evidence**: composable runtime test with mocked `useAppConfig` (`organization.brand = 'Alquilame'`) asserts each emitted `seller.name === 'Alquilame'` and `brand.name === 'Alquilame'`

## SCEN-005: fail-soft when a category has no real price
**Given**: a representative category that is absent from `categories`, OR whose `active` rows all have `one_day_price = 0` (no monthly plan)
**When**: the schema renders
**Then**: `pickRepresentativeDailyPrice` returns `undefined`, that category emits no `Product`, the rendered `productSchemas` array simply omits it, and rendering does not throw on a sentinel/empty payload
**Evidence**: unit test asserts `undefined` for an all-zero/empty/inactive-only input; composable runtime test with a payload missing `C` asserts no schema has `@id` ending `#vehicle-C` and the call does not throw

## SCEN-006: a mixed positive+zero active set never emits $0
**Given**: category `C` has two `active` rows, one with `one_day_price = 0` and one with `one_day_price = 110000`
**When**: `pickRepresentativeDailyPrice(month_prices)` runs and the offer is built
**Then**: it returns the row with `one_day_price === 110000` — the `0` row is excluded — and no `Product` with `offers.price === 0` is emitted
**Evidence**: unit test asserts returned `one_day_price === 110000`; composable runtime test asserts no emitted `offers.price === 0`

## SCEN-007: selection is deterministic across server and client renders
**Given**: the representative-price selection makes no `Date`/`now` call (date-free)
**When**: the same `categories` payload is rendered on the server and again on client hydration
**Then**: the selected price for each category is identical between the two renders — no hydration mismatch in the JSON-LD
**Evidence**: source of `pickRepresentativeDailyPrice` and the composable price path contain no `Date`/`Date.now`/`new Date` reference (grep); unit test is a pure function of its input (same input → same output across repeated calls)
