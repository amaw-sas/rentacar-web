# A3 — Performance / PageSpeed audit

Date: 2026-07-18 (COT)  
Scope: production checks for the seven requested URLs plus a read-only audit of `packages/ui-alquilatucarro` and the shared `packages/logic` layer. No application code was changed and no commit was created.

## Executive summary

- **PSI metrics are blocked, not missing by omission.** All 14 keyless PageSpeed Insights v5 requests returned HTTP 429. The JSON says `RESOURCE_EXHAUSTED`, `quota_limit_value: "0"`, and `defaultPerDayPerProject`; therefore no honest performance score, LCP, CLS, field INP, lab TBT, or PSI opportunity savings can be reported. Lighthouse was not installed locally, so the instructed fallback was not available.
- The largest source-confirmed problem is a global reservation-catalog payload. Even `/blog` and blog-post pages hydrate `categories`, `branches`, monthly prices, 42 vehicle-image URLs, cities, testimonials, and FAQs. The common inline Nuxt payload is about 60 KB before page-specific data.
- Production initially requests about **0.49–0.51 MB of compressed script** on the measured Alquilatucarro pages. The home requests 328,616 B first-party plus 177,182 B third-party; the global entry alone is about 200 KB compressed / 624 KB expanded.
- Blog images bypass `@nuxt/image`. A 400×225 card can download the original 370,972 B image, and the featured blog image downloads 168,534 B.
- `/tarifas` is the outlier in the render strategy: repeated requests were CDN `MISS`, while home, city, blog, and blog-post routes were ISR `HIT`.

## 1. PageSpeed Insights run — blocked by API quota

The API was called mobile first for all seven URLs, then desktop, with no key:

```sh
curl --get 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed' \
  --data-urlencode 'url=<URL>' \
  --data 'strategy=mobile|desktop' \
  --data 'category=performance'
```

Representative JSON response (all 14 responses had the same quota facts):

```json
{
  "error": {
    "code": 429,
    "status": "RESOURCE_EXHAUSTED",
    "message": "Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service 'pagespeedonline.googleapis.com' for consumer 'project_number:583797351490'.",
    "details": [{
      "reason": "RATE_LIMIT_EXCEEDED",
      "metadata": {
        "quota_limit_value": "0",
        "quota_unit": "1/d/{project}",
        "quota_limit": "defaultPerDayPerProject"
      }
    }]
  }
}
```

| URL | Mobile | Desktop | Performance / LCP / CLS / INP / TBT | PSI opportunities |
|---|---:|---:|---|---|
| `https://alquilatucarro.com/` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquilatucarro.com/bogota` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquilatucarro.com/tarifas` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquilatucarro.com/blog` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquilatucarro.com/blog/alquilar-carro-bogota-guia` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquilame.co/` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |
| `https://alquicarros.com/` | HTTP 429 | HTTP 429 | Not produced by API | Not produced by API |

Fallback check:

```text
$ pnpm exec lighthouse --version
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "lighthouse" not found
```

Google Chrome exists locally, but the Lighthouse CLI/package does not. Installing a new audit stack was outside the explicit “ONLY if trivially available” fallback.

**Severity: Blocker (measurement only).**  
**Exact resolution:** rerun the same 14 calls with a Google Cloud project/API key whose PageSpeed Online API daily quota is greater than zero, or rerun after Google restores keyless quota. Store the returned JSON and extract `categories.performance.score`, `audits.largest-contentful-paint`, `audits.cumulative-layout-shift`, `audits.interactive`/`total-blocking-time`, CrUX `INTERACTION_TO_NEXT_PAINT` when present, and opportunity `details.overallSavingsMs/Bytes`. Do not treat the live transfer audit below as PSI scores.

## 2. Live delivery snapshot (diagnostic, not PSI)

These are single `curl -L --compressed` production observations. `transferred` is downloaded HTML bytes, `expanded` is the decoded HTML saved by curl, and TTFB is not a throttled Lighthouse result.

| URL | Final/status | Transferred | Expanded HTML | `__NUXT_DATA__` | Inline CSS | Module preloads | TTFB |
|---|---|---:|---:|---:|---:|---:|---:|
| Alquilatucarro home | 200 | 46,756 B | 223,754 B | 60,043 B | 33,864 B | 32 | 0.330 s |
| `/bogota` | 200 | 49,389 B | 237,758 B | 62,971 B | 34,062 B | 35 | 0.271 s |
| `/tarifas` | 200 | 40,929 B | 180,746 B | 60,050 B | 33,864 B | 29 | 0.386 s |
| `/blog` | 200 | 40,606 B | 186,276 B | 70,123 B | 40,639 B | 24 | 0.305 s |
| selected blog post | 200 | 66,851 B | 353,245 B | 124,585 B | 42,888 B | 42 | 0.331 s |
| Alquilame home | 200 | 19,138 B | 112,353 B | n/a (older deploy) | 0 B | 0 | 0.354 s |
| Alquicarros home | apex 308 → `www`, then 200 | 25,452 B | 108,961 B | n/a (older deploy) | 0 B | 0 | 0.681 s |

