# Fresh adversarial review C2 — PR #355

**Verdict: REFUTED**

Reviewed commit: 25de8d00a082889fc7dfcd13b42843adbf252fe3  
Base: d697bc521eb4b58784be14156164a0b4246b368f (main)  
Scope: F3, F5, F9; 43 changed files; review only.

PR #355 fixes the F3 route behavior and the mechanical title/description issues, but it does not satisfy F5's one-price-source requirement or F9's factual-copy requirement. The repository-wide quality check is also red.

## Blocking evidence

### 1. F5 is still contradicted by a hardcoded $32 price on all three brands

The changed city title, search description, and FAQ copy no longer publish numeric prices. However, the shared home/base SEO input was not changed:

- packages/ui-alquilatucarro/app/app.config.ts:38
- packages/ui-alquilame/app/app.config.ts:42
- packages/ui-alquicarros/app/app.config.ts:42

Each still contains:

    title: "Alquiler de Carros en Colombia desde $32/día"

That value is consumed by useBaseSEO and by the three home pages' Open Graph/Twitter metadata. All three deployed PR previews therefore still emit it:

| Preview | Rendered home title |
|---|---|
| Alquilatucarro | Alquiler de Carros en Colombia desde $32/día \| Alquilatucarro |
| Alquilame | Alquiler de Carros en Colombia desde $32/día \| Alquilame |
| Alquicarros | Alquiler de Carros en Colombia desde $32/día \| Alquicarros |

The preview's Supabase-backed rentacar-data feed reports active daily category prices of COP 220,000, 250,000, 300,000, 550,000, and 570,000; the lowest is COP 220,000. Bogotá JSON-LD correctly reflects that feed (COP 220,000 for Económico), while the home title independently claims $32/day with no currency or provenance. This is still two price sources and a public contradiction.

Repository grep found no remaining literal "precios desde" in the changed city SEO/FAQ path, but the three static $32 sources above are sufficient to refute F5.

### 2. F9's city prose still promises pickup locations the application does not offer

The five-city spot-check compared SSR-visible Spanish prose with the same preview's active branches from /api/rentacar-data. Four of five pages make unsupported pickup claims:

| City | SSR-visible claim | Active branch feed | Result |
|---|---|---|---|
| Ibagué | "Contamos con entrega en el Aeropuerto Perales y en nuestra sede del centro." | ACIBG, name/slug Ibagué; no airport branch | Unsupported |
| Manizales | "Retira tu carro en el Aeropuerto La Nubia" and FAQ promises airport + center | ACMNZ, name/slug Manizales; no airport branch | Unsupported |
| Palmira | "recoges el carro apenas aterrizas" and FAQ promises airport service | ACKPA, name/slug Palmira; no airport branch | Unsupported |
| Villavicencio | "Desde el Aeropuerto Vanguardia recoge tu carro" and FAQ promises airport + center | ACVLL, name/slug Villavicencio; no airport branch | Unsupported |
| Soledad | Airport pickup claim | ACBSD, name Soledad Aeropuerto, slug soledad-aeropuerto | Supported control |

The application's own CTA helper treats codes beginning with AA as airport branches. None of the four unsupported rows is airport-coded or airport-named, and the search inventory exposes no second airport branch for those cities. These are not harmless destination facts; they promise pickup surfaces absent from the page's actual inventory.

The PR did not revise this prose. In useCityFAQs.ts it replaced only the numeric price answer for each city. Its new tests compare price strings and source text, never city claims against active branch data.

### 3. The focused 22-test claim hides a red repository quality gate

GitHub Actions run 29657558281 has Quality Checks = FAILURE. The failing step is ui-alquicarros:

    Test Files  1 failed | 42 passed
    Tests       2 failed | 559 passed

Both failures are in packages/ui-alquicarros/tests/f2-legales.test.ts. They still require legal page titles to interpolate franchise.shortname manually, while this PR intentionally removes that suffix and relies on the global template. The runtime behavior is correct, but leaving the existing suite red is an unintended test regression and a merge blocker.

The focused tests are mixed quality:

- buildCityReservationURL's 9 tests exercise the pure URL behavior meaningfully.
- The city/search SEO tests inspect composable output under mocks and are useful unit coverage.
- Five of seoContentHygiene.test.ts's seven cases are source-text assertions: one CTA call-site string check, three brand title regex checks, and one TikTok string check. They do not render Nuxt heads, hydrate CTAs, follow links, or inspect HTTP status.
- No test validates city prose against active branch inventory, so the factual F9 failure is invisible.

The exact focused command could not be rerun in this clean review worktree because dependencies/vitest are absent. CI's Logic step did pass, so this is not evidence that the claimed 22 tests themselves fail. It is evidence that passing them is insufficient: the full branch check still fails and the factual gaps are uncovered.

