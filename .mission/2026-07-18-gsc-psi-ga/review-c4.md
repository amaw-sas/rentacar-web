# Adversarial review — C4 / PR #352

**Verdict: REFUTED**

Reviewed PR #352 at commit `4faf27dde7212893f4a9a8fce407fef2d2dd71d0` against F4. No application code was changed or pushed by this review.

## Blocking finding

The PR makes a real reservation render as 404 on two of the three brands.

The new shared endpoint calls `useSupabaseAdminClient()`, which requires both `NUXT_SUPABASE_URL` and `NUXT_SUPABASE_SERVICE_ROLE_KEY`. Vercel's environment-variable inventory shows the service-role key on the Alquilatucarro project, but not on either the Alquilame or Alquicarros project. This matches the deployed behavior:

| Brand preview | Current real, brand-matching code (redacted) | `GET /api/reservations/<code>/exists` | `GET /reservado/<code>` |
|---|---:|---:|---:|
| Alquilatucarro | 11 chars | `200 {"exists":true}` | `200` |
| Alquilame | 11 chars | `500 Server Error` | `404 Reserva no encontrada` |
| Alquicarros | 10 chars | `500 Server Error` | `404 Reserva no encontrada` |

The real codes were obtained with a code-only, read-only query (`reservation_code,franchise`); no customer/PII fields were queried or printed, and no reservation was created.

The page turns every lookup problem into a not-found error:

```ts
if (lookup.error.value || lookup.data.value?.exists !== true) {
  throw reservationNotFound()
}
// ...
} catch {
  throw reservationNotFound()
}
```

Therefore missing configuration, Supabase downtime, network failure, and the endpoint's intentional 503 all become a false 404. This is not just theoretical: it is the current PR-preview result for valid Alquilame and Alquicarros reservations. It breaks the happy path and gives both customers and crawlers the wrong permanent semantic signal.

## What the PR does fix

The original soft-404 is fixed for nonexistent initial documents:

| Preview | `GET /reservado/CODIGO-INEXISTENTE-XYZ` | Body |
|---|---:|---|
| Alquilatucarro | `404` | Nuxt JSON error; no confirmation H1 |
| Alquilame | `404` | Nuxt JSON error; no confirmation H1 |
| Alquicarros | `404` | Nuxt JSON error; no confirmation H1 |

This is honest SSR behavior, not merely a client-side error screen:

- All three Nuxt configs have `ssr: true`.
- `/reservado/**` is absent from ISR `routeRules` and `nitro.prerender.routes`.
- Each page top-level-awaits `useReservationConfirmation()` before rendering or analytics.
- Fresh preview `GET` and `curl -sI` requests return HTTP 404 for malformed and well-formed missing codes.
- `fatal: true` also replaces the page on client navigation, although that client behavior is not the evidence for the initial-document status.

Alquilatucarro's current real-code path remains 200. The page content and analytics call are otherwise untouched and occur only after validation. Reservation creation and the dashboard notification implementation (email/WhatsApp/GHL) are outside this diff, so the PR does not directly change their side effects.

## Security/privacy assessment

- **Authentication:** none. The existence endpoint is public and succeeds without cookies or authorization.
- **Enumeration:** it is an explicit anonymous oracle: a valid code returns `{"exists":true}` and an invalid or other-brand code returns `{"exists":false}`. The query is correctly scoped by `franchise`.
- **Rate limiting:** none in the handler or middleware. Twenty repeated anonymous missing-code requests all returned 200; the response had no rate-limit or retry headers.
- **Caching:** safe: `Cache-Control: private, no-store`.
- **PII:** no direct PII leak found. The service-role query selects only `id`, the response reduces that to a boolean, and the confirmation page contains the code already present in the URL plus generic copy. No name, email, phone, identification, dates, price, or status is returned.
- **Risk calibration:** observed current standard codes are opaque 10–11 character values, which materially reduces blind brute-force feasibility. Nevertheless, the public oracle has no throttling and uses a service-role client that bypasses RLS; leaked or harvested candidate codes can be confirmed anonymously. Add throttling and document whether the URL code is intentionally treated as a bearer secret, or use a signed confirmation token.

The oracle is a security-hardening concern; the already-reproduced two-brand happy-path regression is independently sufficient to refute the PR.

## Tests and reproduction

Install and focused tests:

```text
$ pnpm install --ignore-scripts
Done in 4.2s

$ pnpm --filter @rentacar-main/logic exec vitest run \
    src/utils/__tests__/reservationCode.test.ts \
    src/composables/__tests__/useReservationConfirmation.test.ts \
    server/api/reservations/__tests__/exists.get.test.ts \
    tests/reservation-confirmation-pages.test.ts

Test Files  4 passed (4)
Tests      26 passed (26)
```

These tests do not assert the observable SSR response. The composable test mocks `useFetch`, the handler test mocks Supabase and Nuxt globals, and the cross-brand test only reads Vue source text. None boots Nitro, makes an initial-document request, supplies each brand's actual deployment configuration, or exercises an infrastructure failure as HTTP. That is why 26/26 pass while two deployed valid-code paths fail.

A local Nuxt dev-server attempt after the requested `--ignore-scripts` install was blocked by the repository's known optional-native dependency problem:

```text
Cannot find module '@oxc-parser/binding-darwin-arm64'
```

The ready Vercel previews were therefore used for HTTP-level SSR verification.

## Required before CONFIRMED-SAFE

