# Adversarial review — PR #353

**Verdict: REFUTED**

Reviewed exact head `0e7e1c82e70bdbb2c770dea2568f6edbfea59813` against base `d697bc521eb4b58784be14156164a0b4246b368f` on 2026-07-18. The redirect implementation itself is scoped and loop-safe, but the C1 cluster is not complete: F10 still reproduces on the two query-driven `/reservas` pages, F11 leaves six indexable referral legal pages unlisted without the explicit decision requested by the finding, and most of the new index-signal tests only assert source strings.

## 1. Trailing-slash middleware, query flows, APIs, assets, and render strategies

The shared content redirects work on the exact PR previews. On all three brands, `/bogota/?utm_source=review-c1` returned `301 Location: /bogota?utm_source=review-c1`; following redirects produced exactly one hop and a final `200`. `/blog/` and `/gana/` behaved the same. Alquilatucarro alone also redirected `/tarifas/` and `/tiktok/`; those paths correctly stayed `404` without a redirect on Alquilame and Alquicarros.

The allowlist did not intercept transactional or infrastructure surfaces:

| Probe | Alquilatucarro | Alquilame | Alquicarros |
|---|---:|---:|---:|
| `/reservas/?lugar_recogida=bogota-aeropuerto` | `404`, no redirect (route absent) | `200`, no redirect | `200`, no redirect |
| `/api/rentacar-data/` | `200`, no redirect | `200`, no redirect | `200`, no redirect |
| `/_nuxt/not-real.js/` | `404`, no redirect | `404`, no redirect | `404`, no redirect |

On a real Alquilame asset, both `/_nuxt/WLmIhghd.js` and `/_nuxt/WLmIhghd.js/` remained `200` with `Cache-Control: public, max-age=31536000, immutable`; the middleware did not touch either. `HEAD /bogota/` returned the intended 301, while `POST` and `OPTIONS` did not redirect.

Nitro middleware and route rules also composed correctly in the preview: the 301 responses retained the baseline security route-rule headers, final `/bogota` and `/blog` responses were `200` and served as Vercel cache hits, and the prerendered `/gana` target remained `200`. Thus I found no middleware-order regression against ISR or prerendered targets.

One limitation remains by design: clean `/reservas/` is still an indexable `200` on both secondary brands and canonicalizes in HTML to `/reservas`, rather than redirecting. This does not break the query flow, but it leaves the same slash duplicate pattern outside the city-only F2 fix.

Local reproduction notes: `pnpm install --ignore-scripts` completed in 3.7 seconds. A local Nuxt dev launch then hit the already-documented missing `@oxc-parser/binding-darwin-arm64` native binding, so runtime conclusions above use the three successful Vercel deployments for this exact SHA rather than a different revision.

## 2. Sitemap and X-Robots-Tag consistency

The positive part is observable: each generated preview sitemap contained 41 URLs, included `/gana`, excluded `/chat` and `/tiktok`, and all 123 advertised brand/URL combinations returned `200` without an HTML `noindex` directive. I found no noindex page still advertised in the generated sitemaps. The new route rules also produced `X-Robots-Tag: noindex, nofollow` on `/chat`, `/pendiente`, `/sindisponibilidad`, `/reservado/ABC123`, and Alquilatucarro `/tiktok`.

However, F10 is still reproducible on both brands that own the query-driven `/reservas` route:

```text
Alquilame /reservas?lugar_recogida=bogota-aeropuerto
status: 200
HTML:   <meta name="robots" content="noindex, follow">
HTTP:   x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1

Alquicarros /reservas?lugar_recogida=bogota-aeropuerto
status: 200
HTML:   <meta name="robots" content="noindex, follow">
HTTP:   x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
```

The slash forms return the same contradiction. This directly disproves the PR body’s claimed Alquilame proof of `x-robots-tag: noindex, nofollow` for that query flow. A static `/reservas` route rule would be wrong because the clean page is intentionally indexable; the fix must be conditional on the result-query state.

F11 is only partially resolved. `/gana` is now submitted, but both `/gana/terminos-condiciones` and `/gana/politicas-privacidad` are `200`, self-canonical, explicitly `index, follow`, and absent from every brand sitemap—six indexable pages total. The original finding allowed either outcome but required an explicit decision: include them, or mark/exclude them consistently. This PR does neither. This is not evidence that a noindex page is advertised; it is evidence that indexable pages remain unlisted.

