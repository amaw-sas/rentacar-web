# Implementation plan — phone field with visitor country

Created 2026-10-04 · Spec: `../../2026-10-04-telefono-pais-visitante-design.md` (owner-approved, two review passes) · Scenarios: `../scenarios/phone-country.scenarios.md` (SCEN-001..015).

Planning phases 1-6 (clarification, research, design) are covered by the approved spec; this file starts at the file map.

## File map

| File | Status | Single responsibility |
|---|---|---|
| `packages/logic/src/utils/validation/phoneValidator.ts` | new | Lazy-load `libphonenumber-js/max` once (retry after failure); sync `isValidPhone`, `isPhoneValidatorReady`. Only module that imports libphonenumber. |
| `packages/logic/src/utils/validation/userInformationForm.ts` | edit | Phone rule uses `isValidPhone`; message chosen by value (`+57` / other `+` / no `+` / not loaded). |
| `packages/logic/src/utils/validation/normalizePhoneNumber.ts` | edit | MX legacy `1` rule via `isValidPhone`; no static libphonenumber import. |
| `packages/logic/server/api/visitor-country.get.ts` | new | Return `{country, source}` from `cf-ipcountry` (behind Cloudflare) or `x-vercel-ip-country` (direct); `no-store`. |
| `packages/logic/src/utils/fetchVisitorCountry.ts` | new | Client: one memoized call to `/api/visitor-country`, 1,500 ms cap, ISO2 or `null`; server → `null`. |
| `packages/logic/src/utils/pickPhoneCountry.ts` | new | Pure: first candidate (store → visitor → `CO`) present in a known-ISO2 set. |
| `packages/logic/src/composables/usePhoneFieldLoader.ts` | new | Loader only: on mount (client), await component importer + `loadPhoneValidator` (must both fulfil) and `fetchVisitorCountry` (never rejects); expose `phoneComponent` (shallowRef), `phoneInitialCountry`, `onPhoneCountryChanged`. `usePhoneField.ts` is NOT edited (its source-regex tests stay untouched). |
| `packages/logic/src/stores/useStoreReservationForm.ts` | edit | `telefonoPais` ref, exported, cleared in `resetAfterReservation`. |
| `packages/logic/src/utils/index.ts`, `packages/logic/src/index.ts` | edit | Barrel exports for the new utils and composable. |
| `packages/ui-{alquilame,alquilatucarro,alquicarros}/app/components/ReservationForm.vue` | edit | Replace `defineAsyncComponent` with `usePhoneFieldLoader`; `v-if` field / `v-else` same-height placeholder; bind `default-country` and `@country-changed`. |
| `e2e/reservation-phone-revalidation.spec.ts` | edit | New no-`+` message; negative checks assert `#telefono-error` absent. |
| tests listed per step | edit/new | — |

## Steps

0. Test baseline before any code change | Size: S | Dependencies: none
1. Lazy full-metadata validator + flag-aware messages | Size: M | Dependencies: none
2. Visitor-country endpoint | Size: S | Dependencies: none
3. Client country fetch | Size: S | Dependencies: 2 (contract only)
4. Store remembers last flag shown | Size: S | Dependencies: none
5. Phone field loader composable | Size: M | Dependencies: 1, 3, 4
6. Wire the 3 brand forms + e2e text | Size: M | Dependencies: 5
7. Bundle weight before/after | Size: S | Dependencies: 6
8. Runtime QA in the browser, 3 brands | Size: M | Dependencies: 6
9. Quality agents + final gate | Size: S | Dependencies: 7, 8

## Prerequisites