## Confirmed-safe portions

### F3 route behavior passes

Using each deployed preview's live branch data, I generated the helper's dated CTA target for all 19 cities on all three brands and requested each URL without following redirects:

- Alquilatucarro: 19/19 direct HTTP 200 on /{city}/buscar-vehiculos/...; zero redirects.
- Alquilame: 19/19 direct HTTP 200 on /reservas/...; zero redirects.
- Alquicarros: 19/19 direct HTTP 200 on /reservas/...; zero redirects.

The public branch slug and normalized 12-hour values are accepted by each actual route tree. No brand route surface was broken.

### F5 city-specific surfaces are internally aligned

The city title/search description and all 19 price FAQs omit numeric from-prices. FAQPage uses the same getCityPriceAnswer output. Product JSON-LD remains Supabase-backed and currently matches the rentacar-data category price rows. The blocker is the untouched brand-level $32 claim, not these changed city surfaces.

### F9 title mechanics pass

Across 57 deployed city pages:

- longest Alquilatucarro title: 52 characters;
- longest Alquilame title: 47 characters;
- longest Alquicarros title: 49 characters;
- no city title exceeds 60;
- no city description exceeds 155 (maximum 155);
- the changed static blog/legal/referral/status titles render one brand suffix, not two.

The mechanical title/ellipsis change is safe. The factual prose is not.

## 43-file unintended-diff audit

The application diffs are narrowly scoped to the shared URL/SEO/FAQ helpers, three CTA call sites plus TikTok, and one-line title changes across the brand page copies. I found no changed canonical, sitemap, robots block, broken CTA link, or route-surface regression. The material unintended outcomes are:

1. the three untouched app.config.ts hardcoded price sources leave F5 incomplete;
2. existing unsupported city pickup prose leaves F9 incomplete;
3. two stale Alquicarros tests were not updated, leaving CI red.

## Required before CONFIRMED-SAFE

1. Remove the static $32 title from all three app configs/home social metadata, or derive any numeric public claim from the same dated pricing source with explicit currency and applicability.
2. Replace airport/center pickup promises with inventory-backed copy, or add and verify the promised active pickup branches. Recheck all 19 cities, not only the five sampled.
3. Update the conflicting Alquicarros legal-title tests to assert the final rendered single suffix, and add output-level tests for CTA destinations and factual city pickup copy.

## Re-review — 2026-07-18 16:15 COT

**Final verdict: STILL-REFUTED**

Reviewed head: `4b2114359acd833172de3e83d796adde64bf28b3`  
Base: `d697bc521eb4b58784be14156164a0b4246b368f` (`main`)  
Scope: only the three items under “Required before CONFIRMED-SAFE”; review only.

The follow-up commit resolves the red Alquicarros tests and makes the main city FAQ/description surfaces materially safer. It does not close the one-price-source requirement, and one of the 19 cities still publishes airport-pickup claims without airport inventory.

### 1. Static home/social price — STILL OPEN

Partial pass: the runtime `$32` literal is gone. The three app configs now contain the same explicit-COP replacement:

- `packages/ui-alquilatucarro/app/app.config.ts:38`
- `packages/ui-alquilame/app/app.config.ts:42`
- `packages/ui-alquicarros/app/app.config.ts:42`

Each is a source constant:

    title: "Alquiler de Carros en Colombia desde $220.000 COP/día"

The three home pages pass that constant straight to `ogTitle` and `twitterTitle` (`ui-alquilatucarro` lines 226/238, `ui-alquilame` 36/48, `ui-alquicarros` 39/51). All three deployed previews consequently render `$220.000 COP/día` in `<title>`, `og:title`, and `twitter:title`.

The live `/api/rentacar-data` feeds currently report a minimum positive active `one_day_price` of COP 220,000 (maximum COP 570,000), with the COP 220,000 rows dated through 2026-07-31, 2026-08-31, 2026-09-30, 2026-10-31, 2026-11-30, and 2026-12-31. Thus the copied value happens to match today.

It is still not derived from that dated source: the public title is an independent `app.config.ts` string and will not change or disappear when the pricing rows change, expire, or become unavailable. This preserves the exact two-source drift that the prior gate required removing. Explicit currency fixes the old ambiguity, but a matching snapshot is not a single price source.

### 2. Airport/center pickup claims across all 19 cities — STILL OPEN (Palmira)

I fetched the live active branch inventory and all 57 deployed city pages (19 cities × 3 brands). Every route returned HTTP 200, and every page's rendered FAQPage output contained the exact pickup answer generated from its current branch names: 57/57 matched. The generic benefit copy now gives an inventory prompt, and the previously unsupported Floridablanca, Ibagué, Manizales, Palmira, and Villavicencio descriptions/FAQs no longer promise an airport or center branch.

