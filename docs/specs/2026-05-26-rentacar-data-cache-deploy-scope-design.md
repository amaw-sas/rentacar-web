# Deployment-scoped cache key for `/api/rentacar-data`

**Date:** 2026-05-26
**Status:** Approved — pending implementation
**Scope:** `packages/logic/server/api/rentacar-data.get.ts` (shared layer → all 3 brands)
**Related:** issue #2 / SCEN-003 (fail-loud), faqs→Supabase migration (#58/#12), cache TODOs in #7 and #16-F2. Supersedes the wrong-root-cause attempts PR #60 and PR #61 (both closed).

## Problem

Every Vercel deploy since the faqs→Supabase migration merged (#58, ~2026-05-21) fails, including production. Production is frozen on the last green deploy, #57 (`93bb14a`), so the faqs migration never reached users and nothing new can ship.

The failure is **deterministic**, not a transient blip. During Nitro prerender the `/` route returns `[500] Server Error` while all 24 city routes return 200, which aborts the build ("Exiting due to prerender errors"). The exact thrown error, reproduced locally:

```
Cannot read properties of undefined (reading 'map')
  at setup (packages/ui-{brand}/app/pages/index.vue)   // faqs.map(...) in the useSchemaOrg FAQPage block
```

### Root cause (proven)

`/api/rentacar-data` is a `defineCachedEventHandler({ name: 'rentacar-data', maxAge: 3600 })` (SWR on by default). Its cache persists to `packages/ui-*/.nuxt/cache/nitro/handlers/`, which lives under `node_modules/.cache/nuxt/`.

Vercel **restores the build cache from the previous deployment** — the build log states it verbatim: `Restored build cache from previous deployment (CWPEgb2…)`, which is deploy #57, *before* faqs existed. So the restored cached response is frozen at the pre-faqs shape — it has **no `faqs` key**.

The chain:
1. Prerender renders `/` first. Its plugin calls `$fetch('/api/rentacar-data')`.
2. SWR returns the restored stale entry (no `faqs`) immediately.
3. `useData().faqs` is `undefined`; the homepage `useSchemaOrg` block runs `faqs.map(...)` → throws → `[500]` → build aborts.
4. City pages render FAQs from hardcoded `useCityFAQs`, never touching `useData().faqs`, so they pass — which is why only `/` fails.

It is not a fetch failure: there is **no `[rentacar-data] fetch failed:`** log (the SCEN-003 fail-loud signature is absent) and a direct call to `/api/rentacar-data` returns 200 with the faqs present. The fetch succeeds; the cache simply hands back a response shaped for an older schema.

The failure is self-perpetuating: failed deploys do not update the cache baseline, so every new deploy keeps restoring #57's stale entry.

### Why the earlier fixes missed

PR #60 (`nitro.prerender { retry: 5, retryDelay: 3000 }`) and PR #61 (bounded retry inside `fetchRentacarData`) both assumed a transient fetch blip. Retrying re-renders `/` against the same stale cache, so neither could ever go green. Both are closed.

## The fix

Scope the handler's cache key to a single deployment so a restored cross-build entry can never match:

```ts
}, {
  maxAge: 3600,
  name: 'rentacar-data',
  getKey: (event) => useRuntimeConfig(event).app.buildId,
})
```

`app.buildId` is unique per production build (Nuxt default; not pinned in this repo) and constant within a build, available at both build and runtime.

- **Within a deploy:** one stable key → prerender writes the entry, runtime reuses it. The caching benefit is preserved.
- **Across deploys:** the restored entry sits under the previous build's `buildId`; the new build reads under its own `buildId` → cache miss → fresh Supabase fetch → the response always carries the current schema → `/` renders → deploy green.

A stale-shaped response can never be served to a build that did not produce it. The fix is auto-busting — no manual version to bump on future schema changes — and the only cost is one fresh ~1.5s fetch per deploy during prerender, which is the correct behavior on a new deploy anyway.

### Alternatives considered

- **Static schema version in the key** (e.g. `'rentacar-data:v2'`, bumped by hand). Fixes the immediate incident but recurrence depends on a human remembering to bump on every schema change — and this incident *is* a schema change nobody bumped for. Rejected as fragile.
- **Disable cross-build cache persistence** (force a non-restored storage for the handler). More invasive, fights Vercel's build cache, and risks losing runtime caching. Rejected as disproportionate.

## Error handling

Fail-loud is preserved unchanged. No throw path is touched: a genuine Supabase fetch failure still logs `[rentacar-data] fetch failed:` and aborts the build, exactly as SCEN-003 (issue #2) requires. The consumer (`useFetchRentacarData`, homepage) is not modified — no shape-masking, no silent degradation. The fix changes *which* cache entry is read, never whether failures surface.

## Blast radius

- **Changed:** `packages/logic/server/api/rentacar-data.get.ts` — add `getKey`; refresh the stale cache-strategy TODO comment.
- **Consumers (behavior unchanged):** `packages/logic/plugins/rentacar-data.ts` → `useFetchRentacarData` → homepage `/`, city pages, reservation flow, across all 3 brands.
- **New:** one unit test locking the key mechanism; design doc + scenarios.

## Testing & verification

1. **Unit (vitest, logic):** `getKey` returns the build's `app.buildId`, so Nitro stores the entry under a per-build key. Two notes for the implementer: Nitro escapes the stored key via `escapeKey` (`String(key).replace(/\W/g, "")`, so a UUID's hyphens are dropped) — a literal-key assertion must apply the same escaping; and because `buildId` is constant under Vitest (`"test"`), the test drives the key logic with explicit `buildId` inputs (mocked `useRuntimeConfig`), not the ambient runtime value.
2. **Local prod build:** `pnpm build:alquilatucarro` → `/` prerenders `200`, exit 0, no "Exiting due to prerender errors".
3. **Stale-cross-build invariant (integration):** an entry stored under `escapeKey(buildIdA)` with a no-`faqs` body is *not* served to a request running under `buildIdB` (B≠A) — the handler runs a fresh fetch instead. This is the invariant that prevents the incident, and it is observable with the fix in place (no pre-fix code needed).
4. **Vercel preview deploy GREEN — the real reproduce→fix.** The branch base (main, pre-fix) deploys RED today because it restores #57's stale cache; the fix branch deploys GREEN against that *same* restored cache. This is the definition of done; the unit/integration tests are regression locks, not the proof.

**Toolchain note:** verification runs against the installed `nuxt@4.2.2` / `nitropack@2.12.9` / `@nuxt/schema@4.2.2` (stack.md still cites 4.1.3). The `getKey` option and `app.buildId` semantics are identical across these versions — confirmed against the installed source.

## Observable scenarios (holdout for SDD)

- **SCEN-C1** (unit): Given `useRuntimeConfig().app.buildId = X`, when `getKey(event)` runs, then it returns `X`; the same buildId yields the same key, and two distinct buildIds-as-used-here (UUIDs) yield distinct stored keys after Nitro's `escapeKey` (which is lossy in general — `replace(/\W/g, "")` — but injective for UUIDs given their entropy).
- **SCEN-C2** (integration): Given a cache entry stored under `escapeKey(buildIdA)` whose body lacks `faqs`, when the handler is invoked under `buildIdB` (B≠A), then that entry is not served — a fresh fetch runs and the response carries the current schema. (The end-to-end reproduce→fix is SCEN-C6.)
- **SCEN-C3** (build): Given a clean build, when prerendering all routes, then `/` is `200` and the build exits 0.
- **SCEN-C4** (build, fail-loud lock): Given a genuine Supabase fetch failure, when building, then the build aborts loud with `[rentacar-data] fetch failed:` and non-zero exit — unchanged from SCEN-003.
- **SCEN-C5** (single source): no per-brand `rentacar-data.get.ts` override exists; the handler lives only in the shared logic layer, so all 3 brands inherit the change via `extends`.
- **SCEN-C6** (deploy, end-to-end): Given the branch base deploys RED against #57's restored stale cache, when the fix branch is deployed, then its Vercel preview goes GREEN against that same restored cache. Verification captures *both* artifacts in the same window — the main/branch-base preview observed RED and the fix-branch preview observed GREEN — so the reproduce→fix is evidenced against an identical restored-cache baseline, not just the GREEN half.

## Known limitations

- `app.buildId` is constant in non-prod modes (`"dev"` in dev, `"test"` under Vitest) and a fresh `randomUUID()` per production build. So in **dev** the local `.nuxt` cache still persists across restarts (a dev-only convenience issue — clear `.nuxt/cache` or wait out the 1h `maxAge`), and **unit tests** must exercise the key logic with explicit `buildId` inputs rather than the ambient constant. The busting guarantee applies to production builds, which is exactly where the incident occurs.

## Follow-ups (not in this change)

- The broader cache strategy (shorter `maxAge`, tag-based invalidation from the admin write path) remains open in #7 and #16-F2; this fix does not address pricing-edit propagation latency.
- An immediate operational alternative — redeploy main with the build cache cleared — would also unblock production, but the code fix is self-unblocking on the next deploy and prevents recurrence, so a manual cache clear is unnecessary.