- `pnpm install` already done in the worktree (`node_modules` present).
- Dev servers need `NUXT_SUPABASE_URL` / `NUXT_SUPABASE_ANON_KEY` inline from the Supabase MCP (project `ilhdholjrnbycyvejsub`); `.env*` is permission-blocked.
- Vitest from the repo root: `npx vitest run --root . <paths>`.
- Measured baseline (alquilatucarro production build, 2026-10-04, HEAD `b4c60c2`): entry chunk 203.2 kB gzip (includes `min` metadata 19.5 kB and the phone schema); `/bogota` static JS closure 346.9 kB gzip; `vue-tel-input` chunk 10.2 kB gzip (dynamic); `max` metadata 39.7 kB gzip. Copy of that client build: `/private/tmp/claude-501/-Users-diegomelo-orca-workspaces-rentacar-web-mejoras-en-el-formulario-web-para-telefonos-de-USA/9b10df81-c17b-4bbe-97a4-3b6c6abe0da4/scratchpad/baseline-nuxt/`.
- Evidence directory for this work: `/private/tmp/claude-501/-Users-diegomelo-orca-workspaces-rentacar-web-mejoras-en-el-formulario-web-para-telefonos-de-USA/9b10df81-c17b-4bbe-97a4-3b6c6abe0da4/scratchpad/evidence/`.

## Step 0 — Test baseline

- [ ] With only the docs commits on the branch (code identical to `main` `b4c60c2`), run the full unit suite from the root (`npx vitest run --root .`), kill stray dev servers first, and save the list of failing files to `evidence/vitest-baseline.txt`. Re-run once to separate flaky reds.
- [ ] Known: 13 e2e already fail on `main` (memory); e2e is compared only for the touched spec.

Acceptance: baseline file exists with pass/fail counts.

## Chunk 1: Logic layer

### Step 1 — Customer types a US number under the Colombian flag → the form blocks it and says why

- [ ] Scenarios first (unit, `userInformationForm.test.ts` + new `phoneValidator.test.ts`); the message function reads `issue.input` (raw value):
- `+57 1 817 5228026` → invalid, message «Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.» (SCEN-001)
- `+57 609 6669993` → invalid (SCEN-002)
- `+57 300 1234567` → valid (SCEN-003); `+1 817 522 8026` → valid (SCEN-004)
- `+1 300 123 4567` → invalid, «Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.» (SCEN-010)
- `300123` → invalid, «Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.» (SCEN-014)
- fresh module, validator not loaded → `+57 300 1234567` invalid with «Número de teléfono o WhatsApp no válido» (SCEN-015)
- `normalizePhoneNumber('+52 1 55 1234 5678')` → `+525512345678` after load; returns input unchanged when not loaded (SCEN-009)
- empty / under 5 chars → «Escribe tu número de WhatsApp o teléfono» (unchanged)
- `loadPhoneValidator` called twice → one import; a rejected import is retried on the next call.

- [ ] Code: `phoneValidator.ts`; edit `userInformationForm.ts`, `normalizePhoneNumber.ts`; `normalizePhoneNumber.test.ts` stops importing libphonenumber directly (its `isValidPhoneNumber` oracle comes from `libphonenumber-js/max`); add `await loadPhoneValidator()` in `beforeAll` of `userInformationForm.test.ts`, `normalizePhoneNumber.test.ts`, `extraDriverFields.test.ts`, `licenseType.test.ts`, `useStoreReservationForm.privacyConsent.test.ts`.

Acceptance: those 6 test files green; `grep -rn "from 'libphonenumber-js" packages --include=*.ts --include=*.vue` (excluding tests) shows no static import outside `phoneValidator.ts`, and that one is a dynamic `import()`.

### Step 2 — Request reaches `/api/visitor-country` → correct country, never cached

- [ ] Scenarios first (unit, `packages/logic/server/api/__tests__/visitor-country.test.ts`; stub `defineEventHandler`, `getRequestHeader`, `setResponseHeader` as globals like `server/plugins/__tests__/blog-cache-guard.test.ts:16`):
- `cf-ray` + `cf-ipcountry: US` → `{country:'US', source:'cloudflare'}` (SCEN-005)
- `cf-ray` + `x-vercel-ip-country: US`, no `cf-ipcountry` → `{country:null, source:'none'}` (SCEN-011)
- no `cf-ray` + `x-vercel-ip-country: es` → `{country:'ES', source:'vercel'}`
- `XX`, `T1`, `USA`, `""` → `{country:null, source:'none'}` (SCEN-006)
- every response sets `cache-control: private, no-store`.

