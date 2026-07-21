# PR #357 adversarial review — C3 structured data

**Verdict: REFUTED**

Reviewed PR head `51d0f1e4715289c16e1d304443fa9cac591d74b0` against `main` (`d697bc521eb4b58784be14156164a0b4246b368f`) on 2026-07-18. This is a review-only result; no application code was changed.

The PR fixes the broken SearchAction and most F6/F7 identity mechanics, but it does not meet the mission's semantic-truthfulness gate. It replaces unsupported city Products with an `AggregateOffer` that still presents global seasonal pricing rows as city offers. The Alquilatucarro home also retains a disconnected Offer/provider subgraph that contradicts the new intermediary model.

## Blocking findings

### 1. City `AggregateOffer` is not a real city offer set

`packages/logic/src/composables/useCityServiceSchema.ts:11-13` explicitly says the input is "global rather than city/date inventory." Nevertheless, lines 23-30 flatten every positive active `categories[].month_prices[]` row, and lines 50-63 publish those rows as a city-specific `AggregateOffer`:

- `url` and `itemOffered` point at `/{city}`.
- the parent Service says `areaServed` is that City;
- `lowPrice`/`highPrice` are the global row extrema;
- `offerCount` is the number of seasonal price rows, not a count of separately bookable offers.

This reproduced identically on all 57 city pages (19 cities × 3 brands). On each `/bogota` preview the emitted object was:

```json
{
  "@type": "AggregateOffer",
  "lowPrice": 220000,
  "highPrice": 570000,
  "offerCount": 48,
  "priceCurrency": "COP"
}
```

Those 48 rows have no city applicability, pickup date, category identity, or demonstrated availability. The focused test encodes the same semantic mistake: `useCityServiceSchema.runtime.test.ts:102-114` turns four multi-season price rows into `offerCount: 4` without proving four offers exist.

Rendered-content comparison also fails:

- Alquilatucarro `/bogota` contains neither `$220.000` nor `$570.000` in rendered visible text. It visibly promotes `$138.300/día`, while the resolved WebPage name still says `desde $32/día`.
- Alquilame and Alquicarros show category cards at the two extrema, but that does not turn 48 global seasonal database rows into 48 Bogotá offers or establish city/date availability.
- The JSON-LD structural validator accepts the vocabulary, but structural acceptance does not make the claims true.

This is the exact class of fake Offer semantics the review gate prohibits. A truthful result would emit the city Service without `offers` until a city/date-applicable, user-visible offer set exists, or derive the aggregate from such a set and render matching facts.

### 2. Alquilatucarro home retains a contradictory standalone Offer graph

The emitted home graph still includes:

```text
Offer https://alquilatucarro.com#promotion
name = Hasta 60% de Descuento - Reserva Anticipada
seller/provider = anonymous Organization "alquilatucarro"
itemOffered = Service "Alquiler de Carros"
```

This comes from `usePromotionSchema.ts:36-86`, invoked by `ui-alquilatucarro/app/pages/index.vue:275-279`. Its `UnitPriceSpecification` has no price; it encodes the discount percentage as `referenceQuantity = 60 P1`, which is a reference quantity, not a discount. It also declares Alquilatucarro the seller/provider of a direct rental Service while PR #357's canonical graph says AMAW provides/brokers an intermediary Service. The anonymous Organizations do not reuse the new stable AMAW/Brand IDs.

The promotion copy is visible, so the problem is not hidden text; it is the unsupported Offer/price encoding and contradictory entity role. This was not covered by the new negative assertions, which inspect the base/city composables rather than final home output.

## Gates that passed

### Render, JSON syntax, SearchAction, and hard rating gate

PR-specific Vercel previews were fetched for home, `/bogota`, `/blog/alquilar-carro-bogota-guia`, and `/tarifas` where applicable. All 10 representative pages returned 200 and each JSON-LD block parsed with `JSON.parse`.

The broader sitemap crawl mapped each canonical pathname back to its PR preview:

```text
Alquilatucarro: 42 URLs, 42 JSON-LD blocks, 0 parse errors
Alquilame:       41 URLs, 41 JSON-LD blocks, 0 parse errors
Alquicarros:     41 URLs, 41 JSON-LD blocks, 0 parse errors
Total:          124 URLs, 124 JSON-LD blocks, 0 parse errors
```

Across all 124 blocks:

- `SearchAction`: 0
- `search_term_string`: 0
- `AggregateRating`: 0 (hard gate passed)
- `Product`: 0
- `AutoRental`: 0

Direct requests to the old encoded literal path returned Alquilatucarro 404, Alquilame 200, and Alquicarros 404. The Alquilame dynamic-city fallback remains permissive, but no reviewed page or sitemap emits the template, so the SearchAction crawl-source requirement itself is resolved.

