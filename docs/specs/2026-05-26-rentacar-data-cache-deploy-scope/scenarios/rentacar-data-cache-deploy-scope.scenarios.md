---
name: rentacar-data-cache-deploy-scope
created_by: claude-sdd
created_at: 2026-05-26T00:00:00Z
---

# Scenarios — deployment-scoped cache key for `/api/rentacar-data`

Holdout for the fix in `../implementation/plan.md`. Root cause + design: `../../2026-05-26-rentacar-data-cache-deploy-scope-design.md`.

## SCEN-C1: cache key is derived from buildId, and refuses an empty buildId
**Given**: the pure helper `rentacarDataCacheKey(buildId)`
**When**: it is called with `"build-A"`, then `"build-B"`, then `""`
**Then**: it returns `"build-A"`; `rentacarDataCacheKey("build-A") !== rentacarDataCacheKey("build-B")` (distinct builds never collide); and `rentacarDataCacheKey("")` throws (an empty buildId would silently collapse to one shared key, re-creating the cross-build leak — so it must fail loud)
**Evidence**: vitest assertions in `packages/logic/server/utils/__tests__/rentacarDataCacheKey.test.ts`, run output green

## SCEN-C2: a stale cross-build cache entry is never served
**Given**: a Nitro cache entry stored under `escapeKey(buildIdA)` in `handlers/rentacar-data/` whose body lacks the `faqs` key (the pre-faqs shape that crashes `/`)
**When**: the cached handler is invoked under a different `buildIdB` (B≠A) — i.e. a new deploy/build
**Then**: the seeded entry is not served; the handler runs a fresh fetch and the response carries the current schema (with `faqs`); `/` renders 200, not 500
**Evidence**: the cache entry written by the build is `handlers/rentacar-data/<escapeKey(buildIdB)>.json` (distinct filename from the seeded `escapeKey(buildIdA)`), and `/` prerenders 200 in the build log

## SCEN-C3: a clean build prerenders `/` successfully
**Given**: a production build with no restored stale cache
**When**: `nuxt build` (alquilatucarro) prerenders all routes
**Then**: `/` is `200`, the build exits 0, and the log contains no "Exiting due to prerender errors"
**Evidence**: build log line `├─ / (…ms)` with no `[500]`, and process exit code 0

## SCEN-C4: fail-loud on a genuine fetch failure is preserved (SCEN-003 unchanged)
**Given**: the cache-key change applied
**When**: comparing the handler/plugin error paths against `origin/main`
**Then**: the plugin's `console.error('[rentacar-data] fetch failed:', …)` + `throw`, and the handler's per-result `createError(500)` / `504` paths, are byte-identical to `origin/main` — a genuine Supabase fetch failure still aborts the build loud, exactly as issue #2 / SCEN-003 requires
**Evidence**: `git diff origin/main -- packages/logic/server/api/rentacar-data.get.ts` shows only the `getKey` option, the helper import, and the comment refresh — no change to any `throw` / `createError` / `console.error` line; the plugin file is unchanged

## SCEN-C5: the handler is a single shared source, not a per-brand copy
**Given**: the repository
**When**: `find packages -path '*/server/api/rentacar-data.get.ts'`
**Then**: exactly one path is returned, in the shared logic layer; no per-brand override exists, so all 3 brands inherit the change via `extends`
**Evidence**: `find` output is a single line `packages/logic/server/api/rentacar-data.get.ts`

## SCEN-C6: the fix-branch preview deploy is GREEN against the same restored cache (definition of done)
**Given**: the branch base (`main`, pre-fix) deploys RED today because Vercel restores #57's stale cache
**When**: the fix branch is deployed to a Vercel preview (restoring that same cache)
**Then**: the preview reaches READY for all 3 brands with `/` served — the first green deploy since #58 — while the base stays RED, evidencing reproduce→fix against an identical restored-cache baseline
**Evidence**: Vercel deployment `readyState: READY` for the fix-branch preview (vs `ERROR` for the base), and its build log shows `├─ / (…ms)` with no `[500]` / no "Exiting due to prerender errors"
