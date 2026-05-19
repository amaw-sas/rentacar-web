---
name: image-optimization-cost
created_by: pablo-diaz
created_at: 2026-05-19T00:00:00Z
---

# Image Optimization cost — SDD holdout

Behavior contract. Unit/config evidence runs in the **alquilatucarro vitest
context** (`pnpm --filter ui-alquilatucarro exec vitest run <paths>`);
production source is byte-identical across the 3 brands (asserted by
SCEN-009). Baseline: `main` 3d8c15b.

## SCEN-001: uploadToStorage forwards cacheControlMaxAge when given
**Given**: `@vercel/blob` `put` is mocked
**When**: `uploadToStorage(buf, 'p', 'image/webp', 31536000)` is called
**Then**: `put` is invoked with an options object containing `cacheControlMaxAge: 31536000`
**Evidence**: vitest assertion on mocked `put` call args — `vercel-blob-storage.test.ts`

## SCEN-002: uploadToStorage omits cacheControlMaxAge when not given (regression)
**Given**: `@vercel/blob` `put` is mocked
**When**: `uploadToStorage(buf, 'p', 'text/markdown')` is called (3 args)
**Then**: `put` options object has NO `cacheControlMaxAge` key (Blob default preserved for `.md`)
**Evidence**: vitest assertion on mocked `put` call args — `vercel-blob-storage.test.ts`

## SCEN-003: image upload uses 1-year TTL
**Given**: blog image upload endpoint, storage mocked
**When**: a valid image is POSTed to `upload-image.post`
**Then**: the storage upload is invoked with `cacheControlMaxAge = 31536000`
**Evidence**: vitest assertion — `upload-image.post.test.ts`

## SCEN-004: post .md upload keeps Blob default (regression)
**Given**: wordpress-sync endpoint, storage mocked
**When**: a valid post is synced (writes `blog-posts/{franchise}/{slug}.md`)
**Then**: the storage upload is invoked WITHOUT any `cacheControlMaxAge`
**Evidence**: vitest assertion — `wordpress-sync.post.test.ts`

## SCEN-005: each brand vercel.json declares the images allowlist
**Given**: `packages/ui-{alquilatucarro,alquilame,alquicarros}/vercel.json`
**When**: each file is `fs`-read and `JSON.parse`d
**Then**: `images` deep-equals `{minimumCacheTTL:2678400, qualities:[80], formats:['image/webp'], remotePatterns:[{protocol:'https', hostname:'^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$'}]}`; and `new RegExp(hostname)` matches `abc123.public.blob.vercel-storage.com` and rejects `evil.com`
**Evidence**: vitest — `server/utils/__tests__/image-cost-config.test.ts`

## SCEN-006: each brand nuxt.config restricts the Vercel optimizer to webp
**Given**: `packages/ui-{brand}/nuxt.config.ts`
**When**: each file is `fs`-read
**Then**: it contains an `image` config with `vercel: { formats: ['image/webp'] }`
**Evidence**: vitest source assertion — `image-cost-config.test.ts` (runtime optimizer behavior is SCEN-008b, not here)

## SCEN-007: affected suites pass at/above baseline, no test weakened
**When**: the 4 alquilatucarro suites run (`vercel-blob-storage`, `upload-image.post`, `wordpress-sync.post`, `image-cost-config`)
**Then**: pass count ≥ baseline; `git diff` of test files shows no assertion weakened/skipped/deleted
**Evidence**: vitest output baseline vs post + git-diff reward-hacking check

## SCEN-008: production source byte-identical across brands (drift guard)
**When**: post-edit, compare the 3 `blob-storage.ts` and the 3 `upload-image.post.ts`
**Then**: each trio is byte-identical (justifies single-brand unit scope)
**Evidence**: `md5sum`/`diff` across the 3 brand paths

## SCEN-009a: Vercel build emits the images config (build gate, locally closable with preset)
**Given**: deps installed and `.env.prod` resolvable (or `--dotenv` overridden)
**When**: `NITRO_PRESET=vercel pnpm --filter ui-alquilatucarro build`
**Then**: `packages/ui-alquilatucarro/.vercel/output/config.json` contains an `images` block with `minimumCacheTTL:2678400` and `formats:['image/webp']`
**Evidence**: read `.vercel/output/config.json` after the forced-preset build. If absent → Plan B (`nitro.vercel.config.images`), rebuild, re-check. If preconditions unmet → recorded INSUFFICIENT with the blocker.

## SCEN-009b: live optimizer serves webp + long TTL (deploy gate — NOT local)
**Given**: a Vercel preview deploy of the branch
**When**: `curl -sI -H 'Accept: image/avif' '<preview>/_vercel/image?url=<blob>&w=640&q=80'`
**Then**: response `content-type: image/webp` and `cache-control` `max-age` ≥ 2678400
**Evidence**: curl response headers vs preview URL. Status: INSUFFICIENT until preview deploy — the only scenario not closable in local/CI; recorded as such in the PR.
