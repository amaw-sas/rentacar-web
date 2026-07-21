# A4 — Google Analytics / measurement audit

Audit date: 2026-07-18 (11:50–12:00 COT)  
Scope: `packages/ui-alquilatucarro`, `packages/ui-alquilame`, `packages/ui-alquicarros`, shared `packages/logic`, and the live homepages of the three brands.  
Constraint observed: no application code changed and no commit created.

## Executive verdict

Only **alquilatucarro.com** has GA4 in the repository and in the currently shipped HTML. It uses `G-1G7MWTDK71`. **alquilame.co** has no Google measurement tag, and **alquicarros.com** currently ships a legacy Google Ads destination (`AW-11058498825`) rather than GA4. The repository has no GA4 integration at all for the latter two brands.

Alquilatucarro sends an initial `page_view`, but a live Nuxt navigation from the homepage to the search-results URL sent no second `page_view`. There is no explicit global route tracker. Three reservation-outcome page components contain a narrow manual workaround, but the rest of the SPA journey is unmeasured.

The reservation funnel has no search, quote/results, vehicle-selection, checkout, or direct reservation-confirmation events. Confirmation currently depends on a manual result-page `page_view` plus a GA4-admin create-event rule mentioned only in a source comment. WhatsApp and telephone clicks are tracked only on Alquilatucarro. A normal first chat open is not tracked.

No duplicate GA4 loader/config was found. The opposite problem exists: coverage is missing on two brands. All Google tracking and first-party attribution storage run without a consent UI or Consent Mode defaults.

The custom attribution system does implement tested 30-day, last-touch persistence and forwards it to normal and chat reservations. However, it omits campaign/creative fields and modern Google click IDs that the separate WhatsApp beacon already captures.

## Severity legend

- **Critical:** primary business outcome cannot be measured reliably.
- **High:** large, systematic measurement loss or privacy-control gap; launch blocker.
- **Medium:** material loss of diagnostic/attribution detail or inconsistent coverage.
- **Low:** maintainability/documentation risk with limited immediate data loss.
- **Pass:** explicitly checked and no defect found.

## Brand / ID matrix

| Brand | Repository integration | Repository ID | Live final URL and shipped tag | Assessment |
|---|---|---:|---|---|
| Alquilatucarro | Manual `gtag.js` loader + inline `dataLayer`/`config` in `nuxt.config.ts` | `G-1G7MWTDK71` | `https://alquilatucarro.com/`; one GA4 loader/config with the same ID | Source/live consistency passes. Property ownership, stream URL, and data arrival still require A5 GA4-console access. |
| Alquilame | None in `nuxt.config.ts`, `app.config.ts`, plugins, dependencies, or runtime config | None | `https://alquilame.co/`; no GA4/GTM/Ads tag | No traffic measurement. |
| Alquicarros | None in `nuxt.config.ts`, `app.config.ts`, plugins, dependencies, or runtime config | None | Redirects to `https://www.alquicarros.com/`; one legacy Google Ads tag `AW-11058498825`, no GA4/GTM | Ads conversion code is not a GA4 web data stream. No GA4 traffic/funnel measurement. |

The requested “IDs distinct?” test cannot pass because only one brand has a GA4 ID. There is no accidental cross-brand reuse in the repository; there are simply two missing IDs. “Correct?” is partially verifiable: `G-1G7MWTDK71` is internally consistent and is the ID shipped by Alquilatucarro, but the GA4 Admin/Data Stream mapping cannot be proven from public HTML. A5 must confirm the stream domain and property ownership once blocker B1 is cleared.

## Event coverage matrix