Full 19-city inventory/output audit:

| City | Active branch names used by search | Inventory FAQ in previews | Residual unsupported pickup claim |
|---|---|---:|---|
| Armenia | Armenia Aeropuerto | 3/3 | none |
| Barranquilla | Barranquilla Aeropuerto; Barranquilla Norte | 3/3 | none |
| Bogotá | Bogotá Aeropuerto; Bogotá Almacén Éxito del Country; Bogotá Almacen Yumbo Calle 170; Bogotá Centro Nuestro; Bogotá Fontibón | 3/3 | none |
| Bucaramanga | Bucaramanga Aeropuerto | 3/3 | none |
| Cali | Cali Aeropuerto; Cali Norte Chipichape; Cali Sur Camino Real | 3/3 | none |
| Cartagena | Cartagena Aeropuerto | 3/3 | none |
| Cúcuta | Cúcuta Aeropuerto | 3/3 | none |
| Floridablanca | Floridablanca | 3/3 | none |
| Ibagué | Ibagué | 3/3 | none |
| Manizales | Manizales | 3/3 | none |
| Medellín | Medellín Aeropuerto José María Córdoba; Medellín Centro Éxito Colombia; Medellín El Poblado; Rionegro | 3/3 | none |
| Montería | Montería Aeropuerto; Montería Ciudad | 3/3 | none |
| Neiva | Neiva Aeropuerto | 3/3 | none |
| Palmira | Palmira (`ACKPA`, non-airport) | 3/3 | **two airport-pickup testimonials** |
| Pereira | Pereira Aeropuerto | 3/3 | none |
| Santa Marta | Santa Marta Aeropuerto; Santa Marta Barrio El prado | 3/3 | none |
| Soledad | Soledad Aeropuerto | 3/3 | none |
| Valledupar | Valledupar Aeropuerto | 3/3 | none |
| Villavicencio | Villavicencio | 3/3 | none |

Palmira's only active branch is `ACKPA`, name/slug `Palmira`; there is no AA-coded or airport-named branch. Nevertheless, all three `/palmira` previews visibly render these claims from the live city testimonials:

    El aeropuerto de Cali queda en Palmira, así que recoger el carro acá es lógico.
    Vine de turista y no sabía que el aeropuerto de Cali está en Palmira. Recogí el carro ahí ...

The same stale source remains in `scripts/cities-data.json:1261` and `:1294`, and `/api/city-testimonials?slug=palmira` serves both quotes. The commit changed Palmira's description, build-time snippet, FAQ, and generic benefit, but not this public pickup content. Therefore the all-city requirement is 18/19, not 19/19.

### 3. Alquicarros legal-title tests and Quality Checks — RESOLVED

`packages/ui-alquicarros/tests/f2-legales.test.ts:48-54` now expects bare legal titles, rejects manual `franchise.shortname/title` suffixes, and retains the config-driven canonical assertion. GitHub Actions run `29660027599`, job `88120987552`, passed:

- `tests/f2-legales.test.ts`: 15/15 tests passed;
- complete `ui-alquicarros` suite: 43/43 files, 561/561 tests passed;
- `gh pr checks 355`: Quality Checks = pass; E2E Reservation Payload and all three Vercel deployments also pass.

### Final gate

Item 3 is resolved. Items 1 and 2 remain open, so PR #355 is **STILL-REFUTED** at `4b21143`.

## Re-review — 2026-07-18 16:55 COT

**Final verdict: STILL-REFUTED**

Reviewed head: `9ad4dbd7ac6d96ea3a7ad3882f9d3250c742f0ed`  
Base: `d697bc521eb4b58784be14156164a0b4246b368f` (`main`)  
Scope: only my still-open items 1–2; review only.

### 1. Home/social price source — STILL OPEN

Partial pass: the stale `$32` text is gone, and the current preview feed still has a COP 220,000 minimum among 48 positive active tariff rows. The three deployed homes consistently render `$220.000 COP/día` in the document title, Open Graph title/description, and Twitter title/description.

The original one-price-source failure is unchanged, however. There are now **six independent numeric literals** in the three app configs—one in `franchise.title` and one in `franchise.description` per brand:

- `packages/ui-alquilatucarro/app/app.config.ts:38,40`
- `packages/ui-alquilame/app/app.config.ts:42,44`
- `packages/ui-alquicarros/app/app.config.ts:42,44`

Each home passes those constants directly to `ogTitle`, `ogDescription`, `twitterTitle`, and `twitterDescription`; no pricing feed or dated selector participates in producing them. Commit `9ad4dbd` only copied the same static number into the three descriptions. A tariff change or expiry therefore still leaves all home/social claims unchanged.