The official Schema.org validator endpoint rendered all 10 representative preview URLs and reported `totalNumErrors=0` and `totalNumWarnings=0`. This validates structural vocabulary/shape only; it did not detect the factual Offer defects above.

### F7 entity graph and visible city count

The canonical core graph passed:

- resolved WebPage nodes have page-specific `name` and no `title: "AMAW SAS"`;
- the AMAW node is typed `Organization` with stable `@id` and canonical URL;
- all three related brands are runtime `Brand` nodes with stable IDs/URLs;
- `subOrganization` is absent;
- Service brand references resolve to typed Brand IDs on every crawled page;
- each home renders links for exactly 19 distinct active city slugs and visible copy says 19 cities.

The remaining home Offer subgraph described in blocker 2 is the exception to that otherwise coherent entity model.

## Tests and blind spot

```text
Focused changed/schema tests: 9 files passed, 51 tests passed
Full logic suite:            119 files passed, 792 tests passed
```

The full run then reported the already-documented `html-encoding-sniffer` → `@exodus/bytes` CommonJS/ESM loader error and did not exit; it was terminated after the complete 119/119 and 792/792 results printed.

The green suite does not refute the blockers. It tests object shape and parity, but has no rendered-page assertion that an AggregateOffer corresponds to visible, city/date-applicable offers, and no final-home graph assertion covering `useEarlyBookingPromotion()`.

## Merge overlap with PRs #352–#356

At current fetched heads:

```text
#352 ae3200e  exact changed-file overlap: 0  merge-tree with #357: clean
#353 3bc2360  exact changed-file overlap: 0  merge-tree with #357: clean
#354 4a65654  exact changed-file overlap: 0  merge-tree with #357: clean
#355 9ad4dbd  exact changed-file overlap: 0  merge-tree with #357: clean
#356 ff9b05f  exact changed-file overlap: 0  merge-tree with #357: clean
```

No direct merge conflict is predicted. In particular, retaining `useCityProductSchema` as a compatibility alias avoids an exact file overlap with PR #355's Alquilatucarro `CityPage.vue`; that merge cleanliness does not correct the AggregateOffer data semantics.

## Required before confirmation

1. Remove the city `AggregateOffer` until the graph can use actual city/date-applicable, user-visible offers, or rebuild it from such a set without counting raw seasonal rows as offers.
2. Remove the Alquilatucarro promotion Offer or remodel it with truthful Offer/price semantics and references to the canonical intermediary Service/AMAW/Brand entities.
3. Add rendered-output tests that compare city Offer values/counts to the represented visible offer set and inspect final home JSON-LD, including a negative fake-Offer assertion.

## Re-review after `c7f3809`

**Final verdict: CONFIRMED-RESOLVED**

Re-reviewed only the two outstanding structured-data blockers at PR head `c7f3809616be2d1eee6cb506a734b6e7e26b4bcd` on 2026-07-18. This was review-only; no application code was changed.

The fix removes both disputed producers rather than relabeling them:

- `useCityServiceSchema.ts` no longer reads global category/seasonal pricing and the emitted city `Service` has no `offers`, price bounds, availability, or `offerCount`.
- The Alquilatucarro promotion `Offer` was removed at the page call, barrel export, and composable; the visible “Hasta 60% de Descuento” copy remains.
- The prior rendered-output blind spot is covered by `e2e/structured-data-offer-truthfulness.spec.ts`, which requires a visible 1:1 DOM contract for any future city offers and inspects the final home graph for the deleted promotion semantics.

Fresh Chromium checks against all three green PR previews passed: Alquilatucarro 2/2; Alquilame and Alquicarros each passed the shared city check (their Alquilatucarro-only home assertion skipped). Each city graph contained the expected intermediary `Service` and no `offers`; the Alquilatucarro home still visibly rendered the promotion copy while emitting no promotion Offer.

The same original representative set was then loaded and parsed from the final browser DOM: home, `/bogota`, and `/blog/alquilar-carro-bogota-guia` on all three brands, plus Alquilatucarro `/tarifas` (10 pages total). All 10 returned HTTP 200; all 10 `application/ld+json` blocks parsed. Aggregate scan:

```text
Offer:                         0
AggregateOffer:                0
AggregateRating:               0
#promotion references:         0
referenceQuantity:             0
city Services with `offers`:   0
JSON parse errors:              0
```

Therefore the fabricated city seasonal-row aggregate, the contradictory promotion Offer/provider graph, and the hard `AggregateRating` concern are absent from the emitted JSON-LD. No untruthful claim remains from the previously outstanding items on the representative pages.