| Journey signal | Alquilatucarro | Alquilame | Alquicarros | Evidence / limitation |
|---|---|---|---|---|
| Initial page load | Yes | No | No GA4 (Ads tag only live) | Plain `gtag('config', ...)` auto-sends the first `page_view`. |
| General SPA route change | **No reliable event** | No tag | No tag | No router hook/plugin. Live home → search-results Nuxt navigation produced only the initial `page_view`. |
| `/reservado`, `/pendiente`, `/sindisponibilidad` SPA result | Manual `page_view` | Code exists but no tag | Code exists but no tag | `useResultPageView` is mounted only by these three page types and no-ops without `window.gtag`. |
| Search submitted | Missing | Missing | Missing | `useSearch.ts:114-198` validates and calls `search()` without analytics. |
| Quote/results returned | Missing | Missing | Missing | `useStoreSearchData.ts:66-166` populates availability without analytics. |
| Vehicle/category selected | Missing | Missing | Missing | No GA event call exists in cards/selection/wizard. |
| Checkout/form begun | Missing | Missing | Missing | No event when the reservation form/data step opens. |
| Reservation request/confirmation | Indirect and brittle | No effective GA event | No effective GA event | Source comment says GA4 creates `reserva_confirmada` from a `/reservado/` `page_view`; no direct event exists in version-controlled code. |
| WhatsApp click | `clic_boton_whatsapp`; plus separate backend beacon | Missing | Missing | Delegated selector in Alquilatucarro `nuxt.config.ts:440-448`; no parameters such as placement/city. |
| `tel:` click | `clic_boton_llamada` | Missing | Missing | Delegated selector in Alquilatucarro `nuxt.config.ts:450-457`; no placement/city. |
| Normal first chat open | Missing | Missing | Missing | `ChatWidget.vue:247-256` opens chat but emits no general `chat_open`. |
| Special chat states | Yes when GA exists | Calls no-op | Calls no-op | `chat_reply_while_closed`, `chat_unread_badge_shown`, `chat_reopened_from_badge`, and contact-teaser events exist in shared logic. |

## Findings and exact fixes

### A4-01 — Two brands have no GA4 measurement stream in code or live HTML

**Severity: High — pre-launch blocker for Alquilame and Alquicarros.**

Evidence:

- Only `packages/ui-alquilatucarro/nuxt.config.ts:427-471` declares Google/measurement scripts.
- All three `app/app.config.ts` files have no analytics/measurement key.
- Module arrays at Alquilatucarro `nuxt.config.ts:475`, Alquilame `:473`, and Alquicarros `:475` contain no gtag/GTM module.
- Live curl found no tag on Alquilame and only `AW-11058498825` on the legacy Alquicarros page.

Exact proposed fix:

1. In GA4 Admin, create or confirm one web data stream per brand, with three distinct Measurement IDs and the exact production host for each stream. These may live in one AMAW property if reporting requirements favor roll-up, but the web streams/IDs should remain distinct.
2. Add `NUXT_PUBLIC_GA4_MEASUREMENT_ID` to each brand deployment and expose it via `runtimeConfig.public`; do not copy Alquilatucarro’s ID into the other brands and do not repeat a literal in three script entries.
3. Add one shared client analytics plugin/composable in `packages/logic`, with a thin per-brand trigger if Nuxt layer plugin inheritance is not available (the attribution plugin uses this established pattern).
4. Load the tag only for a syntactically valid configured ID and only under the selected consent strategy (A4-05). Fail visibly in preview/CI when a production build has no ID.
5. Before launch, A5 must verify each ID against GA4 Admin → Data streams and confirm Realtime/DebugView traffic tagged with a `brand` event parameter or user property.

Acceptance: each homepage has exactly one `gtag/js?id=G-...` loader, the three IDs are distinct, and GA4 DebugView shows the matching hostname/stream for each.

### A4-02 — SPA pageviews are incomplete; live navigation is undercounted

**Severity: High.**

Evidence:

