# Fresh adversarial review C5a — PR #356

**Verdict: REFUTED**

Reviewed commit: `ff9b05f3d46cbdabb863eb720a1a71b26d720d5f`  
Base: `d697bc521eb4b58784be14156164a0b4246b368f` (`main`)  
Scope: PERF-5, PERF-6, PERF-8, and the CLS hunt. Review only; no application code was changed or pushed.

PR #356 has useful pieces, and its Vercel edge-cache HIT claim is reproducible. It is not safe to merge as written: the new cache layer can serve Supabase price changes beyond the stated one-hour freshness window, the Bogotá hero car is materially smaller than production while downloading the same bytes, and newly generated image `srcset` values contain false/duplicated width descriptors. The interaction trace also does not reproduce the blanket `shifts: []` claim.

## Blocking evidence

### 1. `/tarifas` does cache, but price freshness is not bounded to one hour

I independently requested a new cache key on the deployed preview at 16:10 COT:

```text
GET /tarifas?review-c5a=20260718b #1: 200, x-vercel-cache: MISS, age: 0
GET /tarifas?review-c5a=20260718b #2: 200, x-vercel-cache: HIT,  age: 0
GET /tarifas?review-c5a=20260718b #3: 200, x-vercel-cache: HIT,  age: 0
```

Thus the edge-cache claim is real. It proves reuse, not freshness after a tariff edit.

The rendered page now stacks two independent one-hour caches:

1. `packages/logic/server/api/rentacar-data.get.ts` uses `defineCachedEventHandler(..., { maxAge: 3600 })`. Its own TODO says pricing edits can take up to one hour to surface and that invalidation is still open.
2. PR #356 adds `'/tarifas': { isr: 3600 }` in `packages/ui-alquilatucarro/nuxt.config.ts`.
3. `packages/logic/plugins/rentacar-data.ts` restores the ISR payload into `useState` and returns without a client refetch when that snapshot exists.

The clocks are not coupled and there is no Supabase/admin-write invalidation. A valid worst-case sequence is:

```text
t=00m  catalog handler caches price A
t=00m+ Supabase tariff changes to price B
t=59m  an uncached/revalidating /tarifas document is generated from still-valid catalog A
t=119m that ISR document finally expires/revalidates
```

A new request can therefore receive price A for almost two hours after the database change, not the documented one hour. A tab that already restored the payload keeps its snapshot for the rest of that SPA session. Current preview and production HTML both expose the same present value (`$3.806.000` in the sampled markup), but equality before a mutation does not test the promised freshness boundary.

The added test only asserts that the route-rule literal equals `3600`; it does not drive the two cache clocks, invalidate a tariff, or observe regenerated HTML.

### 2. PERF-6 regresses the city hero design and does not optimize its transfer

Fresh preview/production screenshots of `/bogota` were taken from the same Orca viewport and scroll position. Computed geometry is unambiguous:

| `/bogota` hero car | Production | PR preview |
|---|---:|---:|
| reserved/root box | 480×239 px | 480×239 px |
| painted element | 480×239 px CSS background | **480×167 px `<img>`** |

The preview car is visibly about 30% shorter/smaller. This violates the no-visual-design-change constraint. The reserved parent prevents that shrink from becoming CLS, but a stable wrong design is still a regression.

The live preview DOM also emits:

```text
sizes="480px"
srcset="/_nuxt/car.CAzYe7Pp.webp 480w,
        /_nuxt/car.CAzYe7Pp.webp 960w"
```

Both candidates are the same raw 1203×600 asset. Preview transfer: 265,868 bytes. Production `/images/hero/car.webp`: 265,868 bytes. The preview therefore adds a hashed URL but neither responsive selection nor byte reduction for this image; `currentSrc` is the raw `/_nuxt/**` asset, not `/_vercel/image`.

The source-string test only checks for `<NuxtImg`, an asset import, and absence of `background-image`; it cannot detect the live 480×167 rendering or identical candidate URLs.

### 3. New blog `srcset` output has false/duplicated descriptors, and related-card geometry changes

