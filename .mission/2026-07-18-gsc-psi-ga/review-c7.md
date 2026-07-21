# PR #358 adversarial review — REFUTED

Reviewed: 2026-07-18 17:02 COT  
PR: #358, `fix: wire Alquilame GA4 and GSC legacy redirects`  
Head reviewed: `834b2b32d518e9d1528549792b5de7dd48d3c4df`  
Base reviewed: `d697bc521eb4b58784be14156164a0b4246b368f`

## Verdict

**REFUTED.** The redirect work satisfies the requested exact-path, one-hop, destination, route-isolation, and method-safety contracts. The GA4 wiring is brand-scoped and does not double-initialize Alquilame, and PR #354's typed funnel events will stop no-oping once its shared bridge is present.

The blocker is the page-view path created by combining #358 with #354. PR #358 configures Alquilame with the default `send_page_view: true`, while #354 deliberately installs its sanitized manual page-view plugin only in Alquilatucarro. A direct load of Alquilame `/reservado/<reserveCode>` therefore bypasses #354's redaction and sends the literal reservation code and the complete query string to GA4. This reproduced against the deployed PR #358 preview, not just by source inspection.

## Blocking finding — Alquilame sends reservation identifiers and query values to GA4

- `packages/ui-alquilame/nuxt.config.ts:473-478` adds one loader and calls `gtag('config','G-ZPZC1TP9T0')` without `send_page_view:false`.
- Google's GA4 documentation states that `send_page_view` defaults to `true`; the config command therefore sends a page view on load. See [Measure pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views) and the [GA4 config reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).
- At #354 head `4a656547`, `packages/ui-alquilatucarro/app/plugins/page-view.client.ts` is the only caller of the sanitized `createSpaPageViewTracker`. There is no corresponding plugin in `ui-alquilame`; #354's own `analyticsIntegration.test.ts` explicitly asserts that absence.
- Headless Chrome loaded the PR #358 Alquilame preview with a synthetic code and query value. The resulting GA request decoded to:

```text
tid = G-ZPZC1TP9T0
en  = page_view
dl  = https://rentacar-web-alquilame-...vercel.app/reservado/C7-FAKE-PII-123?email=fake-c7@example.invalid
```

The marker was synthetic and no real customer data was used, but the network request proves that any real reservation code—and any query value on that route—is forwarded to the production Alquilame property. This is the same privacy boundary that #354's confirmed fix redacts to `/reservado/[code]` and strips query/hash for Alquilatucarro.

The plain config contains no name, email, phone, or other customer PII; `G-ZPZC1TP9T0` is a public measurement ID. The leak is runtime page-location collection caused by the config's default behavior.

### Required fix

1. Configure Alquilame with `send_page_view:false` and install/reuse #354's sanitized manual SPA page-view plugin for Alquilame, preferably from one shared brand-safe integration rather than another copy.
2. Confirm in the Alquilame GA4 stream that Enhanced Measurement history page views will not create a second unsanitized path. Google's current documentation notes that history-based Enhanced Measurement can emit independently of `send_page_view:false`.
3. Add a browser/network regression for a direct load and an SPA navigation through `/reservado/RES-PII-123?email=fake@example.invalid`: exactly one page view per resolved route, `/reservado/[code]` only, and no marker in `page_location` or `page_referrer`.

## GA4 wiring checks

### Brand isolation — PASS

Rendered home HTML on the three PR previews contained:

```text
Alquilame:       G-ZPZC1TP9T0 loader/config present; G-1G7MWTDK71 absent
Alquilatucarro:  G-1G7MWTDK71 present; G-ZPZC1TP9T0 absent
Alquicarros:     neither GA4 measurement ID present
```

Repo-wide ref scans agree: `G-ZPZC1TP9T0` exists only in Alquilame's config and its test. Alquilame extends the shared logic layer, not another brand's UI config, so the head scripts do not leak across builds.

### Loader/config duplication — PASS

Alquilame renders one distinct `gtag.js?id=G-ZPZC1TP9T0` loader and one `gtag('config', 'G-ZPZC1TP9T0')` call. PR #354 does not add an Alquilame loader or config call; it only reads `window.gtag` from shared logic. There is no source-level double initialization in the #354 + #358 merge tree.

### PR #354 typed funnel/contact/chat events — PASS with page-view blocker above

PR #354's shared `getGtag()` guard returns a callable bridge whenever `window.gtag` exists. PR #358 defines that function synchronously in the head before Nuxt hydration, and the successful GA collection request proves that the queue and remote loader are operational. The search, item-list, selection, checkout, submit/outcome, contact, and chat calls therefore stop no-oping on Alquilame.

A synthetic #354 + #358 merge tree ran the focused analytics suites successfully:

```text
analytics.test.ts + analyticsIntegration.test.ts
Test Files  2 passed (2)
Tests       13 passed (13)
```

The typed funnel params omit names, email, phone, identity numbers, and reservation codes. The failure is specifically the automatic page-view URL outside that typed event contract. Also, Alquilame still lacks #354's explicit SPA page-view integration, so route measurement is dependent on the GA stream's Enhanced Measurement setting instead of the sanitized code contract.

## Redirect checks

Preview tested: `https://alquilatucarrocom-git-diego-alex-3ecc6b-info-42181061s-projects.vercel.app`

### Exact legacy sets, final status, and hop count — PASS

| Set | First response | Followed result | Evidence |
|---|---:|---:|---|
| `/ibagué`, `/ibagu%C3%A9`, lowercase encoded form | `301 Location: /ibague` | `200`, 1 redirect | raw and encoded variants reproduced |
| 19 exact `/{city}/buscar-vehiculos` paths | 19/19 `301 Location: /{city}` | 19/19 `200`, exactly 1 redirect | allowlist is exactly the mission's 19 cities |
| old Manizales blog slug | `301 Location: /blog` | `200`, 1 redirect | no chain |

