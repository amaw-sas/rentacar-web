# PR #354 adversarial review — REFUTED

Reviewed: 2026-07-18 14:20 COT  
PR: #354, `feat(analytics): instrument GA4 reservation funnel`  
Head reviewed: `037d9ba82ea9176c5666d16be57d3dee04cf4a67`

## Verdict

**REFUTED.** The manual SPA page-view tracker forwards the literal reservation-result URL to GA4. On `/reservado/<reserveCode>`, the reserve code is sent as `page_location`; the tracker then retains that URL and sends it again as `page_referrer` on the next page view. This violates the explicit no-reservation-code analytics contract and must be redacted before this PR is safe.

The other requested contracts are mostly satisfied at helper/source level, but the added "integration" tests do not execute the Nuxt lifecycle or the real reservation transition and therefore missed the blocker.

## Blocking evidence — reservation code reaches GA4

- `packages/ui-alquilatucarro/app/plugins/page-view.client.ts:13-16` constructs every page view with `pageLocation: window.location.href`.
- `packages/logic/src/utils/analytics.ts:229-236` forwards that value unchanged as `page_location`, then stores the same value in `previousLocation` for the next `page_referrer`.
- `packages/ui-alquilatucarro/app/pages/reservado/[reserveCode]/index.vue` confirms that the result route embeds the reserve code in the pathname.

Direct reproduction against the PR helper, using a fake code:

```text
page_view.page_location = https://alquilatucarro.com/reservado/RES-PII-123
next page_view.page_referrer = https://alquilatucarro.com/reservado/RES-PII-123
```

The direct `reservation_confirmed` event does correctly omit the code; the leak is through the global `page_view` contract. Required fix: sanitize `page_location` and virtual `page_referrer` before emission (at minimum redact `/reservado/<code>` and avoid forwarding sensitive query/hash values), with a behavioral regression test.

## Requested adversarial checks

### 1. Initial `page_view` double-counting — code-level PASS

- `packages/ui-alquilatucarro/nuxt.config.ts:431-436` has one GA loader and configures `gtag('config', ..., {send_page_view:false})`, so config does not emit the automatic initial view.
- `app:mounted` and `page:finish` both call the manual tracker, but `createSpaPageViewTracker` deduplicates the same `route.fullPath`.
- The narrow outcome-page sender and all nine callers were removed.

Caveat: whether GA4 Enhanced Measurement's browser-history page changes are disabled is an Admin setting and could not be verified from this PR. If enabled, later SPA navigations can still double-count even though the initial config view is disabled.

### 2. Brands without GA4 — PASS with destination caveat

- `packages/logic/src/utils/analytics.ts:126-144` feature-detects `window.gtag`, returns `false` when absent, and catches invocation failures. There is no undefined call or console logging.
- All funnel/chat/contact calls route through this bridge; repo source installs no page-view plugin on Alquilame or Alquicarros.
- The bridge detects any `gtag`, not specifically a GA4 destination. If Alquicarros' currently live Ads-only `AW-11058498825` loader remains or is externally injected, these calls are not a no-op; they are queued to the generic gtag bus. The PR source itself does not install that loader.

### 3. PII / unique identifiers — FAIL (blocker)

No typed funnel parameter contains name, email, phone, identification, or reserve code, and errors are normalized to enums. Nevertheless, the unredacted `page_location`/`page_referrer` pair carries the reserve code as shown above. The type-level "non-PII params" test does not cover URLs.

### 4. `reservation_confirmed` exactly once — normal-path PASS, best-effort caveat

- `packages/logic/src/stores/useStoreReservationForm.ts:319-343` emits the event only after a successful API response maps to `/reservado/...`, before navigating.
- Result-page mounts no longer emit confirmation events, so refresh and back navigation do not rerun `reservation_confirmed`.
- `packages/logic/src/utils/analytics.ts:161-180` session-deduplicates confirmations by reserve code without including that code in GA params; the store also blocks double submit.
- Deduplication is explicitly best-effort when `sessionStorage` is unavailable. Also, the pre-existing GA4 Admin URL-derived `reserva_confirmada` rule must be retired to avoid two business conversions, even though only one is named `reservation_confirmed` in code.