The preview blog-detail SSR output for the 1200×1800 `guatape-piedra.webp` hero ends with:

```text
/_vercel/image?...&w=1280... 1280w,
/_vercel/image?...&w=1536... 2560w
```

The `w=1536` response is actually 1200×1800 (the optimizer cannot upscale this source) and 348,629 bytes, yet the browser is told it is 2560 pixels wide. At 1461 CSS px / DPR 2 the browser selected that candidate and one trace reported a density-corrected `naturalWidth` of 684 px. That is not a truthful responsive descriptor.

Related/card output repeats the same URL under several widths, for example:

```text
w=320 labeled 253w and 320w
w=640 labeled 400w, 506w, and 640w
```

Those candidate lists can make the browser overestimate or underestimate resource density and defeat predictable responsive selection. The test asserts that `sizes` and `NuxtImg` strings exist; it never validates that descriptors match the returned image dimensions or that a mobile/desktop browser selects the intended rendition.

The related-post design also changed from production's fixed `h-40` (160 px) to `aspect-[5/2]`. At the measured 411 px desktop card width, preview renders a 164 px image box. On a narrower mobile card it becomes shorter than the former fixed 160 px. This is stable geometry rather than CLS, but it is a forbidden visual change.

### 4. CLS candidates improved, but “eliminated / shifts []” is not reproduced across interaction

Positive evidence from the preview trace:

- The proactive teaser's 5-second and 25-second stages produced zero no-input shift. The FAB stayed exactly at `(1381, 809)` with size 56×56 while the bubble grew from 62 to 106 px inside the reserved 106 px slot.
- Carousel dot slots remained 12×8 px and their row geometry did not change when the active dot changed.
- Post-load header height is 64 px on both preview and production.

Adversarial interaction evidence:

- Opening the contact menu emitted `0.008986`, correctly marked `hadRecentInput: true` and excluded from CLS.
- The real Bogotá vehicle-results page emitted a no-input layout-shift entry of **0.002098** from three `.contenedor-descripcion-carro` boxes during the carousel/lazy-content pass. This is small and below the CWV threshold, but it is not `shifts: []` and it is outside the components asserted by the new source-string test.

The known field value is 28-day origin CrUX (`CLS 0.24`), while the prior lab home result was already zero. A preview lab trace can validate specific candidates, but cannot establish that origin field CLS has been eliminated. That conclusion requires production rollout plus new attribution/CrUX data.

The animation edits also visibly change the design: pulsing multi-layer `box-shadow` effects become static shadows plus scaling border/filled pseudo-element rings. `box-shadow` animation is a paint/compositing concern, not layout geometry, so this is not required to fix CLS and violates the explicit no-design-change constraint.

## Screenshot comparison summary

Screenshots were captured at the same desktop viewport from preview and production and retained in `/tmp/review-c5a-visual-20260718/` during the review.

| Route | Result |
|---|---|
| Home | Full-page dimensions match (2922×11412 device px); SSIM `0.999626`. Monthly teaser computed section/image geometry matches the old 85%-wide background treatment. No material static regression found. |
| `/bogota` | Material regression: 480×239 production hero becomes a 480×167 painted image in preview; the car is plainly smaller. |
| `/blog/rutas-carro-desde-medellin` | Above-fold viewport is visually near-identical (SSIM `0.996798`), but related image boxes change 160→164 px at this width and full-page height differs by 10 device px. Responsive candidate descriptors are incorrect as detailed above. |

## Cross-mission ownership/conflict audit

Compared current heads: PR #352 `60b7c45`, PR #353 `3bc2360`, PR #355 `25de8d0`.

| Mission PR | Exact file overlap with #356 | Merge-tree result |
|---|---|---|
| #352 reservation 404 | none | clean |
| #353 index signals | `packages/ui-alquilatucarro/nuxt.config.ts` | clean |
| #355 content quality | `app/layouts/default.vue`, `app/pages/blog/index.vue`, `app/pages/blog/[...slug].vue` | clean |

