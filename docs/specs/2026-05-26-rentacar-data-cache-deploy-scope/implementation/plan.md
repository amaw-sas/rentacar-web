# Implementation Plan — deployment-scoped cache key for `/api/rentacar-data`

**Date:** 2026-05-26
**Design:** `docs/specs/2026-05-26-rentacar-data-cache-deploy-scope-design.md` (approved; spec-reviewer approved iter2)
**Branch:** `fix/rentacar-data-cache-schema-drift` (worktree, from `origin/main` @ 59866e1)
**Scenarios (holdout):** SCEN-C1…C6 from the design doc.

## File structure

Files that change together live together. The change is one cache option plus the seam that makes it testable.

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/logic/server/utils/rentacarDataCacheKey.ts` | **NEW** | Single source of the cache-key derivation: `buildId → key`. Guards the invariant that the key must be deploy-unique (throws on empty `buildId` rather than silently producing a shared key). Pure, no Nitro auto-imports → unit-testable in the node vitest env. |
| `packages/logic/server/utils/__tests__/rentacarDataCacheKey.test.ts` | **NEW** | Unit lock for SCEN-C1: returns the buildId; distinct buildIds → distinct keys; empty buildId throws. |
| `packages/logic/server/api/rentacar-data.get.ts` | **MODIFY** | Add `getKey: (event) => rentacarDataCacheKey(useRuntimeConfig(event).app.buildId)` to the cached-handler options; refresh the stale cache-strategy TODO comment to record the deploy-scoping. No change to any fetch/throw path. |

The helper lives in `server/utils/` beside `rentacarDataFetch.ts`, matching the existing pattern of extracting handler logic into testable utils (`fetchRentacarData` was extracted for the same reason in #7). The handler stays the only consumer. All three brands inherit the change through the shared `logic` layer — no per-brand file exists (SCEN-C5).

## Prerequisites

- **`pnpm install` in the worktree first** — a fresh git worktree has no `node_modules`. Needed before unit tests, build, or confirming Nitro's `escapeKey` against installed source.
- Local prod-build verification uses the existing `.env.local` (Supabase creds): `nuxt build --dotenv ../../.env.local` from `packages/ui-alquilatucarro`.
- Worktree already created; baseline is `origin/main` (carries the bug).

## Implementation steps

### Step 1 — Deploy-scoped cache key (the fix) · Size: S · Deps: none

Introduce `rentacarDataCacheKey(buildId)` and wire it into the cached handler so the entry is stored under the per-build `app.buildId`; update the TODO comment. A restored cross-build entry then sits under a different key and is never served.

**Scenarios:** SCEN-C1 (key derivation), SCEN-C3 (clean build → `/` 200), SCEN-C5 (single source).

**Acceptance criteria:**
- `rentacarDataCacheKey('a') === 'a'`; `rentacarDataCacheKey('a') !== rentacarDataCacheKey('b')`; `rentacarDataCacheKey('')` throws. Unit test green (`pnpm --filter @rentacar-main/logic test`).
- `rentacar-data.get.ts` passes `getKey` reading `useRuntimeConfig(event).app.buildId` via the helper; no fetch/throw path edited (diff shows only the option + comment + import).
- Local prod build of alquilatucarro: `/` prerenders **200**, exit 0, no "Exiting due to prerender errors"; the written cache entry is at `packages/ui-alquilatucarro/.nuxt/cache/nitro/handlers/rentacar-data/<escaped-buildId>.json`, **not** the old request-hash filename — proving the key is buildId-scoped. Read this together with the design's SCEN-C1 note: `escapeKey` strips `\W`, so the filename is the UUID with hyphens removed; assert on the escaped form, not the raw `buildId`.
- `find packages -path '*/server/api/rentacar-data.get.ts'` returns exactly one path (the logic layer).
- The empty-`buildId` guard fires only on misconfiguration: per the design, `app.buildId` is a `randomUUID()` on a prod build and the literal `"dev"`/`"test"` otherwise — always non-empty — so a normal build never trips the throw.

### Step 2 — Adversarial regression: stale entry ignored, fail-loud intact · Size: S · Deps: Step 1

Prove the actual incident cannot recur and that fail-loud is untouched.

**Scenarios:** SCEN-C2 (cross-build stale entry not served), SCEN-C4 (fail-loud preserved).

**Acceptance criteria:**
- With Step 1 built, seed a cache entry under a *different* buildId filename whose body lacks `faqs`, then run the build / request `/`: the seeded entry is **not** served (fresh fetch runs; `/` is 200 with faqs). This reproduces the incident's fixture against the fixed code and shows it no longer crashes.
- Fail-loud unchanged: `git diff origin/main -- packages/logic/server/api/rentacar-data.get.ts` shows only the `getKey` option, the comment refresh, and the helper import — no change to any `createError`/`throw`/`console.error` line. The plugin's `console.error('[rentacar-data] fetch failed:', …)` + `throw` are untouched. A genuine fetch failure still aborts the build loud — SCEN-003 invariant intact.

### Step 3 — Deploy gate (definition of done) · Size: S · Deps: Steps 1–2

Push the branch and observe the Vercel preview, capturing the reproduce→fix evidence.

**Scenario:** SCEN-C6 (preview GREEN against the same restored cache).

**Acceptance criteria:**
- The fix branch's Vercel preview deploy reaches **READY** (all 3 brands), with `/` served — the first green deploy since #58.
- Evidence captured for both halves of reproduce→fix: the current main/branch-base preview observed RED (restores #57's stale cache) and the fix-branch preview observed GREEN against that same restored baseline.
- Push only after explicit user authorization (CLAUDE.md: no `git push` without it).

## Testing strategy

- **Unit (vitest, logic):** `rentacarDataCacheKey` — SCEN-C1. Runs in the existing node env, no Nitro globals (the reason the logic lives in a pure helper). Delta-vs-baseline acceptance per the repo's red typecheck/lint baseline.
- **Build-artifact (scripted, local):** prod build → `/` 200 + cache filename = escaped buildId — SCEN-C3, and the key half of SCEN-C1's wiring. Stale-seed build → `/` 200 — SCEN-C2.
- **Diff inspection:** fetch/throw paths unchanged — SCEN-C4; single handler file — SCEN-C5.
- **Deploy:** Vercel preview GREEN — SCEN-C6, the real definition of done.

The unit test is a fast in-suite regression lock; the build and deploy observations are the faithful proof that the incident is fixed. No scenario is satisfied by weakening it to match output.

## Rollout plan

1. Open PR `fix/rentacar-data-cache-schema-drift` → `main` (after user authorizes push). PR body: root cause, the one-line fix, the reproduce→fix evidence (RED base / GREEN fix), and that it supersedes the closed #60/#61. `Refs #2` (fail-loud context); does not fully close #7/#16-F2 (broader cache strategy remains).
2. Merge unblocks the deploy pipeline: the next `main` deploy restores the (now key-mismatched) stale cache, misses, fetches fresh, and goes green — production catches up to the faqs migration.
3. **Monitoring:** confirm the post-merge production deploy is READY; spot-check `/` renders FAQs on all 3 brands.
4. **Rollback:** revert the single commit. The cache-key change is self-contained and side-effect-free; reverting returns to the prior (broken) keying. Production stays on the last green deploy regardless, so a bad change cannot take the live site down — only the deploy would error, as today.

## Out of scope / follow-ups

- Broader cache strategy (shorter `maxAge`, tag-based invalidation from the admin write path) — #7 / #16-F2.
- Dev-mode cache persistence (`buildId === "dev"`) — dev convenience only; clear `.nuxt/cache` if needed.
