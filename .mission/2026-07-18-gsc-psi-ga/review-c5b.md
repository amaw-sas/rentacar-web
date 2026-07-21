# Fresh adversarial review C5b — PR #359

**Verdict: REFUTED**

Reviewed commit: `2a617c6c39da4f1b6029a1013a836361fff46cd9`  
Base: `d697bc521eb4b58784be14156164a0b4246b368f` (`main`)  
Latest Alquilatucarro preview: `https://alquilatucarrocom-git-diego-alex-605f2e-info-42181061s-projects.vercel.app`  
Review only; no application code was changed or pushed.

PR #359 substantially reduces static-route payloads, preserves the Supabase query, cuts the repeated public critical block below its budget, and completes a real preview reservation. It is not safe to merge against the binding acceptance gate: the required `/bogota` initial first-party JS is **larger**, not smaller, and the route-level catalog split leaves the existing `/tiktok` campaign page with an empty city list.

## Blocking findings

### 1. Required `/bogota` shipped JS grows

I re-measured after the PR moved to `2a617c6` and all three Vercel deployments became Ready. Method: fetch each HTML document, enumerate the unique first-party `/_nuxt/*.js` URLs in initial `<script src>` and module-preload references, then sum `curl --compressed` transfer bytes. Third parties and interaction-triggered chunks are excluded.

| Route | Production | PR preview | Delta | Initial JS assets |
|---|---:|---:|---:|---:|
| `/` | 320.914 KiB | 319.229 KiB | **-1.686 KiB (-0.53%)** | 32 → 33 |
| `/bogota` | 365.378 KiB | 366.666 KiB | **+1.288 KiB (+0.35%)** | 35 → 36 |

The largest shared initial chunk also moves in the wrong direction: production `Dpf2_Em2.js` is 195.465 KiB, while preview `DHdbgTz0.js` is 195.605 KiB, **+0.141 KiB**. Home now has a small reduction, but the binding gate explicitly requires both `/` and `/bogota` to be measurably smaller. A selected module/chunk reduction cannot substitute for the total route payload increasing.

The PR body still contains only production baseline numbers and says preview evidence will be appended. The implementation also does not convert the carousel requested by PERF-2: `CategoryCard.vue` still renders eager `<Carrusel>`, and `Carrusel.vue` is absent from the PR diff. Its live interaction works, but the scoped component split is incomplete.

### 2. The route-level loader regresses `/tiktok` to an empty linktree

Production and preview return HTTP 200, but their actual content differs:

| `/tiktok` | `#__NUXT_DATA__` | Rendered `a.tt-city` anchors |
|---|---:|---:|
| Production | 60,049 B | 16 |
| PR preview | 735 B | **0** |

The page's purpose and comments say it is a city linktree. `packages/ui-alquilatucarro/app/pages/tiktok.vue:104-113` still derives `tiktokCities` from `useData().cities`, and line 106 still derives branches from `useStoreAdminData()`. The new page-scoped `rentacar-data` middleware is not attached to `/tiktok`, so both sources are empty.

The new source-contract test misses this: it asserts middleware on known booking directories and asserts only `/blog` and `/gana` are static. It never exercises `/tiktok` or verifies its rendered links. This violates the binding gate's “no functional regression” condition even though the named blog/legal/gana payload split works.

### 3. The committed screenshot “pairs” are not auditable before/after evidence

The four new files under `docs/perf-evidence/c5b/` contain no visible URL/timestamp provenance, and each supposed preview image is byte-for-byte identical to its production partner:

```text
home-preview.jpg      = home-production.jpg      sha256 930fd0c1fc1836ca5b42abb74f422f69a79be0cec098adb79bc52aee7a1a3d86
bogota-preview.jpg    = bogota-production.jpg    sha256 e4e2b3d73c0db80d9b3c89e9358a5d792da9562be0af4917cc7969d15aad7596
```

Identical pixels can be a successful outcome, but duplicate bytes without origin/timing evidence do not prove that two different deployments were captured or that a transient FOUC did not occur. My independent settled-load pairs show parity and I did not observe a FOUC during live navigation, so this is an evidence/provenance gap rather than a reproduced final-state visual defect. The retained independent captures are:

- Home: [production](evidence-c5b/prod-home.jpg) / [preview](evidence-c5b/preview-home.jpg)
- Bogotá: [production](evidence-c5b/prod-city.jpg) / [preview](evidence-c5b/preview-city.jpg)
- Blog: [production](evidence-c5b/prod-blog.jpg) / [preview](evidence-c5b/preview-blog.jpg)

## Acceptance matrix

### PERF-1 — route-level catalog and unchanged dashboard query

**Named-route behavior: pass, with the `/tiktok` regression above.**

- Across all three current previews, `/blog`, `/politica-privacidad`, and `/gana` return HTTP 200 without the catalog state marker. Alquilatucarro `/blog` drops from 70,123 B to 10,469 B in `#__NUXT_DATA__` (**-85.1%**).
- Home and `/bogota` contain the catalog state on all three brands. `/reservas` returns 200 with catalog state on Alquilame and Alquicarros; Alquilatucarro has no `/reservas` route by design. The Alquilatucarro city search returned 11 available categories.
- Direct search, quote, and confirmation are verified below.
- `git diff --exit-code base..head` over `packages/logic/server/api/rentacar-data.get.ts` and `packages/logic/server/utils/rentacarDataFetch.ts` is clean. Their SHA-1 values remain `1cf636d...` and `074fd33...`; all six `.from(...).select(...)` calls, including the dashboard-sensitive vehicle-category select, are byte-unchanged.

### PERF-2 — smaller entry JS

**Fail.** Home is 1.686 KiB smaller, but `/bogota` is 1.288 KiB larger and gains an initial asset. The required two-route reduction is not achieved. Chat and drawer internals are interaction-loaded; the requested carousel conversion is absent.

### PERF-7 — critical CSS and FOUC

**Implementation/budget pass; submitted evidence insufficient.**

- Live `style[data-hid="critical-cls"]` falls from 22,078 B in production to 7,423 B in preview (**-14,655 B / -66.4%**) and is below the `<10 KB` target.
- Dashboard-only rules are moved to `layouts/seo.vue`; the public block keeps/minifies the covered first-paint subset.
- Independent 1461×889 settled screenshots show no material home/city/blog regression, and live navigation showed no obvious FOUC. The committed byte-identical pairs do not independently establish the before/after or temporal FOUC claim.

### Reservation flow

**Pass on the latest deployment.** At mobile viewport, Bogotá Aeropuerto for 2026-08-18 → 2026-08-25 returned 11 available categories. Clicking the Fiat Mobi carousel item opened the quote summary, the data form submitted, and the preview reached:

```text
/reservado/AV33Y646D3A
¡Tu reserva está confirmada!
```

This is a real latest-preview search → quote → submit → confirmation click-through, not merely a route reachability probe. No console errors were emitted.

### Visual regression

**Pass for the three required settled views.** Independent same-viewport production/preview captures of home, `/bogota`, and `/blog` are materially equivalent. The city `COLOMBIA` gradient and chat teaser can differ by animation phase; neither changes layout. The separate `/tiktok` empty-list defect is a functional/visual regression outside those three spot checks.

### Async component hydration and interactions

**Runtime behavior pass; carousel conversion scope incomplete.** On the latest preview:

- Home loaded with an empty console; the contact FAB opened, “Chat 24 horas” loaded the async conversation, and the textbox/close control rendered.
- Mobile `/bogota` opened the async full-screen pickup drawer with all location buttons.
- The search-results carousel rendered; clicking “Reservar Fiat Mobi 1.0” opened the quote-summary slideover.
- Home, city, blog, drawer, chat, carousel, and reservation checks emitted no hydration-mismatch warnings or other console messages.

### Conflicts with PRs #352–#358

Pairwise `git merge-tree --write-tree` was run against the current heads at review time:

| PR | Head | Result against #359 |
|---|---|---|
| #352 | `ae3200e` | clean |
| #353 | `621a332` | clean (despite `nuxt.config.ts` overlap) |
| #354 | `4a65654` | **conflicts in 7 chat files**: shared `useChatConversation.ts`, plus each brand's `ChatConversation.vue` and `ChatWidget.vue` |
| #355 | `76657a4` | **conflicts in all three `layouts/default.vue` files** |
| #356 | `8e22fec` | **conflict in Alquilatucarro `layouts/default.vue`**; `ChatWidget.vue` and `nuxt.config.ts` auto-merge at these heads |
| #357 | `c7f3809` | clean |
| #358 | `8cdfc73` | clean |

The PR body's overlap section is incomplete: it omits the current textual conflicts with PR #354 and describes overlap, not actual pairwise merge results.

## Confirmed-safe portions

- Blog/legal/gana catalog payload removal works across all three brands.
- The exact Supabase query shape is unchanged.
- Home, city search, Alquilame/Alquicarros `/reservas`, quote, and reservation confirmation remain operational.
- Public critical CSS is 7,423 B and dashboard rules are no longer repeated on public pages.
- Required home/city/blog settled views have no material regression.
- Chat, drawer, and carousel interactions work without console/hydration errors.
- Latest-head GitHub CI is green; run `29663191249` is pinned to `2a617c6`.

## Required before acceptance

1. Make total initial first-party JS smaller on **both** `/` and `/bogota`, re-measure the same enumerated asset set, and put the actual before/after KiB table in the PR body. Complete or explicitly redesign the scoped carousel split.
2. Restore `/tiktok`'s 16 city links without re-globalizing the catalog, and add a rendered/runtime regression that checks the campaign page rather than only source strings.
3. Replace the ambiguous byte-identical screenshots with auditable production/preview captures that identify origin and capture timing; include a first-paint/reload sequence sufficient to support the no-FOUC claim.
4. Rebase/coordinate the real conflicts with #354, #355, and #356 and rerun the runtime interaction/visual checks after resolution.

Until the two functional/performance blockers are fixed, the binding “no functional regression + smaller shipped JS” gate is not met.

---

## Round-2 re-review — CONFIRMED-RESOLVED

**Verdict: CONFIRMED-RESOLVED**

Reviewed PR head: `fc8c6015ce75199a79b38e046b962b99108f3cce`  
Application commit on the preview: `dee50ddcc8ab98de90b13c49ef90b43a79c52432`  
Re-reviewed: 2026-07-18 18:58 COT  
Review only; no application code was changed or pushed.

All four items under **Required before acceptance** are independently resolved.

### 1. Same enumerated initial-JS set: pass

I fetched each current initial HTML document, enumerated the unique double-quoted same-origin `/_nuxt/*.js` references, then opened every route in a fresh Chromium session and summed `PerformanceResourceTiming.encodedBodySize` only for that exact enumerated set. Every enumerated asset matched, returned 200, and had a nonzero encoded size; no interaction chunks or third parties were counted.

| Route | Production | PR preview | Delta |
|---|---:|---:|---:|
| `/` | 340,330 B / 32 assets = 332.354 KiB | 281,660 B / 26 assets = 275.059 KiB | **-58,670 B / -57.295 KiB (-17.24%)** |
| `/bogota` | 385,538 B / 35 assets = 376.502 KiB | 362,832 B / 34 assets = 354.328 KiB | **-22,706 B / -22.174 KiB (-5.89%)** |

The live totals reproduce the PR table exactly, byte for byte. The PR body also explicitly documents the accepted redesign: the carousel is already outside both initial sets, so the round-2 reduction comes from replacing the eager Nuxt UI header/navigation/slideover graph with semantic desktop navigation and an interaction-created mobile dialog.

Minor documentation note, not a size-gate issue: the live build metadata references are `/_nuxt/builds/meta/*.json`, return 200, and are outside the enumerated JavaScript set. The 32/35/26/34 JS sets themselves are unambiguous and complete.

### 2. `/tiktok` rendered regression: pass