`/bogota/buscar-vehiculos?utm_source=gsc` preserved the query as `Location: /bogota?utm_source=gsc`. `/ciudad-inexistente/buscar-vehiculos` remained 404, proving the rule is allowlisted rather than a catch-all.

The live and preview `/api/blog/posts` endpoints each returned the same 16 posts and no slug/title containing `manizales`; the old production slug is 404 and `/blog` is 200. Under the recorded `/blog` fallback decision, the destination requirement passes. `/manizales` and the broader Eje Cafetero article are also live 200s, so `/blog` is a policy choice rather than evidence of a current Manizales-specific replacement.

### Real dated search routes are not shadowed — PASS

The redirect regex is end-anchored to the bare path. Two valid future-dated routes on the preview returned 200 with zero redirects:

```text
/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/.../hora-devolucion/12:00pm
/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/.../hora-devolucion/12:00pm/categoria/ECMR
```

The exact bare route alone returned 301. A non-allowlisted city remained 404. No real results route was intercepted.

### Method safety — PASS

For representative Ibagué, city-search, and blog legacy paths:

```text
GET, HEAD                       -> 301 with the expected Location
POST, PUT, PATCH, DELETE, OPTIONS -> 404 with no Location
```

Unsafe methods do not pass through a 301 that a client could rewrite to GET. One out-of-scope URL variant, `/{city}/buscar-vehiculos/` with a trailing slash, remains 404; the requested exact slashless paths pass.

## Overlap with PRs #352–#357

Pairwise `git merge-tree --write-tree --messages` against the current fetched heads succeeded for every pair:

```text
#352 ae3200e  exact overlap: none                         clean
#353 621a332  overlap: ui-alquilame/nuxt.config.ts       clean auto-merge
#354 4a65654  exact overlap: none                         clean; semantic GA conflict described above
#355 9ad4dbd  overlap: ui-alquilame/nuxt.config.ts       clean auto-merge
#356 8e22fec  exact overlap: none                         clean
#357 51d0f1e  exact overlap: none                         clean
```

#353 and #355 modify later, disjoint config hunks; neither overwrites the new head script block. The important conflict is behavioral, not textual: #354's reservation-URL sanitizer is scoped to Alquilatucarro, while #358 turns on Alquilame's automatic unsanitized page views.

## Test-quality note

PR #358's new GA test only reads `nuxt.config.ts` and checks two strings. It does not execute gtag, inspect a GA request, test a reservation-result URL, count page views, or combine with #354. It stays green while the deployed preview forwards the synthetic reservation marker. Redirect helper tests are substantially better, and the deployed HTTP probes independently confirmed their claims.

At review time, Quality Checks, reservation E2E, and all three Vercel previews were green. Green checks do not cover the blocker. No application code was changed or pushed by this review.

---

## Re-review at `8cdfc73` — CONFIRMED-RESOLVED

Reviewed: 2026-07-18 17:56 COT  
Head reviewed: `8cdfc73d4505b6599f0ac5ba120c4f6301175291`

### Final verdict

**CONFIRMED-RESOLVED.** The Alquilame page-view blocker is closed. The current preview disables the config-generated page view and emits exactly one sanitized manual `page_view` for each finalized initial/SPA route. Reservation codes, reservation-route query values, and hashes are absent from both `page_location` and reservation-derived `page_referrer` payloads.

### Independent preview evidence

Preview: `https://rentacar-web-alquilame-git-diego-388c25-info-42181061s-projects.vercel.app`

- A direct document load of `/reservado/RR-C7-PII-INITIAL-789?email=rr-c7-initial@example.invalid#RR-C7-PII-INITIAL-789` left one config command with `{ send_page_view: false }` and exactly one `page_view`. The actual GA collection request returned 204 with `tid=G-ZPZC1TP9T0`, `dl=https://…/reservado/[code]`, and empty `dr`; it contained neither the reservation marker nor the query value.
- In the same hydrated Nuxt session, real router navigation continued from that reservation route to `/bogota` and then to `/reservado/RR-C7-PII-SPA-456?email=rr-c7-spa@example.invalid#RR-C7-PII-SPA-456`. Three finalized routes produced exactly three GA `page_view` requests: the middle view carried `dr=https://…/reservado/[code]`, and the SPA reservation view sent `dl=https://…/reservado/[code]` with `dr=https://…/bogota`. No synthetic code/email marker appeared in any page-view request.
- A subsequent full document navigation from the SPA reservation URL to a second reservation URL made the browser expose the prior unsanitized reservation URL as `document.referrer`. The new document still emitted exactly one page view with both `page_location` and `page_referrer` equal to `https://…/reservado/[code]`. This independently covers the initial-referrer path as well as the carried SPA-referrer path.
- The request count matched the resolved-route count throughout; no automatic or hook-duplicate `page_view` was observed.

### Behavioral regression quality

`packages/ui-alquilame/tests/ga4-wiring.test.ts` is no longer a source-string check. It imports and installs the real page-view plugin, invokes the registered `app:mounted` and `page:finish` hooks, spies on `gtag`/`dataLayer`, asserts the exact first and second payload objects and two-call count, and asserts that the reservation code, referrer code, and email marker are absent. The focused test passed 1/1 locally; the exact-head Quality Checks log also ran `ga4-wiring.test.ts` and finished the Alquilame suite at 52/52 files and 503/503 tests.

No application code was changed or pushed by this re-review.