The ownership overlap is real and should be coordinated, but the current heads auto-merge without textual conflicts. PR #353 changes different route-rule/sitemap lines; PR #355 changes footer URL construction and blog SEO head lines, while #356 changes header/image markup. I found no current conflict with PR #352.

## Confirmed-safe portions

- Vercel ISR `MISS → HIT` behavior for `/tarifas` is confirmed.
- The home monthly teaser preserves production geometry and now uses a hashed/optimized image URL.
- Blog above-fold visual geometry is preserved after image decode.
- Teaser slot reservation and fixed carousel dot slots eliminate the targeted geometry changes in the measured stages.
- Current PR heads #352/#353/#355 merge cleanly with #356 despite the documented overlap.

## Required before CONFIRMED-SAFE

1. Define and enforce a tariff freshness SLA across both cache layers. Use write-path/tag invalidation or make the combined worst-case TTL no greater than the documented window; add a clock-controlled or deployed mutation/revalidation test.
2. Restore the city hero's exact production geometry and prove the selected mobile/desktop resource is genuinely resized. Do not label the same raw URL as both 480w and 960w.
3. Generate truthful blog candidate descriptors (descriptor equals returned intrinsic width), remove duplicate URL/descriptor mappings, and verify `currentSrc` plus decoded dimensions at mobile and desktop widths.
4. Preserve the 160 px related-card design unless a visual change is explicitly approved.
5. Keep the compositor work visually equivalent, or obtain design approval; do not present paint-animation changes as necessary CLS fixes.
6. Replace source-string tests with browser assertions for hero/card geometry, candidate selection/response dimensions, tariff cache freshness, and the full interaction layout-shift pass.

---

## Re-review at `8e22fec` — STILL-REFUTED

Reviewed commit: `8e22fec4b70084e83f226afeafbfd8b2f9a9f1f3`  
Immutable preview: `https://alquilatucarro-fxtrdj51h-info-42181061s-projects.vercel.app`  
Review only; no application code was changed or pushed.

The static visual/resource regressions are resolved, and the server-side two-clock cache bug is narrowed to one ISR clock. The PR is still refuted because the promised user-visible tariff staleness bound is not enforced for an open SPA session, and the exact vehicle-results layout-shift case still fails decisively on the deployed head.

### Still outstanding

1. **An open SPA session can retain a tariff snapshot for longer than one hour.** The handler cache is correctly gone: two deployed requests to the same `/api/rentacar-data?review-c5a=same` key both returned `x-vercel-cache: MISS`, while `/tarifas?review-c5a=8e22fec` reproduced `MISS -> HIT`. However, `packages/logic/plugins/rentacar-data.ts` is unchanged and still returns immediately whenever `useState('rentacar-data')` contains the SSR snapshot. The direct reproduction seeded `PRICE-A`, made a divergent `PRICE-B` fetch available, and invoked the plugin twice; both observations remained `PRICE-A` with `fetches: 0`. A deployed/local browser SPA navigation from `/bogota` to `/tarifas` likewise issued **zero** `/api/rentacar-data` requests. Therefore a tab hydrated before a Supabase tariff edit can navigate after `t > 1h` and still render the old snapshot. The two independent *server* TTLs are fixed, but the stated `staleness <= 1h` contract is not.

2. **The full interaction/cold-load shift case is not resolved.** On the immutable `8e22fec` preview, the exact Bogotá vehicle-results route used in the first review produced no-input layout-shift totals of **`0.36185293180075423`** and **`0.3618529318007543`** in two fresh Chromium contexts (1461x900, DPR 2). Each repeat included a late **`0.026249917428781445`** entry at about 3.5-4.3 seconds sourced from the three vehicle/card `w-full` regions, in addition to hydration/header/content entries of `0.010718866`, `0.177557356`, and `0.147326793`. `hadRecentInput` was false for every entry. This is not `shifts: []`; it is also materially larger than the original `0.002098` reproduction.

### Confirmed resolved from my five visual/cache findings