Acceptance: test green; `curl -i localhost:<port>/api/visitor-country -H 'x-vercel-ip-country: US'` on a dev server returns `US`/`vercel` with `no-store`.

### Step 3 — Form asks for the visitor country → one call, capped, never noisy

- [ ] Scenarios first (unit, `fetchVisitorCountry.test.ts`). Client guard is `typeof window === 'undefined'` → `null` (not `import.meta.*`, which is falsy under vitest). Client cases run with `// @vitest-environment jsdom`; the server case in a separate file without it. The module exports `__resetVisitorCountryForTests()` to clear the memoized promise in `beforeEach`. `$fetch` is injected/stubbed globally.
- endpoint answers `US` → `'US'`; called twice → one network call
- endpoint rejects / returns non-JSON / `country:null` → `null`, no `console.error` (SCEN-006)
- endpoint slower than 1,500 ms (fake timers) → `null` at 1,500 ms
- no `window` → `null`, no call.

Acceptance: test green.

### Step 4 — Customer leaves the form and comes back → last flag shown is remembered; cleared after reserving

- [ ] Scenarios first: `useStoreReservationForm.resetAfterReservation.test.ts` adds `telefonoPais` to `fillClientA` and `BORRADOS` (red before the store change, green after).

- [ ] Code: `telefonoPais = ref<string|null>(null)`, exported, `telefonoPais.value = null` next to `telefono.value = null` in `resetAfterReservation`.

Acceptance: store tests green.

### Step 5 — Field opens → country decided before it appears, never changed afterwards

- [ ] Scenarios first:
- `pickPhoneCountry.test.ts` (pure): `('CO', 'US') → 'CO'` (store wins, SCEN-007); `(null,'US') → 'US'`; `(null,'ZZ') → 'CO'`; `('us', null) → 'US'` (upper-cased); `(null,null) → 'CO'` (SCEN-006).
- `usePhoneFieldLoader.test.ts` (`// @vitest-environment jsdom`, mounted in a host component with `@vue/test-utils` like `useDelayedClose.test.ts:1-4`, Pinia active): `phoneComponent` stays `null` until component import AND validator are fulfilled and the country promise has settled, even if two resolve early (SCEN-008); `phoneInitialCountry` is set before `phoneComponent`; `onPhoneCountryChanged({iso2:'US'})` writes `'US'` to `telefonoPais`; a rejected component import OR a rejected validator leaves `phoneComponent` null, and a second mount retries and succeeds.
- existing `usePhoneField.test.ts` and `usePhoneField.a11y.test.ts` untouched and green.
- [ ] Code: `pickPhoneCountry.ts`; new `usePhoneFieldLoader(importComponent)` — uses `useStoreReservationForm()` and `onMounted` (client only); known ISO2 set from `component.props.allCountries.default()`.

Acceptance: these tests green.

## Chunk 2: Brands, measurement, QA

### Step 6 — Customer opens the reservation form on any brand → field appears with the resolved flag; layout does not jump

- [ ] Scenarios first: source guards in each brand's `ReservationForm.phoneError.a11y.test.ts` (×3): no `defineAsyncComponent`; `usePhoneFieldLoader(`; `:default-country="phoneInitialCountry"`; `@country-changed="onPhoneCountryChanged"`; `v-if="phoneComponent"` followed by a `v-else` placeholder; existing `mode`/`:inputOptions`/`@blur` bindings kept. Red before the edit.
- [ ] Code (3 identical edits): drop `defineAsyncComponent`; pass `importComponent: () => import('vue-tel-input').then(m => m.VueTelInput)` to `usePhoneFieldLoader`; template `<component :is="phoneComponent" v-if="phoneComponent" :default-country="phoneInitialCountry" @country-changed="onPhoneCountryChanged" …>` with a `v-else` placeholder whose height equals the rendered `vue-tel-input` (measured in the browser). e2e: new no-`+` text at `:64`; negative checks assert `#telefono-error` absent.