- Direct preview document: HTTP 200, **16** SSR `class="tt-city"` anchors, and a 60,017-byte Nuxt payload.
- Fresh hydrated Chromium: **16** anchors, **16** unique hrefs, and all 16 became dated `/buscar-vehiculos/` links with branch-aware pickup/return slugs.
- The 16 cities are Armenia, Barranquilla, Bogotá, Bucaramanga, Cali, Cartagena, Cúcuta, Ibagué, Manizales, Medellín, Montería, Neiva, Pereira, Santa Marta, Valledupar, and Villavicencio.
- Browser page errors: none. Hydration/mismatch/error console filter: empty.
- Source audit confirms `/tiktok` declares only page middleware `['rentacar-data']`; the former global `packages/logic/plugins/rentacar-data.ts` remains deleted. The committed Playwright test asserts the same SSR and hydrated runtime behavior rather than source strings.

### 3. Auditable no-FOUC capture sequence: pass

All eight committed files are 1440×900 and have distinct SHA-256 values that exactly match `docs/perf-evidence/c5b/README.md`. Each image visibly embeds the origin, route, capture phase, stylesheet mode, UTC timestamp, and FCP. The two preview routes each provide cold critical-only first paint → reload critical-only first paint → settled reload, while the production settled captures identify their independent origin and timing.

Visual inspection shows the cold/reload first-paint content is styled by the inline critical CSS: header geometry, blue hero, typography, search geometry, and the next-section boundary do not appear as raw unstyled document flow. `/bogota` reload FCP occurs before the form/car content paints, but the content present at that FCP is styled; this is late content, not a flash of unstyled content. Normal hydrated home and city runs emitted no mismatch/runtime errors.

The submitted preview-settled JPGs omit the desktop logo even though both first-paint frames contain it. I checked that anomaly against the live preview: a fresh 1440×900 settled capture shows the flag/logo, and computed live boxes are 36×24 and 138×40 with visible opacity/display. I therefore treat the JPG omission as a capture artifact, not a deployed visual regression; the required provenance and temporal critical-CSS evidence remain auditable.

### 4. Sibling coordination and post-resolution interactions: pass

Current-head Git audit:

- `origin/main` at `d697bc5`, PR #354 at `4a65654`, and PR #355 at `09fa9d0` are ancestors of `fc8c601`.
- PR #356 advanced during this re-review from integrated `7247b02` to `c42e978`. It is therefore not literally an ancestor of `fc8c601`, but a fresh pairwise `git merge-tree --write-tree --messages` against the **current** #356 head exits 0 with no conflicts (`8ec8dcd23e5ee1576eea351201fc903ce1419d62`), auto-merging only `MonthlyRatesTeaser.vue` and `tarifas.vue`.
- The current #356 merged tree preserves its reactive `ComputedRef` `useTariffs()` contract and every `.value.gamas` callsite, while retaining C5b route middleware and the versioned teaser image. No conflict markers are present.
- Current-head merge trees with #354 and #355 also exit 0; because they are ancestors, both produce the existing #359 tree. GitHub reports PR #359 `MERGEABLE` / `CLEAN` against current `main`.

Fresh final-preview interaction checks after the recorded conflict resolutions:

- Mobile header: dialog absent initially; open creates it, focuses Close, sets body overflow to `hidden`; Escape removes it and restores overflow.
- Mobile Bogotá pickup: the full-screen drawer opens with search input plus the complete branch list.
- Desktop contact/chat: menu exposes Chat/WhatsApp/Call; Chat opens the async assistance dialog with enabled message input and background inerting.
- Bogotá results: 12 rendered card slots, 12 carousels, and 42 visible model activation controls; activating `Reservar Fiat Mobi 1.0` opens the populated quote-summary dialog.
- `/tiktok`, home/chat, mobile city/header/drawer, and search/carousel/quote runs all had zero browser page errors and an empty hydration/mismatch/error console filter.

GitHub Quality Checks and E2E Reservation Payload are green on `fc8c601`. The binding gate is now met: both required routes ship less initial JS, `/tiktok` is restored without re-globalizing catalog state, the no-FOUC evidence is auditable, and the previously conflicting sibling work is integrated or current-head conflict-free with clean affected interactions.