The Alquicarros redirect direction agrees with the mission’s already-known deployment mismatch; it is not reclassified as a performance fix here.

## 3. Findings and exact fixes

### PERF-1 — Global catalog payload is shipped on every route

**Severity: High**

**Evidence**

- `packages/logic/plugins/rentacar-data.ts:21-49` is a global async Nuxt plugin and always fetches/hydrates `/api/rentacar-data`.
- The live payload is 60,043 B on home, 60,050 B on `/tarifas`, 70,123 B on `/blog`, and 124,585 B on the selected post.
- Decoding the home’s devalue array shows `data -> rentacar-data -> categories, branches, extras, vehicleCategories, cities, franchiseTestimonials, faqs`. `/blog` and the blog post each contain the same **42 Vercel Blob vehicle-image URL occurrences**, although neither route renders the booking catalog.
- The common payload explains about 60 KB of every route before blog-specific data. The post adds roughly 10 KB for the all-posts list and about 54 KB for its detail/MDC tree, while also duplicating rendered article HTML.

**Exact proposed fix**

1. Replace the global monolithic plugin with route-scoped data:
   - global/layout: a compact `{ city: id/name }` list or static brand city navigation only;
   - home/city/search/reservation/tariffs: categories, branches, prices, extras, vehicle models;
   - home/city only: FAQs/testimonials as currently needed.
2. Make footer city links plain `/${city.id}` links on all routes. Remove `branches`, `today()`, and deep-link date enrichment from the always-on layout; enrich a booking link only after the user enters the booking flow.
3. On blog detail, have one server endpoint return the post plus three related cards and prev/next metadata. Remove the second “all posts” hydration payload.
4. Render the MDC article body through a `.server.vue`/server component and keep reading-progress/share behavior in a small client component, so the full parsed MDC tree is not serialized for hydration.
5. Add payload budgets to production smoke tests: blog index `< 20 KB` and blog detail `< 50 KB` for `#__NUXT_DATA__` as an initial target, with no catalog keys on either route.

### PERF-2 — Initial first-party JavaScript is large and broadly module-preloaded

**Severity: High**

**Evidence**

- Home: 34 unique initial script resources (32 first-party plus gtag and the Railway beacon), **505,798 B compressed total**: 328,616 B first-party and 177,182 B third-party.
- Blog post: 44 unique initial script resources, **490,551 B compressed total**: 313,369 B first-party and 177,182 B third-party.
- The production global entry `/_nuxt/Dpf2_Em2.js` is about **200,156 B compressed / 623,980 B expanded**. It contains `libphonenumber`/country-calling-code code even on non-form pages.
- `packages/ui-alquilatucarro/app/layouts/default.vue:177-303` imports `@internationalized/date`, Pinia store data, and the broad `@rentacar-main/logic/utils` barrel for footer deep links on every route.
- `packages/logic/src/utils/index.ts:10-136` re-exports date, validation, `valibot`, and phone-number graphs from one barrel. `nuxt.config.ts:582-585` also forces detailed Vue hydration-mismatch diagnostics in production.

**Exact proposed fix**

1. Generate a Vercel/production bundle analyzer artifact (`nuxi analyze` or Rollup visualizer in the preview build) and record compressed bytes per module before implementation; local install/build is a known mission blocker.
2. Remove booking-link computation from the global layout as described in PERF-1. This removes the always-on imports of `@internationalized/date`, booking stores, and much of the broad utility graph from blog/static routes.
3. Replace runtime imports from `@rentacar-main/logic/utils` with the already-supported narrow exports (for example `@rentacar-main/logic/utils/buildCityReservationURL`); keep barrel imports type-only where possible. Add a test that the blog entry does not contain `libphonenumber`.
4. Set `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` only for development/preview diagnostics, not production.
5. Re-measure the same live asset set and set a first-party compressed JS budget for blog/static routes (initial target: `< 200 KB`, excluding third parties).

### PERF-3 — Third-party analytics loads globally before user intent

**Severity: Medium**

**Evidence**

- `nuxt.config.ts:427-470` injects gtag on every page plus `https://backend-production-95f5f.up.railway.app/wa-click-track.js`.
- Live compressed transfers were **174,204 B for gtag** and **2,978 B for the Railway script** (177,182 B total). `async`/`defer` prevents parser blocking but not network contention, parse/execute work, or main-thread impact.
- `app.head.link` is empty, so an intentionally eager version also lacks an explicit preconnect.