Acceptance: new source guards green; brand component tests (`ReservationForm.phoneError.a11y.test.ts` ×3, `ReservationForm.test.ts` alquicarros, `reservation-form-error-focus.test.ts`) green; full vitest run from the root compared with `evidence/vitest-baseline.txt` (no new reds); `e2e/reservation-phone-revalidation.spec.ts` green on one brand.

### Step 7 — Production build → phone metadata is off the initial load (SCEN-013)

- [ ] Build `ui-alquilatucarro` (`cd packages/ui-alquilatucarro && npx nuxt build`), compare with the baseline in Prerequisites: entry gzip, `/bogota` static-closure gzip, location of `min`/`max` metadata and whether either is statically reachable.

Acceptance: neither metadata set is in the static closure of the entry or the `/bogota` page; `/bogota` initial JS < 346.9 kB gzip; numbers recorded for the PR body.

### Step 8 — Exploratory QA in the browser, 3 brands (SCEN-001..012, 013 network half, 014)

- [ ] Local dev servers per brand (or `nuxt preview` of the production build for SCEN-013); Playwright from the repo root (Orca embedded browser for the visual pass), `/api/visitor-country` stubbed to `US`, `CO`, `ZZ`, failing and 1,200 ms-slow. Stub `/api/visitor-country` and the reservation POST (`**/api/reservations/**` create endpoint) with `page.route` BEFORE navigation; open the form via `?reservar=<code>` (alquilame's «Siguiente» does not advance under Playwright). Check each scenario through the network payload of the reservation POST (no real reservation), the visible flag, the error text, leave/re-enter the "datos" step, console errors = 0, failed requests = 0, no request to `ip2c.org`; SCEN-013: no metadata chunk requested on page load, `max` chunk requested on form open; no layout jump = `getBoundingClientRect().top` of the next field equal before/after the swap with a 1,200 ms stub; submitting while the placeholder shows yields «Escribe tu número…» and no console error. Dogfood pass (`agent-browser skills get dogfood`).

Acceptance: every listed scenario observed on all 3 brands, with evidence saved under `evidence/`.

### Step 9 — Quality gate

- [ ] Run code-reviewer, edge-case-detector, performance-engineer and security-reviewer agents on the diff; fix confirmed findings; `/verification-before-completion` with 15/15 scenarios (SCEN-011 production half and SCEN-005 Cloudflare half are post-deploy and are reported as such, not claimed). PR body and the report to Diego go through /humanizer.

## Testing strategy

- Unit: pure functions and modules (validator, messages, endpoint, fetch, country pick, store).
- Component: loader timing in `usePhoneFieldLoader`; brand a11y tests.
- E2E/browser: Playwright journeys with stubbed availability, reservation POST and visitor country.
- Manual: visual pass of the flag and placeholder on mobile width.

## Rollout plan

- No push without Diego's explicit authorization. PR → CI → merge → Vercel deploys the 3 brands.
- Post-deploy: `curl -i https://{alquilame.co,alquilatucarro.com,alquicarros.com}/api/visitor-country` → `source: cloudflare`, a country, `no-store`. If `source` is `none` everywhere, Cloudflare isn't sending `cf-ipcountry`: behavior is today's (CO), and the fix is a Cloudflare setting, not code.
- Monitor for 2 weeks: SQL on the dashboard DB for new reservations with `phone like '+57 1%'` or `'+57 609%'` (expected 0).
- Rollback: revert the PR; no data migration involved.