- The base config is only `gtag('config','G-1G7MWTDK71')` (`ui-alquilatucarro/nuxt.config.ts:438`). There is no Nuxt `page:finish`, `router.afterEach`, or global route tracking plugin.
- `packages/logic/src/composables/useResultPageView.ts:27-42` manually sends `page_view` only on client-side mounts of the three result-page types.
- All nine outcome pages call that helper, but Alquilame/Alquicarros lack `window.gtag`, so those calls are no-ops.
- Live Playwright evidence below shows one initial `page_view` and zero additional pageviews after a real internal Nuxt navigation to the Bogota search-results route.
- The application also calls `history.pushState`/`replaceState` for category slideovers (`CategorySelectionSection.vue:445-472`). Blind GA4 history tracking could count UI overlays as pages, so the behavior needs to be deliberate rather than property-dependent.

Exact proposed fix:

1. Choose explicit/manual SPA measurement for all brands: configure gtag with `{ send_page_view: false }`.
2. In the shared analytics plugin, send exactly one initial `page_view` after the resolved first page and one on each Nuxt `page:finish`, with `page_location`, final `document.title`, and the previous virtual URL as `page_referrer`. Deduplicate by finalized `route.fullPath`.
3. In GA4 Admin for every stream, disable Enhanced Measurement’s “Page changes based on browser history events”; otherwise direct `pushState` slideovers can become phantom pageviews and manual events can double-count.
4. Remove the per-page `useResultPageView` calls/helper after the global tracker is active, or make it delegate to the same deduplicating service. Do not leave both paths firing.
5. Test home → city → results → category slideover → result page: one view for each real Nuxt page, zero extra view for opening/closing a slideover, and no duplicate on reload.

This follows Google’s current guidance to disable automatic views before manual SPA views and to avoid mixing manual views with history-based Enhanced Measurement: [Measure pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Measure single-page applications](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).

### A4-03 — The reservation funnel is not instrumented and confirmation is not a direct code event

**Severity: Critical.**

Evidence:

- A repository search finds no GA event for search, quote/results, category selection, checkout, form submission, or a direct reservation outcome.
- `useSearch.ts:114-198` calls `search()` after validation without measurement.
- `useStoreSearchData.ts:66-166` knows the result/error/result-count outcome but sends no event.
- `useStoreReservationForm.ts:291-339` is the authoritative request/outcome branch and navigates to confirmed/pending/unavailable pages without emitting a business event.
- `useResultPageView.ts:9-15` explicitly documents that `reserva_confirmada` is a GA4 UI-created event derived from `page_view` + URL. That rule is not version controlled and could not be verified because A5 is blocked.

Exact proposed fix:

Create one typed event API and instrument authoritative state transitions, not arbitrary button DOM clicks:

1. At the validated `doSearch()` boundary, emit `rental_search` with non-PII fields: `brand`, pickup/return branch or city, `rental_days`, and `rental_type` (`daily`/`monthly`).
2. When the latest search generation settles, emit `view_item_list` for a successful quote set with `result_count` and GA4 `items` for available vehicle categories; emit `rental_search_error` with a normalized non-sensitive reason for terminal failures.
3. Emit `select_item` when the customer selects a vehicle category and `begin_checkout` when the reservation form/data step first becomes active.
4. In `submitForm`, emit `reservation_submit` once when the accepted POST begins, then an explicit, mutually exclusive `reservation_confirmed`, `reservation_pending`, `reservation_unavailable`, or `reservation_error` after the API result is known.
5. For confirmed reservations, deduplicate on the stable reserve code (for example a consent-aware `sessionStorage` sent-key, or preferably a server-side Measurement Protocol event coordinated with the client ID). Never send name, email, phone, identification, or free text to GA4. Use a unique transaction ID only if the business deliberately models a confirmed no-prepayment reservation as an ecommerce conversion; otherwise keep the explicit reservation event rather than calling it `purchase`.
6. Mark `reservation_confirmed` (and, if business-defined, `reservation_pending`) as GA4 key events. Retire the URL-based created-event rule after parallel validation so one reservation cannot create two conversions.