1. Make the validation dependency available and verified in all three Vercel projects/environments, or use an already-configured server-to-server reservation lookup that does not require a new per-project service-role secret.
2. Return/propagate 5xx for validation infrastructure failures; only a successful lookup with no matching row should become 404.
3. Add an HTTP-level SSR test per brand that proves malformed = 404, well-formed missing = 404, real brand-matching code = 200, other-brand code = 404, and lookup outage = 5xx.
4. Add rate limiting (or an explicit accepted-risk decision based on code entropy/bearer-token semantics) for the public existence oracle.

---

# Re-review — C4 / PR #352

**FINAL VERDICT: STILL-REFUTED**

Re-reviewed PR #352 at commit `60b7c45e74d180413282af2b34fdd2fcf7d17a6d`. The exact valid-reservation false-404 regression from the first review is fixed:

| Brand preview | Current real, brand-matching code (redacted) | `GET /api/reservations/<code>/exists` | `GET /reservado/<code>` |
|---|---:|---:|---:|
| Alquilatucarro | 11 chars | `200 {"exists":true}` | `200`, confirmation H1 present |
| Alquilame | 11 chars | `503` | `200`, confirmation H1 present |
| Alquicarros | 11 chars | `503` | `200`, confirmation H1 present |

The real codes were obtained again with a code-only, read-only query (`reservation_code,franchise`); no customer/PII fields were queried or printed. Thus the two valid secondary-brand pages no longer turn validator failure into a permanent 404.

However, the underlying documented deployment/configuration finding is not resolved. `NUXT_SUPABASE_SERVICE_ROLE_KEY` remains unavailable to the Alquilame and Alquicarros previews. A service-role, code-only query confirmed that synthetic well-formed code `ZZZZZZZZZZZZ` matches zero reservations across all franchises, then fresh preview requests produced:

| Brand preview | `GET /api/reservations/ZZZZZZZZZZZZ/exists` | `GET /reservado/ZZZZZZZZZZZZ` |
|---|---:|---:|
| Alquilatucarro | `200 {"exists":false}` | `404`, no confirmation H1 |
| Alquilame | `503` | `200`, confirmation H1 present |
| Alquicarros | `503` | `200`, confirmation H1 present |

The fail-open change therefore swaps the previous false 404 for an observable soft 404/success page whenever validation is unavailable. It does not meet the prior required resolution: make validation authoritative in all three deployments (or propagate the outage as 5xx), so a known-missing reservation cannot render as confirmed. F4 remains unverified and currently false on two of the three ready previews.

The prior rate-limit concern is resolved. One fresh probe returned `X-RateLimit-Limit: 30` and `X-RateLimit-Remaining: 29`; the following 35 sequential anonymous requests returned 29 HTTP 200s and 6 HTTP 429s, with remaining `0` and `Retry-After` present.

Focused tests pass (`4` files, `31/31` tests), but the composable/handler cases still mock Nuxt/Supabase and the cross-brand test still reads source text. There is still no automated Nitro initial-document test covering the live configured/unconfigured split; the deployed HTTP reproduction above is why the remaining failure is visible despite a green suite.

No application code was changed or pushed by this re-review.

---

# Re-review round 2 — C4 / PR #352

**FINAL VERDICT: CONFIRMED-RESOLVED**

Re-reviewed only the outstanding C4 behavior at PR head `ae3200e30659ecc6cdc2fa876e85faa9f9ba55d7`. A fresh code-only, read-only service-role query confirmed that `ZZZZZZZZZZZZ` still matches zero reservations; no customer/PII fields were queried or printed. Exact initial-document requests to the ready previews produced:

| Brand preview | Existence API for `ZZZZZZZZZZZZ` | `GET /reservado/ZZZZZZZZZZZZ` | Rendered state |
|---|---:|---:|---|
| Alquilatucarro | `200 {"exists":false}` | `404` | not-found copy; no confirmation or unavailable markup |
| Alquilame | `503` | `503`, `Retry-After: 300` | neutral unavailable markup and copy; no confirmation or not-found markup |
| Alquicarros | `503` | `503`, `Retry-After: 300` | neutral unavailable markup and copy; no confirmation or not-found markup |

Both unavailable documents contained `data-reservation-state="unavailable"`, “Estamos verificando tu reserva,” “Intenta en unos minutos,” and HTML `noindex, nofollow`. Neither contained `data-reservation-state="confirmed"`, confirmation copy, nor “Reserva no encontrada.” This directly resolves my prior deployed reproduction: validator failure is no longer HTTP 200/confirmation UI and is not misclassified as 404.

For the other branch of the three-way contract, a fresh brand-scoped, code-only query selected one existing reservation per brand without printing the codes. The configured Alquilatucarro preview returned existence API `200 {"exists":true}` and page `200` with confirmed markup. Alquilame and Alquicarros, whose validators remain unavailable, correctly returned page `503` with unavailable markup even for those real codes; they did not falsely confirm or 404 them.

The new Nitro fixture is CI-enforced: the green Quality Checks job ran its three initial-document tests (found `200`, missing `404`, unavailable `503`) and reported the full logic suite at 124 files / 823 tests passing. Locally, the four non-Nitro focused files passed 34 tests; the HTTP fixture capability-skipped because this machine still lacks the known OXC native binding, so the deployed preview requests above are the independent HTTP reproduction.

The previously resolved rate-limit finding was not reopened. No application code was changed or pushed by this review.