## 3. Cross-brand equivalence

The three config edits are equivalent for shared behavior. All add the same `/gana`, `/chat`, status-page, and reservation-confirmation rules; Alquilatucarro’s extra `/tiktok` handling matches its extra page. The three middleware wrappers differ only in the intended brand literal, and preview behavior for shared content is identical. Primary-only `/tarifas` and `/tiktok` correctly remain non-redirecting 404s on the other brands.

The unresolved F10 behavior is symmetrically wrong on Alquilame and Alquicarros; it is an omitted route state, not an accidental one-brand config drift. The older canonical-domain middleware difference on the secondary brands remains outside this diff.

## 4. Test quality

The requested focused run passed:

```text
Test Files  2 passed (2)
Tests       35 passed (35)
Duration    99ms
```

The 25 `trailingSlashRedirect` cases meaningfully assert the pure helper’s returned targets and exclusions. They still do not exercise an H3 event, middleware short-circuiting, route-rule precedence, or a final HTTP response.

The 10 `seo-index-signals` cases are tautological implementation checks: they read `nuxt.config.ts` and middleware source as text, slice between string markers, and assert that exact strings are present. They never generate a sitemap or observe a status, `Location`, HTML robots meta, or response header. The suite is green while the exact preview still exhibits the F10 contradiction above, demonstrating the missing behavioral coverage.

## 5. Redirect-loop risk

I found no loop. Live `https://www.alquilatucarro.com/bogota/?utm_source=loop-proof` returns a 308 to `https://alquilatucarro.com/bogota/?utm_source=loop-proof`, preserving the slash and query. The PR preview then independently proves the slash transform is a 301 from `/bogota/?...` to `/bogota?...`, followed by `200`. Composed after deployment, these are at most two monotonic hops: one removes `www`, one removes the trailing slash; neither transformation adds back what the other removes.

Alquilame and Alquicarros can likewise produce two hops through their existing canonical middleware and the new slash middleware, but there is no reverse edge and therefore no loop. Their existing 301 method-semantics concern from F12 remains, while this new helper correctly limits itself to GET/HEAD.

## Required before C1 can be accepted

1. Emit a query-aware noindex HTTP header for the results state of `/reservas` in Alquilame and Alquicarros without noindexing the clean landing page, and add an HTTP-level regression test for both states.
2. Record and implement the intended sitemap/indexing decision for the two `/gana` legal children.
3. Add Nitro-level behavioral coverage for representative redirect, exclusion, generated sitemap, and final X-Robots-Tag responses; source-string checks are insufficient.

I would not block on the slash redirect or www-loop mechanics themselves; the **REFUTED** verdict is for incomplete F10/F11 closure and tests that do not observe those failures.

---

## FINAL re-review — PR #353

**FINAL VERDICT: STILL-REFUTED**

Re-reviewed exact updated head `3bc23601dca44c1f1f249b75fc9adeff8ba0f5ee` on 2026-07-18 after running `gh pr view 353` and the complete `gh pr diff 353`. The two deployed runtime defects from the first review are fixed, but the explicitly required HTTP/Nitro regression coverage is still absent.

### Runtime reproductions that are now resolved

On the successful Vercel previews for both secondary brands, the exact F10 cases now agree at the HTTP and HTML layers:

| Brand and request | Status | HTTP `X-Robots-Tag` | HTML robots |
|---|---:|---|---|
| Alquilame `/reservas` | 200 | `index, follow, ...` | no page-level noindex |
| Alquilame `/reservas?lugar_recogida=bogota-aeropuerto` | 200 | `noindex, follow` | `noindex, follow` |
| Alquilame `/reservas/?lugar_recogida=bogota-aeropuerto` | 200 | `noindex, follow` | `noindex, follow` |
| Alquicarros `/reservas` | 200 | `index, follow, ...` | no page-level noindex |
| Alquicarros `/reservas?lugar_recogida=bogota-aeropuerto` | 200 | `noindex, follow` | `noindex, follow` |
| Alquicarros `/reservas/?lugar_recogida=bogota-aeropuerto` | 200 | `noindex, follow` | `noindex, follow` |

All six F11 legal-page combinations are also resolved. Each generated brand sitemap now has 43 `<loc>` entries and contains both `/gana/terminos-condiciones` and `/gana/politicas-privacidad`. Direct requests to both pages on all three previews returned 200, a self-canonical, and matching HTML/HTTP `index, follow` signals. The chosen policy is therefore explicit and consistent: keep the legal children indexable and submit them.