Use recommended GA4 ecommerce names where their semantics match (`view_item_list`, `select_item`, `begin_checkout`) and custom rental events for non-commerce outcomes: [GA4 recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events).

Acceptance: one test reservation produces a deterministic sequence from search through exactly one terminal outcome in DebugView; retries and reloads do not create duplicate confirmations.

### A4-04 — Chat/contact events are partial, brand-inconsistent, and lack context

**Severity: Medium.**

Evidence:

- Alquilatucarro delegates WhatsApp and `tel:` clicks to `clic_boton_whatsapp` and `clic_boton_llamada` without parameters (`nuxt.config.ts:440-457`). The other brand configs do not install those listeners.
- `ChatWidget.vue:247-256` records teaser engagement and a special unread-badge reopen, but a normal first chat open has no event.
- Shared logic has `contact_teaser_shown`, `contact_teaser_dismissed`, `contact_teaser_engaged`, `chat_reply_while_closed`, `chat_unread_badge_shown`, and `chat_reopened_from_badge`; on the two untagged brands they safely no-op.
- Alquilatucarro additionally posts every WhatsApp click to `wa-click-track.js`. Inspection of that script shows it does not emit a second GA4 event; it reads GA client ID and sends a separate backend beacon. Therefore this is parallel attribution, not a current GA4 duplicate.

Exact proposed fix:

1. Replace brand-specific inline listeners with one shared delegated `contact_click` event on all brands. Parameters: `brand`, `method` (`whatsapp`/`telephone`), `placement` (header/footer/FAB/category/result/error/chat), `page_type`, and city when known. Preserve the old Spanish events only temporarily via GA4 created-event mapping if historical dashboards need continuity.
2. Emit `chat_open` for every real open with `source` (`fab`, `/chat`, teaser, unread badge), `chat_message_sent` on the first customer message, and `chat_quote_received` when a quote table is rendered. Keep notification/teaser events as diagnostics rather than primary conversions.
3. Decide a strict lead definition. For example, mark the first customer chat message or a valid contact click as `generate_lead`, but do not mark teaser impressions or automated assistant replies as leads.
4. Route all events through the consent-aware typed analytics helper, and unit-test event name/parameter contracts for all three brands.

Acceptance: one click creates one contact event with a method and placement; a normal initial chat open is visible; automated teaser/reply events do not inflate leads.

### A4-05 — No consent UI or Google Consent Mode; cookies/storage start immediately

**Severity: High.**

Evidence:

- No executable source/config match exists for `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`, `gtag('consent', ...)`, Cookiebot/OneTrust/CMP, or a cookie-consent/banner component.
- All three privacy pages only tell users they may reject cookies in browser settings (Alquilatucarro `politica-privacidad.vue:77-88`; the other two at `:91-103`). That is notice text, not a consent control.
- The Alquilatucarro tag is emitted in SSR `<head>` and immediately calls `config`.
- A fresh live headless-browser load created `_ga` and `_ga_1G7MWTDK71` before any interaction.
- Every brand’s `attribution.client.ts` immediately writes a marketing attribution object to `localStorage` when a touch exists. The live WhatsApp beacon also uses `sessionStorage` and a 30-day local visitor ID without consulting consent.

Exact proposed fix:

1. Have the product/privacy owner define the regional lawful-basis/consent policy. Implement a CMP/banner with separate analytics and advertising choices plus a persistent “privacy settings” control.
2. Before any `config` or event call, initialize Consent Mode v2 defaults for `analytics_storage`, `ad_storage`, `ad_user_data`, and `ad_personalization` according to that policy; then send `gtag('consent', 'update', ...)` when the user chooses. In basic mode, do not load gtag until granted; in advanced mode, load only after the denied defaults have been queued.
3. Gate `rentacar_attribution`, `wa_attribution`, and `wa_visitor_id` persistence under the approved storage category. Clear nonessential stored identifiers when consent is revoked.
4. Update the privacy/cookie copy to name GA4, the WhatsApp attribution service, purposes, storage duration, recipients, and how to withdraw/change the choice. Legal review is required; this audit does not make a jurisdictional legal conclusion.
5. Verify with Tag Assistant’s Consent tab and an automated fresh-context test: before consent there are no forbidden cookies/storage writes under the chosen implementation; after grant tracking begins; after revoke it stops/clears as designed.

