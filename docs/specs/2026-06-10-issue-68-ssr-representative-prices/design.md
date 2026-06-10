# Issue #68 — Representative per-category price in city-page JSON-LD without JS

> Épico: #63 · Origen: auditoría agéntica 2026-05-26 · Label: enhancement, auditoria-agentica

## Problem

A crawler that does not execute JS reading a city landing page should see a real,
representative "from" price per vehicle category in the structured data. Today it does
see per-category `AggregateOffer` nodes — but the numbers are fabricated.

`packages/logic/src/composables/useCityProductSchema.ts` builds those offers from two
hardcoded sources, neither tied to real pricing:

- A 19-city price matrix typed by hand (`cityPricing`, lines 10–30). The comment even
  says the numbers were copied "from useCityFAQs.ts" — i.e. from FAQ marketing copy, not
  from pricing data.
- Per-category multipliers (`priceMultiplier` 1.0 / 1.3 / 1.8 / 2.5, lines 33–58).

Final price = `cityPricing[city] × priceMultiplier` (lines 69–73). Example: a SUV in
Bogotá publishes `110000 × 1.8 = 198.000 COP` — a number invented in source that Google
indexes as a real price. Publishing fabricated prices in structured data is a
credibility and rich-result-penalty risk, and it never matches the checkout.

Two adjacent fabrications live in the same file:

- `name: 'Alquilatucarro'` hardcoded in `brand` and `seller` (lines 84, 96) — emitted
  even on alquilame and alquicarros. Same multi-brand leak class as issue #108.
- `offerCount: 4` and `priceValidUntil: '2026-12-31'` hardcoded (lines 92, 94).

## Goal

Replace the fabricated per-category price with a real one derived at SSR from the
`category_pricing` data already present in the `rentacar-data` payload, so a JS-less
crawler reads an accurate "from" price per featured category. Acceptance criterion
(from the issue): the HTML/JSON-LD of a city page exposes a representative price per
category without executing JS.

## Key constraint discovered (pricing reality)

There are two distinct daily prices in the system, and only one is reachable without JS:

| Price | Source | Available at SSR |
| --- | --- | --- |
| Short-term daily (`vehicleDayCharge + coverageUnitCharge`) | Localiza, via POST `/api/reservations/availability` | No — JS only |
| Monthly-plan daily (`one_day_price` in `category_pricing`) | Supabase, via `rentacar-data` | **Yes** |

`one_day_price` is the per-day-equivalent base rate of the monthly plan — the same field
`useCategory.ts:159` already uses as the displayed daily base price. It is lower than the
short-term daily rate (volume discount), which makes it the honest, attractive basis for
a "desde $X/día" representation. It is sourced from the same `category_pricing` table that
feeds `pickPriceForDate` in the booking flow, so the published number is structurally
consistent with the checkout.

Consequence accepted by design: the SSR "from" price is the monthly-plan daily rate, not a
3-day short rental. A category with no monthly plan (`one_day_price = 0`, per issue #28's
`monthly_*_price = NULL` modeling) has no static daily price at all — those categories are
omitted rather than priced at a fabricated or zero value.

### Why not `pickPriceForDate` (the obvious reuse)

`pickPriceForDate(month_prices, date)` is the booking flow's date-aware selector, but it is
the wrong tool for a date-less landing page. A city page has no pickup date, so any
representative date we pass is arbitrary. Worse, `pickPriceForDate`'s Rule-3 `seasonLow`
fallback (`useTariffs`-adjacent, sorts active rows by `1k_kms`) can return a row whose
`one_day_price` is `0` or otherwise non-representative when the chosen date falls outside
every configured range — exactly the boundary a "today" date hits against seasonal ranges.
It also introduces a server/client `Date` that risks a hydration mismatch in the JSON-LD.

Instead the representative "from" price is selected date-free: the **minimum positive
`one_day_price` among `active` rows**. This matches "desde $X/día" semantics precisely, is
deterministic (no `Date`, so SSR and client renders are byte-identical), and structurally
cannot emit a `0` price.

## Approach (chosen: A)

Two files changed in the logic layer (propagates to all three brands):