- City hero parity is restored: production and preview root/painted boxes are both `480 x 239.39` CSS px. The deployed browser selected a truthful `w=960 ... 960w` candidate at DPR 2; raw optimizer responses were `480x239` (16,383 bytes) and `960x479` (47,949 bytes), rather than the same 265,868-byte source under two labels.
- Blog descriptors are truthful and unique for the reproduced hero/card cases. `guatape-piedra.webp` emitted `320/640/768/1024/1200w`, with each URL's `w=` equal to its descriptor and the `w=1200` response actually `1200x1800`. Related cards emitted distinct `320/400/640/800w`; the sampled `w=800` response was actually 800 px wide.
- Related-card geometry is back to exactly `160px` at the measured desktop width.
- The search/FAB/chat glow animation hunks match production again; the prior pseudo-element visual substitutions are gone while the teaser/dot reservation work remains.
- Focused cache/plugin/image/CLS tests passed `48/48`; they do not cover the two failing browser cases above.

### Final verdict

**STILL-REFUTED.** Preserve the resolved image/visual work, but add an age-aware client catalog refresh (without breaking hydration) so an open session cannot exceed the one-hour tariff SLA, and fix plus browser-regress the actual vehicle-results shift sequence before claiming `shifts: []`.

---

## Re-review round 3 at `7247b02` — STILL-REFUTED

Reviewed commit: `7247b02c34751bd0f56c5f70ff9567f0050244b4`  
Preview: `https://alquilatucarrocom-git-diego-alex-cc3935-info-42181061s-projects.vercel.app`  
Review only; no application code was changed or pushed.

The exact vehicle-results regression is resolved. The catalog plugin also now preserves hydration and genuinely refetches an expired snapshot. The PR is still refuted because the refreshed reactive source does not update an already-mounted tariff consumer: `/tarifas` continues displaying the expired, one-shot derived tariff object after the state refresh succeeds.

### 1. The age check refetches cleanly, but the open tariff page remains stale

Code review confirms the intended refresh mechanics:

- `/api/rentacar-data` attaches `catalogFetchedAt: Date.now()` to the response body.
- The client retains the payload-restored object until `app:mounted`, then schedules exact-expiry and one-minute checks plus focus/visibility recovery.
- At expiry it clears `useState('rentacar-data')`, performs one uncached API request, validates the server timestamp, and installs the fresh response.

Preview behavior confirmed those mechanics. A fresh `/tarifas?rr3=7247b02` hydration produced zero console messages, including zero Vue hydration mismatch warnings. Its restored timestamp was `1784416690419` and its first visible low-season monthly price was `$ 3.806.000 /mes`. I then advanced only the browser clock to `catalogFetchedAt + 3,600,001 ms`, intercepted the real `/api/rentacar-data` response to make the first category's active `1k_kms` value observably divergent (`8,765,000`), and dispatched `focus`.

Observed result:

```text
catalog fetches:             1
fresh server catalogFetchedAt: 1784416771950
state first active 1k_kms:   8765000
visible price after refresh: $ 3.806.000 /mes
visible contains $8.765.000: false
console/hydration messages:  0
```

The response substitution was browser-local and did not mutate Supabase. It proves both halves independently: the stale open session really does refetch and replace the shared state, but the rendered tariff does not consume the replacement.

The cause is direct in `packages/logic/src/composables/useTariffs.ts:173-178`: `useTariffs()` immediately returns `buildTariffs(data.value.categories)`, a plain snapshot. `packages/ui-alquilatucarro/app/pages/tarifas.vue:175` stores it once as `const tariffs = useTariffs()`, and all later computed values read that frozen object. `MonthlyRatesTeaser.vue:50` uses the same pattern. Clearing `useState` therefore does not fail closed for an already-mounted tariff surface, and repopulating it does not update the visible prices. A tab already sitting on `/tarifas` can still show the old price beyond one hour even though the network/state refresh succeeded.

### 2. The exact vehicle-results insertion shift is confirmed resolved