**Exact proposed fix**

1. Load GA through a consent/idle trigger (prefer Nuxt Scripts or a small client plugin using `requestIdleCallback` with a timeout). Keep the synchronous `dataLayer` queue so early SPA/page/click events are buffered and replayed.
2. Replace the always-loaded remote click script with a tiny first-party delegated click listener. Load/send the Railway attribution code only on the first WhatsApp click, using `sendBeacon`/`fetch(..., { keepalive: true })` and the existing fallback visitor ID.
3. If product/analytics requires eager loading, add `preconnect` for `www.googletagmanager.com` and the Railway host, and move execution off the critical main thread (for example Partytown). Validate event counts against GA before rollout.

### PERF-4 — “Lazy” chat still downloads and initializes on every page

**Severity: Medium**

**Evidence**

- Both layouts render `<LazyChatWidget />` unconditionally (`app/layouts/default.vue:172-173`, `gana.vue:66-67`). Because the async component is present during SSR, its chunks are still module-preloaded.
- Three production preloads containing chat/widget markers total at least **11,646 B compressed**: `B3E-Rypo.js` 7,482 B (`rentacar-chat:`), `Bh1HaG-0.js` 3,910 B (`contact-fab-menu`), and `D-BoSlOb.js` 254 B (`api/chat/status`).
- `ChatWidget.vue:158-185` calls `useChatStatus`, `useChatConversation`, and `useContactTeaser` immediately. `useChatStatus.ts:28-34` performs a dashboard status request in `onMounted` on every page.

**Exact proposed fix**

Split the widget into a tiny always-visible contact FAB and an interaction-loaded chat engine. Cache status once per session and fetch it on idle or when the menu opens. Dynamically import `ChatConversation`, SSE parsing, markdown, persistence, and conversation state only when the user opens chat (preserving an already-created instance if a conversation is active). Verify that no `rentacar-chat:` chunk is module-preloaded on a cold blog/home request.

### PERF-5 — Blog images bypass responsive optimization

**Severity: High**

**Evidence**

- Blog templates use plain `<img :src="...">` at `app/pages/blog/index.vue:31-40,121-129` and `app/pages/blog/[...slug].vue:11-20,179-185,230-238`.
- Production downloads originals: featured `cartagena-calles.webp` is **168,534 B (1200×799)**; `guatape-piedra.webp` is **370,972 B (1200×1800)** despite a 400×225 card; the selected post hero is **79,584 B (1200×800)**.
- The brand public/app assets contain 21 WebP (3,472,984 B), 8 JPEG (737,548 B), one PNG, and other assets. Including inherited `packages/logic/public`, audited assets total **60 files / 12.58 MiB**.
- Positive control: the home family LCP candidate does use `NuxtImg`; production served 63,468 B at `w=640` and 146,202 B at `w=1280` with a browser WebP `Accept` header.

**Exact proposed fix**

1. Replace blog-card, related-card, author, and hero `<img>` tags with `NuxtPicture`/`NuxtImg`, accurate `sizes`, explicit dimensions/aspect ratios, and `format="avif,webp"` where the deployed optimizer supports it.
2. Generate purpose-sized derivatives at upload/sync time (card 400/800 widths, hero 640/1280) and store the canonical image metadata. Do not crop a 1200×1800 portrait in the browser for a 400×225 card.
3. Keep only the actual LCP image eager/high priority; retain lazy loading for below-fold cards. Verify selected resource width in a mobile network trace.

### PERF-6 — CSS background images bypass `@nuxt/image` and public assets are weakly versioned

**Severity: Medium**

**Evidence**

- `Images/HeroCar.vue:10-17` loads `/images/hero/car.webp` as CSS on desktop. Its live transfer is **265,868 B (1203×600)** and cannot use the configured responsive image pipeline.
- `MonthlyRatesTeaser.vue:9-13` similarly loads a 72,074 B background.
- Public assets return `Cache-Control: public, max-age=14400, must-revalidate`; only hashed `/_nuxt/**` receives the configured one-year immutable cache. The Vercel image endpoint itself returned `max-age=0, must-revalidate` to the browser in this check.

**Exact proposed fix**

Render the decorative car as a positioned `NuxtImg`/`picture` with a 480 px desktop size and low priority (or generate a substantially smaller 480/960 derivative). Use responsive `image-set()` only if a semantic image cannot be used. Move durable local assets through Vite imports/content-hashed filenames, then assign one-year immutable caching to those hashed paths; do not mark mutable unversioned `/img/...` names immutable.