1. **New pure util** `packages/logic/src/utils/pickRepresentativeDailyPrice.ts`:
   `pickRepresentativeDailyPrice(prices: CategoryMonthPriceData[]): CategoryMonthPriceData | undefined`
   — returns the `active` row with the smallest `one_day_price > 0` (tie-break by most
   recent `init_date`, mirroring `pickPriceForDate`'s convention); `undefined` if no active
   row has a positive `one_day_price`. Exported from `utils` and unit-tested. This is a
   trivial "cheapest active daily rate" selector — it does **not** touch the temporal
   season rules in `pickPriceForDate`, so it stays clear of that money landmine.
2. **`useCityProductSchema.ts` rewrite of the price path:**
   - **Data.** Add `categories` (`CategoryData[]`) and `organization` to the existing
     `useFetchRentacarData()` / `useAppConfig()` destructuring (already pull
     `vehicleCategories` / `franchise`).
   - **Price selection.** For each representative category code (C / FX / GC / LE), find its
     `CategoryData` by `id`, then `pickRepresentativeDailyPrice(month_prices)` → the row;
     `price = row.one_day_price`.
   - **Fail-soft.** If a category is absent from `categories` or the selector returns
     `undefined`, omit that `Product` node entirely — never a zero or fabricated price.
     Same sentinel-safe posture as the existing test.
   - **Schema shape.** `Product` → `offers: Offer` with `price = one_day_price`,
     `priceCurrency: 'COP'`, `priceSpecification: UnitPriceSpecification { unitCode: 'DAY' }`
     so the daily nature is explicit (the number is not read as a total),
     `availability: InStock`, `priceValidUntil` = the selected row's real `end_date` when
     non-empty, otherwise the field is **omitted** (no fabricated validity date — this is
     what removes the last hardcoded `'2026-12-31'`), and `seller` / `brand` name =
     **`organization.brand`** (the human brand label, e.g. `Alquilame` — NOT
     `franchise.name`, which holds the bare domain `alquilame.co`).
   - **Delete.** The `cityPricing` matrix (lines 10–30) and `priceMultiplier` (lines 33–58).
     Keep the curated Spanish category names and descriptions.

### Why not the alternatives

- **B — keep `AggregateOffer` low/high.** The issue asks for a concrete representative
  price, "not just the aggregate range". A single `Offer.price` answers that directly and
  avoids reintroducing a semi-arbitrary `highPrice`.
- **C — iterate the full real catalog.** Maximizes coverage but surfaces Localiza's
  Portuguese category descriptions (issue #74, unresolved) and loses editorial control.
  Out of scope for #68, which is about price truthfulness, not catalog coverage.

## Blast radius

- 2 files in `logic/` (1 composable rewrite + 1 new pure util) → city pages of all three
  brands (alquilatucarro, alquilame, alquicarros).
- Consumers: `CityPage.vue:435–437` (the call site), `useSchemaOrg` (JSON-LD output). The
  new util is consumed only by `useCityProductSchema`.
- Does **not** touch `/api/rentacar-data` → respects the `getKey=buildId` cache contract
  (#62) and introduces no cache-schema-drift risk.
- Does **not** touch `pickPriceForDate` or the booking-flow pricing path.
- Tests: new `pickRepresentativeDailyPrice` unit test; `useCityProductSchema.sentinelSafety.test.ts`
  must stay green and is extended for the new behavior.
- Export surface: `pickRepresentativeDailyPrice` added to the `utils` barrel.

## Out of scope (YAGNI)

Full catalog coverage; PT→ES translation (#74); cache TTL tuning; per-city SSR availability
(D2 / #116).

## Observable scenarios

Concrete inputs/expected values are pinned here so the holdout encodes them exactly.

- **SCEN-001 — real price replaces fabrication.** Given `categories` contains category `C`
  whose only active `category_pricing` row has `one_day_price = 90000`, when a city page
  renders its product schema at SSR, then the `C` `Product`'s `offers.price` is exactly
  `90000`, and no value derived from the deleted `cityPricing × priceMultiplier` formula
  (e.g. `198000` for a Bogotá SUV) appears anywhere in the output.
- **SCEN-002 — "desde" picks the cheapest active positive rate.** Given category `C` has
  active rows with `one_day_price` of `120000`, `90000`, and an inactive row of `70000`,
  when the offer is built, then `offers.price` is `90000` (the minimum positive **active**
  rate) — the inactive `70000` is ignored.
- **SCEN-003 — daily unit is explicit.** Given any emitted category offer, when the JSON-LD
  is read, then the offer carries a `priceSpecification` of type `UnitPriceSpecification`
  with `unitCode: 'DAY'` and `priceCurrency: 'COP'`, so the number cannot be misread as a
  rental total.
- **SCEN-004 — multi-brand seller/brand.** Given the alquilame app config
  (`organization.brand = 'Alquilame'`), when a city page renders product schema, then every
  emitted `seller.name` and `brand.name` equals the exact string `'Alquilame'` — never the
  hardcoded `'Alquilatucarro'` and never the domain `'alquilame.co'`.
- **SCEN-005 — fail-soft on missing/zero price.** Given a representative category that is
  absent from `categories`, or whose active rows all have `one_day_price = 0`, when the
  schema renders, then `pickRepresentativeDailyPrice` returns `undefined`, that category
  emits no `Product`, and rendering does not throw (sentinel payload handled safely).
- **SCEN-006 — mixed positive+zero active set never emits $0.** Given category `C` has two
  active rows, one with `one_day_price = 0` (monthly disabled) and one with
  `one_day_price = 110000`, when the offer is built, then `offers.price` is `110000` — the
  `0` row is excluded, and no `Product` with `price: 0` is emitted.
- **SCEN-007 — deterministic across renders.** Given the selection is date-free (no `Date`
  call), when the same payload renders on server and on client hydration, then the selected
  price is byte-identical between the two — no hydration mismatch.

These scenarios are the holdout set carried into scenario-driven-development; they define
"done", not the tests. SCEN-001/002/004/006 assert exact values; SCEN-005/007 assert
structural invariants.

### Testing strategy (avoids the source-regex trap)

The existing `useCityProductSchema.sentinelSafety.test.ts` asserts against the source
*string* (regex), which can confirm a selector is referenced but **cannot** prove a numeric
output (`offers.price === 90000`) — a `1k_kms`-vs-`one_day_price` field bug would ship
green under it. So:

- **Exact-value oracle lives in the `pickRepresentativeDailyPrice` unit test** (pure
  function, trivially runtime-asserted): SCEN-002 and SCEN-006 inputs/outputs are pinned
  there as real value assertions (`90000`, `110000`, ignores inactive/zero rows, `undefined`
  when none).
- **`useCityProductSchema` numeric/brand scenarios (SCEN-001/004) are runtime-asserted on
  the emitted schema object** — mock `useAppConfig` / `useFetchRentacarData` / `useSchemaOrg`,
  call the composable, and assert the captured `productSchemas` (`offers.price`,
  `offers.priceSpecification.unitCode`, `seller.name`/`brand.name`). Not a regex.
- The source-regex sentinel test is kept/extended only for its original purpose: structural
  optional-chaining safety against a sentinel payload (SCEN-005/007 posture).
