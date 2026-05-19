# Implementation Plan — Image Optimization cost (rev2)

Spec: `docs/specs/2026-05-19-image-optimization-cost-design.md` (rev3, APPROVED)
Worktree: `../rentacar-web-img-cost` · branch `perf/image-optimization-cost`
Scenarios: SCEN-001..008b (in spec). Baseline: `main` 3d8c15b.

## Test-infra reality (rev2 — corrects rev1 false assumptions)

- Brand `server/**/__tests__` suites exist **only in `ui-alquilatucarro`**.
  alquilame/alquicarros have none.
- No brand `package.json` has a `test` script; vitest is hoisted at root.
  **Proven run command this session:**
  `pnpm --filter ui-alquilatucarro exec vitest run <paths>` (used for the
  blob-storage rename, 44/44).
- The `packages/ui-{brand}/tests/*.test.ts` convention is documented but
  **unrealized** — every real brand test is colocated under `__tests__/`.
- `~` alias differs per brand (alquilatucarro→root; others→`./app`).
- Production source (`blob-storage.ts`, `upload-image.post.ts`, etc.) is
  **byte-identical across the 3 brands** (verified during the #55 rename).

**Consequence:** all unit/config test evidence runs in the **alquilatucarro
vitest context**, colocated under `__tests__/`, alias-free (`fs`+`JSON.parse`
/ static reads). Cross-brand correctness is guaranteed by (a) asserting
byte-identity of the changed source files across brands, and (b) fs-reading
all 3 brands' static config files from the one suite.

## Chunk 1: File structure + steps

### File map

| File | Brands | Change | Responsibility |
|---|---|---|---|
| `server/utils/blob-storage.ts` | ×3 | edit | `uploadToStorage` optional 4th param `cacheControlMaxAge?: number` → forwarded to `put`. Omitted = unchanged. |
| `server/api/blog/upload-image.post.ts` | ×3 | edit | Pass `31536000` (1y) on image upload. |
| `server/api/blog/wordpress-sync.post.ts` | ×3 | unchanged | Regression guard: keeps 3-arg call (no TTL) for `.md`. |
| `vercel.json` | ×3 (new, package root) | new | Vercel Image Optimization allowlist. |
| `nuxt.config.ts` | ×3 | edit | Add `image.vercel.formats: ['image/webp']`. |
| `server/utils/__tests__/vercel-blob-storage.test.ts` | alquilatucarro | edit | SCEN-001/002 (put-args ±cacheControlMaxAge). |
| `server/api/blog/__tests__/upload-image.post.test.ts` | alquilatucarro | edit | SCEN-003. |
| `server/api/blog/__tests__/wordpress-sync.post.test.ts` | alquilatucarro | edit | SCEN-004 (regression: no TTL on `.md`). |
| `server/utils/__tests__/image-cost-config.test.ts` | alquilatucarro (new) | new | SCEN-005 + SCEN-006 + cross-brand byte-identity. Reads all 3 brands' `vercel.json` and `nuxt.config.ts` via `fs` (alias-free). |

### Prerequisites
- `pnpm install` in worktree — **DONE** (exit 0).
- Run command pinned: `pnpm --filter ui-alquilatucarro exec vitest run <paths>`.
- SCEN-008a only: `.env.prod` resolvable OR `--dotenv` override (pre-checked in Step 5).

### Steps (SDD: scenario → failing test → code → satisfy → refactor)

**Step 1 — `uploadToStorage` gains optional `cacheControlMaxAge` | S | deps: none**
Behavior: caller passes TTL → Blob `put` receives `{cacheControlMaxAge}`;
omitted → no such key (`.md` path byte-unchanged).
Acceptance (SCEN-001/002): in alquilatucarro `vercel-blob-storage.test.ts`
(mocked `@vercel/blob`): `uploadToStorage(d,p,ct,31536000)` ⇒ `put` 3rd arg
has `cacheControlMaxAge:31536000`; `uploadToStorage(d,p,ct)` ⇒ `put` 3rd arg
has NO `cacheControlMaxAge` key. Apply identical edit to all 3 brand
`blob-storage.ts`. Run: `pnpm --filter ui-alquilatucarro exec vitest run server/utils/__tests__/vercel-blob-storage.test.ts`.

**Step 2 — image uploads 1y TTL; posts unchanged | S | deps: Step 1**
Behavior: `upload-image.post` uploads images with `cacheControlMaxAge:31536000`;
`wordpress-sync` keeps `.md` with no TTL.
Acceptance (SCEN-003/004): `upload-image.post.test.ts` asserts storage call
carries `31536000`; `wordpress-sync.post.test.ts` asserts `.md` call carries
no `cacheControlMaxAge`. Edit applied to all 3 brands' `upload-image.post.ts`.

**Step 3 — per-brand `vercel.json` images allowlist | S | deps: none**
Behavior: each brand ships `packages/ui-{brand}/vercel.json` with the
approved `images` block (spec §4).
Acceptance (SCEN-005): new `image-cost-config.test.ts` `fs.readFileSync` +
`JSON.parse` each of the 3 `vercel.json`; `images` deep-equals
`{minimumCacheTTL:2678400, qualities:[80], formats:['image/webp'],
remotePatterns:[{protocol:'https',
hostname:'^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$'}]}`; compiled
`new RegExp(hostname)` matches `abc123.public.blob.vercel-storage.com`,
rejects `evil.com`.

**Step 4 — `image.vercel.formats` webp-only | S | deps: none**
Behavior: `@nuxt/image` Vercel provider restricted to webp in all 3 brands.
Acceptance (SCEN-006): in `image-cost-config.test.ts`, `fs`-read each brand
`nuxt.config.ts` and assert it contains the `vercel: { formats: ['image/webp'] }`
block under `image`. (Static source assertion — runtime optimizer behavior is
SCEN-008b's job; this scenario only fixes the declared config.)

**Step 5 — verification gate | M | deps: Steps 1–4**
5a. Pre-check: confirm deps installed (done) and resolve `.env.prod`
(or decide `--dotenv` override). If unresolved → SCEN-008a runs Plan-B path
or is recorded INSUFFICIENT with the blocker; do NOT burn a build blindly.
5b. SCEN-007: run the 4 affected alquilatucarro suites
(`vercel-blob-storage`, `upload-image.post`, `wordpress-sync.post`,
`image-cost-config`) → pass ≥ baseline; no test weakened (git-diff
reward-hacking check on test files).
5c. Cross-brand identity: assert the 3 `blob-storage.ts` and 3
`upload-image.post.ts` are byte-identical post-edit (guards drift; justifies
single-brand unit scope).
5d. SCEN-008a: with preconditions met,
`NITRO_PRESET=vercel pnpm --filter ui-alquilatucarro build` →
`packages/ui-alquilatucarro/.vercel/output/config.json` contains `images`
with `minimumCacheTTL:2678400` and `formats:['image/webp']`. If absent →
Plan B (`nitro.vercel.config.images` in `nuxt.config.ts`), rebuild, re-check.
Record outcome (success | Plan-B-applied | INSUFFICIENT-precondition).
5e. SCEN-008b: documented as deploy gate — verified on PR preview deploy
(`curl -sI -H 'Accept: image/avif' .../_vercel/image?url=<blob>&w=640&q=80`),
NOT closable pre-merge. Recorded INSUFFICIENT-until-deploy in the PR body.

### Rollout
- One PR `perf/image-optimization-cost → main`, 4-agent quality gate.
- Post-merge: trigger SCEN-008b on Vercel preview/production.
- Rollback: revert PR commit — config-only + optional param, no data
  migration, safe.