Google requires consent defaults to be set before measurement commands and documents all four Consent Mode v2 fields here: [Set up consent mode on websites](https://developers.google.com/tag-platform/security/guides/consent).

### A4-06 — The 30-day attribution core works, but the captured contract is incomplete

**Severity: Medium.**

What passes:

- `attributionStorage.ts:12-57` persists `rentacar_attribution` with `ts` and expires/removes it when older than `30 * 24 * 60 * 60 * 1000`.
- `buildAttributionTouch.ts:12-66` captures `utm_source`, `utm_medium`, `gclid`, `gad_source`, `fbclid`, `ttclid`, `msclkid`, and an external referrer; same-host/www↔apex navigation does not overwrite the touch.
- `useStoreReservationForm.ts:78-95` applies last-touch semantics and restores storage on a direct/internal load.
- `useRecordReservationForm.ts:85-88` attaches the stored object to both normal reservation payload branches; `useChatConversation.ts:505-509` attaches it to chat requests.
- Each brand has the same client trigger plugin. Storage/capture/payload tests passed: 72/72 targeted tests in six files.

Gaps:

- Reservation/chat attribution omits `utm_campaign`, `utm_term`, `utm_content`, `gbraid`, `wbraid`, `dclid`/`twclid`, and `landing_url`. Campaign, keyword/creative, and privacy-preserving Google click attribution can therefore be lost.
- The separately shipped Alquilatucarro WhatsApp beacon captures `utm_campaign`, `utm_term`, `utm_content`, `gbraid`, `wbraid`, `twclid`, and `landing_url`, proving two attribution contracts have drifted. That richer data applies only to WhatsApp clicks, not normal reservations or the other brands.
- All three plugin comments say “~90 days” (`attribution.client.ts:2`), while executable code and tests enforce 30 days. The behavior is 30 days; the comment is stale.
- The model stores last touch only. It cannot answer both “first acquisition source” and “latest source before reservation,” and localStorage is origin-scoped, so attribution does not cross brands.

Exact proposed fix:

1. Agree a versioned attribution contract with the receiving dashboard/backend and add at least `utm_campaign`, `utm_term`, `utm_content`, `gbraid`, `wbraid`, `twclid` (and `dclid` if used), `landing_url`, `captured_at`, and `brand` to the shared type/extractor/payload.
2. Reuse that same field list/normalizer for the WhatsApp beacon instead of maintaining a second hand-written list. Roll out receiver support before frontend fields.
3. Export a named `ATTRIBUTION_TTL_MS` (or store `expires_at`) and make code, plugin comments, privacy copy, and boundary tests all state exactly 30 days. Add tests at exactly 30 days, just over 30 days, future/corrupt timestamps, and the new click IDs.
4. Decide and document the attribution model. If acquisition reporting matters, store `{ first_touch, last_touch }`; never refresh either TTL on an ordinary internal/direct page. Keep the current full-replacement semantics for each atomic touch.
5. If cross-brand journeys are intentional, design consent-aware cross-domain linking/server attribution; do not attempt to read another origin’s localStorage. Otherwise document brand-local attribution as deliberate.
6. Apply the consent/storage fix in A4-05 before expanding persistence.

Acceptance: a fixture URL carrying every supported parameter survives 29 days, expires just after day 30, reaches both normal and chat reservation payloads, and produces the same normalized attribution fields in the WhatsApp beacon.

### A4-07 — Duplicate GA4 installation check

**Severity: Pass (no current duplicate found).**

- Repository: Alquilatucarro has one loader and one `config`; there is no Nuxt gtag/GTM module or analytics package. Alquilame and Alquicarros have neither manual nor module integration.
- Live: Alquilatucarro contains one GA4 loader/config; Alquilame contains none; Alquicarros contains one Ads loader/config. No `GTM-*` container was found on any homepage.
- The WhatsApp backend beacon is a separate `sendBeacon` system and does not call `gtag('event', ...)`; it is not a second GA4 installation.

Guardrail for fixes: centralize installation, add an automated rendered-HTML assertion of exactly one configured loader, and ensure A4-02 removes the narrow result-page sender when global manual pageviews are enabled.

## Reproducible evidence

### 1. Repository integration and module scan

Command:

```bash
rg -n --glob '!**/__tests__/**' --glob '!**/*.test.*' \
  '\bgtag\b|dataLayer|googletagmanager' packages
rg -n '^\s*modules:' packages/ui-*/nuxt.config.ts
```

Relevant output:

```text
packages/ui-alquilatucarro/nuxt.config.ts:433: src: 'https://www.googletagmanager.com/gtag/js?id=G-1G7MWTDK71'
packages/ui-alquilatucarro/nuxt.config.ts:438: ...gtag('config','G-1G7MWTDK71');
packages/ui-alquilatucarro/nuxt.config.ts:448: ...gtag('event','clic_boton_whatsapp');
packages/ui-alquilatucarro/nuxt.config.ts:457: ...gtag('event','clic_boton_llamada');
packages/logic/src/composables/useResultPageView.ts:37: gtag('event', 'page_view', {
packages/logic/src/composables/useChatConversation.ts:124: w.gtag('event', name);
packages/logic/src/composables/useContactTeaser.ts:44: w.gtag('event', name, params ?? {});

packages/ui-alquilatucarro/nuxt.config.ts:475: modules: ['@pinia/nuxt', '@nuxtjs/seo', ...]
packages/ui-alquilame/nuxt.config.ts:473: modules: ['@nuxtjs/seo', '@nuxt/ui', ...]
packages/ui-alquicarros/nuxt.config.ts:475: modules: ['@nuxtjs/seo', '@nuxt/ui', ...]
```

No gtag/GTM/analytics hit exists in Alquilame or Alquicarros `nuxt.config.ts`/`app.config.ts`.

### 2. Live homepage curl

Command (run with one temporary HTML file per URL, `curl -sS -L --max-time 30`):

```bash
for url in https://alquilatucarro.com/ https://alquilame.co/ https://alquicarros.com/; do
  curl -sS -L --max-time 30 -o page.html \
    -w 'http=%{http_code} final=%{url_effective} bytes=%{size_download}\n' "$url"
  rg -o 'googletagmanager\.com/gtag/js\?id=[A-Z0-9-]+|GTM-[A-Z0-9]+|G-[A-Z0-9]{8,14}|AW-[0-9]+' page.html | sort -u
done
```

Output captured by the audit:

```text
https://alquilatucarro.com/
http=200 final=https://alquilatucarro.com/ bytes=223754
googletagmanager.com/gtag/js?id=G-1G7MWTDK71
G-1G7MWTDK71

https://alquilame.co/
http=200 final=https://alquilame.co/ bytes=112353
(no GA4, GTM, or Ads ID)

https://alquicarros.com/
http=200 final=https://www.alquicarros.com/ bytes=108961
googletagmanager.com/gtag/js?id=AW-11058498825
AW-11058498825
```

Counted live install details:

```text
alquilatucarro.com: gtag-loaders=1, GTM-containers=0, GA4=G-1G7MWTDK71, config-calls=1
alquilame.co:       gtag-loaders=0, GTM-containers=0, GA4=(none), config-calls=0
alquicarros.com:    gtag-loaders=1, GTM-containers=0, GA4=(none), Ads=AW-11058498825, config-calls=1
```

### 3. Live SPA navigation and pre-consent cookie behavior

A fresh Playwright context listened for `analytics.google.com/g/collect`, loaded Alquilatucarro, then clicked the visible Bogota internal link. Relevant output:

```text
before https://alquilatucarro.com/ [
  { en: 'page_view', dl: 'https://alquilatucarro.com/', dr: null,
    dt: 'Alquiler de Carros en Colombia desde $32/día | Alquilatucarro' }
]

after https://alquilatucarro.com/bogota/buscar-vehiculos/... [
  { en: 'page_view', dl: 'https://alquilatucarro.com/', dr: null,
    dt: 'Alquiler de Carros en Colombia desde $32/día | Alquilatucarro' }
]

cookies-before-route [ '_ga_1G7MWTDK71', '_ga' ]
```

The URL changed through Nuxt, but the captured pageview array did not gain an entry. The `_ga` cookies existed before a user choice or route click.

### 4. Attribution implementation and tests

Key source evidence:

```text
attributionStorage.ts:12 export const ATTRIBUTION_STORAGE_KEY = 'rentacar_attribution';
attributionStorage.ts:13 const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
attributionStorage.ts:53 if (now - parsed.ts > TTL_MS) {
attributionStorage.ts:54   store.removeItem(ATTRIBUTION_STORAGE_KEY);
useRecordReservationForm.ts:88 partialData.attribution = attribution.value ?? readStoredAttribution() ?? {};
useChatConversation.ts:509 attribution: readStoredAttribution() ?? {},
```

Test command:

```bash
pnpm exec vitest --run \
  packages/logic/src/utils/__tests__/attributionStorage.test.ts \
  packages/logic/src/utils/__tests__/buildAttributionTouch.test.ts \
  packages/logic/src/composables/__tests__/useRecordReservationForm.attribution.test.ts \
  packages/logic/src/composables/__tests__/useChatConversation.attribution.test.ts \
  packages/logic/src/composables/__tests__/useChatConversation.unread.test.ts \
  packages/logic/src/composables/__tests__/useContactTeaser.test.ts
```

Output:

```text
Test Files  6 passed (6)
Tests      72 passed (72)
Duration   387ms
```

### 5. Shipped WhatsApp beacon contract

Command:

```bash
curl -sS --max-time 30 \
  https://backend-production-95f5f.up.railway.app/wa-click-track.js |
  rg -n 'PARAM_KEYS|utm_campaign|gbraid|wbraid|landing_url|gtag\('
```

Relevant output:

```text
24: var PARAM_KEYS = [
25:   'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
26:   'gclid', 'fbclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid', 'twclid'
75: var snap = { landing_url: window.location.pathname, referrer: document.referrer || null };
116: landing_url: snap ? snap.landing_url : window.location.pathname,
120: utm_campaign: val('utm_campaign'),
125: gbraid: val('gbraid'),
126: wbraid: val('wbraid'),
150: window.gtag('get', GA4_ID, 'client_id', function (id) {
```

The only gtag call is `get` for `client_id`; the click itself is posted with `navigator.sendBeacon` to `/api/wa-click`, so it is not a duplicate GA4 event.

## A5 console checks still required

These items cannot be proven from repository/public HTML and belong in the blocked A5 console pass:

1. `G-1G7MWTDK71` is owned by the intended AMAW property and its web stream URL is `alquilatucarro.com`.
2. Enhanced Measurement history-page settings and whether they differ by stream.
3. Actual event arrival/cardinality for `clic_boton_whatsapp`, `clic_boton_llamada`, chat/teaser events, and manual result `page_view`.
4. The source-commented `reserva_confirmada` create-event rule exists, is marked as a key event, and is not duplicated by another rule/imported Ads conversion.
5. Internal/developer traffic filters, cross-domain settings, data retention, Google Signals/Ads links, unwanted referrals, and PII leakage in event parameters/URLs.

Until A5 is complete, the only defensible ID statement is source/live consistency—not administrative correctness or data arrival.