### Remaining unresolved finding: behavioral regression coverage

The first review required an HTTP-level clean-vs-results test and Nitro-level checks of the generated sitemap, final redirect, and final robots header. The follow-up tests still inspect source/config text instead:

- `packages/logic/tests/seo-index-signals.test.ts:14-21` uses `readFileSync` and slices `nuxt.config.ts`; its sitemap/header assertions check literal strings. Its edge checks parse `vercel.json` and test the regex locally, but never observe a deployed or Nitro response.
- The new assertions in the Alquilame and Alquicarros reservation page tests read `index.vue` as text and regex-match `useResponseHeader`, `import.meta.server`, and the assignment. They never render SSR or request clean/query states.
- No added test boots Nuxt/Nitro, requests either `/reservas` state, fetches generated `/sitemap.xml`, or asserts a final HTTP status, `Location`, HTML robots meta, or `X-Robots-Tag` response.

The focused logic/config run passed 40/40 tests (25 redirect-helper + 15 index-signal), but these are the same non-HTTP layers described above. The two UI source-test suites could not load locally because their generated `.nuxt/tsconfig.app.json` files are absent; attempts to run `nuxt prepare` hit the already-known missing `@oxc-parser/binding-darwin-arm64`. GitHub's `Quality Checks` job is green, and the live previews independently prove the current runtime fix, but neither supplies the requested regression test in the repository.

Therefore F10's runtime behavior and F11's policy/behavior are accepted as fixed, while required items 1 (HTTP regression-test half) and 3 from the original review remain unmet. The final verdict stays **STILL-REFUTED** until repository tests exercise the final HTTP/Nitro behavior rather than source strings.

---

## Round-2 re-review — PR #353

**FINAL VERDICT: CONFIRMED-RESOLVED**

Re-reviewed exact updated head `621a3321f8cb171f90076bbfd01ebb99cdbeb2d2` on 2026-07-18, limited to the behavioral regression coverage left outstanding in my prior review. The new `@nuxt/test-utils` suites close that item: they boot a Nuxt/Nitro server and make HTTP requests against it rather than reading implementation source.

### Independent reproduction

After refreshing the workspace dependencies/native optional packages and generating each brand's Nuxt metadata, I ran each new file directly:

```text
pnpm --filter ui-alquilatucarro exec vitest run tests/seo-index-signals.http.test.ts
Listening on http://127.0.0.1:49899
Test Files  1 passed (1)
Tests       2 passed (2)

pnpm --filter ui-alquilame exec vitest run tests/seo-index-signals.http.test.ts
Listening on http://127.0.0.1:50191
Test Files  1 passed (1)
Tests       2 passed (2)

pnpm --filter ui-alquicarros exec vitest run tests/seo-index-signals.http.test.ts
Listening on http://127.0.0.1:50425
Test Files  1 passed (1)
Tests       2 passed (2)
```

The Alquilatucarro suite calls `setup()` and then `fetch()` to assert the final `301` and `Location: /bogota` for `/bogota/`; it separately requests `/sitemap.xml`, requires HTTP 200, parses actual `<loc>` values, requires both `/gana` legal children, and rejects `/chat`/`/tiktok`. The Alquilame and Alquicarros suites likewise call `setup()` and request both `/reservas` and `/reservas?lugar_recogida=bogota-aeropuerto`, asserting final HTTP 200 responses and the clean `index, follow` versus query `noindex, follow` `X-Robots-Tag` split. These are final response assertions, not source-string checks.

### CI enforcement

`gh pr checks 353` is fully green at this head. `Quality Checks` passed in 5m14s (run `29661785148`, job `88125589925`). The workflow runs all three package test commands without `continue-on-error`, and the job log proves the new files were collected, started servers, and passed rather than skipped:

```text
ui-alquilatucarro  Listening on 127.0.0.1:38161  seo-index-signals.http.test.ts (2 tests) passed
ui-alquilame       Listening on 127.0.0.1:42275  seo-index-signals.http.test.ts (2 tests) passed
ui-alquicarros     Listening on 127.0.0.1:35565  seo-index-signals.http.test.ts (2 tests) passed
```

My previously accepted runtime fixes remain outside the only outstanding scope. The missing repository-level HTTP/Nitro coverage and CI-enforcement findings are now resolved, so PR #353 is **CONFIRMED-RESOLVED**.