### 5. Stored 30-day attribution compatibility — PASS

- The storage envelope remains `{ data, ts }`; `readStoredAttribution` still returns an old unversioned `data` object unchanged.
- All new v2 fields and `attribution_version` are optional, so old stored `{gclid, utm_source, ...}` data remains assignable and is forwarded.
- Boundary behavior is still 30 days (`>` expiry), with new validation for corrupt/future timestamps.

### 6. Tests assert real behavior — PARTIAL / insufficient

The helper tests genuinely execute no-op behavior, page-route dedupe, reserve-code session dedupe, attribution extraction, and TTL boundaries. However, `analyticsIntegration.test.ts` only reads source files and asserts substrings/file existence. It does not execute:

- Nuxt `app:mounted` + `page:finish` behavior;
- a real `/reservado/<code>` page view or URL redaction;
- the reservation store/API outcome followed by refresh/back navigation;
- runtime behavior of the three brand plugins.

Consequently all added analytics tests pass while the reservation-code leak remains.

## Verification

```text
pnpm install --ignore-scripts
  PASS (1226 packages; lifecycle scripts skipped)

targeted Vitest (6 analytics/attribution files)
  Test Files  6 passed (6)
  Tests       42 passed (42)

full: vitest run (hard timeout wrapper)
  Test Files  131 failed | 120 passed (251)
  Tests       795 passed (795)
  Errors      5
```

The full runner printed its summary but did not exit and was terminated. The 131 failed suites did not report assertion failures; they failed during setup because `.nuxt/tsconfig.app.json` / `tsconfig.server.json` were absent after `--ignore-scripts`, plus five `ERR_REQUIRE_ESM` dependency errors. An explicit `nuxt prepare` attempt failed because `@oxc-parser/binding-darwin-arm64` is unavailable. This is a local environment/setup blocker, not evidence that the product tests regressed. GitHub PR checks and all three Vercel preview deployments were green at review time.

No application code was changed or pushed by this review.

## FINAL re-review verdict — CONFIRMED-RESOLVED

Re-reviewed: 2026-07-18 15:21 COT  
Head re-reviewed: `4a6565471750075bcbe09c99ffe3b8591ed22ce6`

**CONFIRMED-RESOLVED.** The sole blocking finding from the original review—the reservation code leaking through `page_view.page_location` and then through the next virtual `page_referrer`—no longer reproduces.

### Evidence

- `packages/logic/src/utils/analytics.ts:217-240` now replaces the path segment after `/reservado/` with `[code]` and removes the result URL's query and hash. Lines 254 and 259-267 sanitize the initial browser referrer, sanitize every current location before emission, and retain only the sanitized location for the next virtual referrer.
- I reran the original two-navigation case against the exact PR head, strengthening it with the fake code in the pathname, query, hash, and route key. The captured events were:

```text
first page_location = https://alquilatucarro.com/reservado/[code]
next page_referrer = https://alquilatucarro.com/reservado/[code]
captured payload contains RES-PII-123 = false
```

- `packages/logic/src/utils/__tests__/analytics.test.ts:103-168` adds behavioral payload-spy coverage using the original `RES-PII-123` case. It exercises the real tracker/gtag bridge, checks both emitted locations, asserts the captured `dataLayer` contains no code, and separately covers a reservation URL supplied as the initial browser referrer.
- Focused execution from detached head `4a656547`: `analytics.test.ts` passed **8/8 tests**. The independent runtime reproduction above also passed. A root multi-project invocation in the ephemeral worktree stopped before test collection on unrelated UI dependency-link setup, so the logic package was run directly with its own Vitest config.
- `gh pr view 354` confirms the fix commit is the current head; Quality Checks, E2E Reservation Payload, and all three Vercel preview checks are green.

No previously reported C6 blocker remains. No application code was changed or pushed by this re-review.