I reran the prior Bogotá deep-results route at the same `1461x900`, DPR 2 viewport with the layout-shift observer installed before navigation and kept it running through the loaded-card handoff plus four seconds.

Comparison:

| Measurement | `8e22fec` before | `7247b02` preview after |
|---|---:|---:|
| SSR results shell | absent | present |
| SSR reserved card slots | 0 | 12 |
| loaded persistent slots/cards | 0 / 12 cards without slots | 12 / 12 |
| late async card/carousel shift | `0.0262499174` | `0`, `0`, `0` |
| handoff-scoped `listInsertionShift` | failing sequence | `0`, `0`, `0` |
| prior total no-input shift | `0.3618529318` | `0`, `0`, `0` in the three exact handoff runs |

The three current handoffs occurred at approximately `3.2564s`, `3.0712s`, and `3.4029s`; every run found 12 loaded cards and no no-input entry in the handoff window. An additional Orca cold-load trace reported overall CLS `0.1176549276` from an earlier `2.1045s` critical/header/grid geometry transition, with no later card insertion entry. Thus overall preview movement is not universally zero, but the exact late vehicle-results sequence I had reproduced is gone. Direct SSR markup inspection independently counted one `vehicle-results-shell` and 12 `vehicle-result-placeholder` entries.

### Final verdict

**STILL-REFUTED.** The vehicle-results blocker is confirmed resolved, and hydration-safe age-triggered refetch is real. The remaining blocker is user-visible propagation: make `useTariffs()` (and its mounted consumers) reactive to `rentacar-data` replacement/null so expiry actually removes the old tariff and a successful refresh renders the new one.

---

## Re-review round 4 at `c42e978` — CONFIRMED-RESOLVED

Reviewed commit: `c42e9787573340af96f788301d1e4e7a82f6ce2b`  
Fresh preview: `https://alquilatucarrocom-git-diego-alex-cc3935-info-42181061s-projects.vercel.app` (Vercel deployment `EccASFfeCUfDAczQwkPLqoUmbKK7`)  
Exact route: `/tarifas?rr4=c42e978-final-proof`  
Review only; no application code or backend data was changed.

I reran the round-3 forced-expiry reproduction against the deployed head. The fresh page hydrated with `$ 3.806.000 /mes`, `catalogFetchedAt = 1784420554107`, and an empty browser console. I then advanced only `Date.now()` to `1784424154108` (exactly `catalogFetchedAt + 3,600,001 ms`), substituted the one real `/api/rentacar-data` response inside that browser tab so category C's active `1k_kms` values were `8,765,000`, and dispatched `focus`. The 68,857-byte substituted body retained its real server timestamp (`1784420622506`); Supabase was not mutated.

Observed mounted-page sequence:

```text
before expiry trigger: state C active 1k = 4,149,000 / 3,806,000 seasons
                       visible old price = true
after focus:           state = null
next DOM mutation:     "Tarifas temporalmente no disponibles" = true
fresh response:        state C active 1k = 8,765,000
next DOM mutation:     visible $8.765.000/mes = true
                       visible $3.806.000/mes = false
elapsed in-page:       54 ms (performance 68527 -> 68581)
```

The final accessibility snapshot independently exposed `Compacto Mecánico ... $ 292.167 /día $ 8.765.000 /mes`. The URL never changed and the Performance API retained exactly one navigation entry of type `navigate`, so the update occurred in the same mounted document without a reload. Browser console messages were `0` before and after the reproduction; the CDP capture also recorded `0` console events and `0` runtime exceptions, hence no Vue hydration mismatch warnings.

Code inspection agrees with the deployed result: `useTariffs()` now returns a computed projection whose getter reads `rentacar-data`, while `/tarifas` and `MonthlyRatesTeaser` retain that computed ref and dereference it only inside reactive/template consumers. Clearing and replacing the catalog therefore invalidates the already-mounted price projection.

### Final verdict

**CONFIRMED-RESOLVED.** The sole remaining blocker is closed: an expired mounted `/tarifas` session fails closed, performs the catalog refresh, and renders the divergent fresh price without reload or hydration warnings.