The new test does not close this gap: `seoContentHygiene.test.ts:84,135-147` defines its own `CANONICAL_DAILY_FLOOR = '$220.000 COP/día'` and asserts source strings/wiring. It never supplies a changed or unavailable tariff feed. The current match is still a snapshot, not derivation from the dated price source required by the prior gate.

### 2. Pickup copy across all 19 cities — STILL OPEN (live Palmira testimonials)

Partial pass: I fetched the current active inventory and all 57 deployed city pages (19 cities × 3 brands). All returned HTTP 200, and all **57/57** FAQPage pickup answers exactly named the branches from that preview's current inventory. The generic benefit and city descriptions no longer invent an unsupported pickup location.

Palmira still fails the public all-city sweep. Its only active branch is `ACKPA`, name/slug `Palmira`; there is no airport-coded or airport-named branch. Nevertheless, every current-head preview's `/api/city-testimonials?slug=palmira` and rendered `/palmira` page still expose both unsupported quotes:

    El aeropuerto de Cali queda en Palmira, así que recoger el carro acá es lógico.
    Vine de turista y no sabía que el aeropuerto de Cali está en Palmira. Recogí el carro ahí ...

The commit changed `scripts/cities-data.json:1261,1294`, but that is not the deployed testimonial source. `packages/logic/server/api/city-testimonials.get.ts:22-28` reads `cities.testimonials` from Supabase, and the public endpoint still returns the old values on all three brands. The expanded regression at `seoContentHygiene.test.ts:183-198` reads only `scripts/cities-data.json`, so it passes without observing the live database-backed content path.

Thus the inventory-derived FAQ is 19/19, but the complete public pickup-copy requirement remains **18/19** because Palmira's two visible testimonials were not updated in the source actually served by the application.

### Final gate

Both requested outstanding items remain unresolved at `9ad4dbd`: the home/social numeric claim is still a static second price source, and Palmira still publishes unsupported airport-pickup testimonials on all three deployed previews. PR #355 remains **STILL-REFUTED**. No other PR areas were re-reviewed.

## Re-review round 4 — 2026-07-18 17:57 COT

**Final verdict: CONFIRMED-RESOLVED**

Reviewed head: `09fa9d08b16be092c65161e7f6d47032c052f0c9`  
Base: `d697bc521eb4b58784be14156164a0b4246b368f` (`main`)  
Scope: only the two items still open at `9ad4dbd`, verified on the three exact-head Vercel deployments; review only.

### 1. Home/social price source — RESOLVED

The three preview homes and their `/api/rentacar-data` endpoints returned HTTP 200. For the Colombia date `2026-07-18`, each feed exposed eight positive active category rows applicable from `2026-07-01` through `2026-07-31`; their current daily floor was COP 220,000. Raw SSR output and the hydrated final DOM agreed on all six reviewed fields: document title/description, Open Graph title/description, and Twitter title/description all rendered `desde $220.000 COP/día` (with only the brand suffix differing in the document title).

The deployed runtime now proves derivation rather than another matching snapshot. In each of the three live preview pages, I temporarily changed only the eight hydrated applicable tariff rows to COP 321,000. All six metadata fields immediately changed to `$321.000 COP/día`. Marking those rows inactive removed the numeric claim from all six fields instead of falling back to `$220.000`; restoring the page state restored `$220.000`. The probe was browser-local and restored in the same evaluation; it made no API or database write.

This closes the original single-source failure: home/social metadata follows the dated tariff state and fails closed when no applicable active tariff exists.

### 2. Palmira unsupported airport-pickup testimonials — RESOLVED

All three `/api/rentacar-data` responses still show Palmira's sole active branch as code `ACKPA`, name/slug `Palmira`; no airport branch was added. All three `/api/city-testimonials?slug=palmira` requests returned HTTP 200 with the same six replacement testimonials. Neither former airport-pickup quote is present, and none of the six current quotes contains `aeropuerto`.

All three deployed `/palmira` pages returned HTTP 200. Final-DOM inspection showed the six replacement testimonials and zero occurrences of either stale claim:

    El aeropuerto de Cali queda en Palmira, así que recoger el carro acá es lógico.
    Vine de turista y no sabía que el aeropuerto de Cali está en Palmira. Recogí el carro ahí ...

The testimonial section itself has zero airport mentions on all three brands. Palmira therefore no longer claims airport pickup through testimonials while its non-airport inventory remains unchanged.

### Final gate

Both requested outstanding items are resolved on the exact-head served output. PR #355 is **CONFIRMED-RESOLVED** at `09fa9d0`. No other PR areas were re-reviewed, and no application code was changed.