### PERF-7 — A 22 KB manual critical stylesheet is repeated on every route

**Severity: Medium**

**Evidence**

- `nuxt.config.ts:31-425` contains a hand-maintained critical Tailwind subset; its source block is 22,219 B.
- Live `style[data-hid="critical-cls"]` is **22,078 B on every checked Alquilatucarro page**, including blog pages. It includes route-specific “SEO Dashboard Critical CSS” and many utilities unrelated to the public above-the-fold shell.
- Total inline CSS is 33,864 B on home and 42,888 B on the blog post. There are zero blocking `<link rel="stylesheet">` tags, so this is HTML/parse bloat rather than a render-blocking stylesheet finding.

**Exact proposed fix**

Use coverage from home, city, tariffs, blog, and blog-detail mobile/desktop traces to reduce the shared critical block to only the header/layout and above-fold primitives. Move dashboard/gana/blog-only rules into route/component CSS. Add an inline critical-CSS byte budget (initial target `< 10 KB`) and visual CLS/FOUC tests before preserving `vitalizer.disableStylesheets: 'entry'`.

### PERF-8 — `/tarifas` is not ISR-cached

**Severity: Medium**

**Evidence**

- `nuxt.config.ts:625-697` assigns `isr: 3600` to home, 19 city routes, `/blog`, and `/blog/**`, but not `/tarifas`.
- Two consecutive `/tarifas` checks were `x-vercel-cache: MISS`, `age: 0`, with TTFB 0.357 s and 0.314 s. In the same run, `/blog` and `/bogota` were `HIT`; the selected blog post was also `HIT`.
- The underlying `/api/rentacar-data` handler is already cached for 3,600 seconds (`packages/logic/server/api/rentacar-data.get.ts:62-75`), so uncached page rendering does not provide fresher price data.

**Exact proposed fix**

Add `'/tarifas': { isr: 3600 }` to `nitro.routeRules`, matching its data TTL. Add it to `tests/nitro-render-strategy.test.ts`, deploy to preview, then prove `MISS`/generation followed by `HIT` and verify tariff changes respect the documented one-hour freshness window.

### PERF-9 — Referral video is a large single rendition

**Severity: Low**

**Evidence**

- `public/gana/video/explicativo.mp4` is **7,845,454 B**, 64.8% of the brand package’s 11.55 MiB public/app asset set.
- `app/pages/gana/index.vue:45-48` correctly uses `preload="metadata"`, so the whole file is not part of the audited pages’ initial load; the cost occurs on playback.

**Exact proposed fix**

Encode at least mobile and desktop renditions (H.264 MP4 plus WebM where supported), provide a compressed poster, select by `<source>`/media, and use a content-hashed filename with long immutable caching. Keep `preload="metadata"`.

## 4. Opportunity categories requested by the mission

| Category | PSI verdict | Source/live verdict |
|---|---|---|
| Render-blocking | Blocked; no PSI savings returned | No blocking stylesheet links; scripts are async/defer/module. Repeated 22,078 B critical CSS remains an HTML/parse issue (PERF-7). |
| Images | Blocked | Confirmed full-size blog downloads and CSS backgrounds (PERF-5/6). |
| Unused JavaScript | Blocked | Not quantified as “unused,” but 313–329 KB compressed first-party script is initially requested and global booking/chat graphs appear on content routes (PERF-2/4). |
| Fonts | Blocked | No remote/self-hosted font files or `@font-face` found. The app uses `system-ui, -apple-system, sans-serif`; no font fix proposed. |
| Third-party | Blocked | Confirmed 177,182 B compressed global analytics/beacon transfer plus chat status work (PERF-3/4). |

## 5. Existing controls worth preserving

- SSR is enabled. Home/city/blog routes use one-hour ISR and `/_nuxt/**` is immutable for one year.
- `@nuxt/image` is configured with Vercel optimization, explicit screens/qualities, and a remote Blob allowlist; important non-blog components use dimensions, `sizes`, lazy loading, and priority intentionally.
- Entry stylesheets are deferred by Vitalizer, and production HTML showed no blocking stylesheet link.
- Fonts are already the lowest-risk system stack; adding a web font would be a regression unless justified and budgeted.

## Recommended implementation order

1. PERF-1 payload split and blog server rendering.
2. PERF-5 responsive blog images.
3. PERF-2 bundle graph reduction, then PERF-4 chat split.
4. PERF-3 third-party trigger policy coordinated with analytics requirements.
5. PERF-8 `/tarifas` ISR (small, isolated change).
6. PERF-6/7/9 asset and critical-CSS cleanup.
7. Rerun the complete mobile/desktop PSI matrix after quota is available; only then prioritize by measured LCP/TBT/CLS savings.
