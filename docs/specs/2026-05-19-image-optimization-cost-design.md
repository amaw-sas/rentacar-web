# Image Optimization cost — design

Date: 2026-05-19
Branch: `perf/image-optimization-cost` (worktree, base `main` 3d8c15b)
Research base: `.research/vercel-blob-image-transform-costs/output.md`

## Problem

Vercel Image Optimization bills every cache MISS/STALE as a transformation
*and* a cache write (5K / 100K free per month respectively), plus Fast Data
Transfer + Edge Requests per delivery. The repo has **no `vercel.json`**, so
the optimizer runs on defaults: `minimumCacheTTL = 3600s (1h)`, no
`qualities`/`formats`/`remotePatterns` allowlist. Blog images are served as
remote images through `/_vercel/image` from `*.public.blob.vercel-storage.com`.
Cost driver = number of unique transformations (`width × quality × format ×
source URL`) and how often they go STALE.

## Decisions (user-approved)

- **TTL parametrizado por tipo.** `uploadToStorage` is shared by immutable
  images and mutable `.md` posts. Parameterize, don't blanket.
- **Solo webp.** `formats: ['image/webp']` — halves transformations/cache
  writes vs `avif+webp` (Accept negotiation would double them).

## Changes (per 3 brands: alquilatucarro, alquilame, alquicarros)

### 1. `server/utils/blob-storage.ts`
`uploadToStorage(data, path, contentType, cacheControlMaxAge?)` — optional 4th
param forwarded to `put(..., { cacheControlMaxAge })`. Omitted → unchanged
behavior (Blob default ~1 month). No change to other exports.

### 2. `server/api/blog/upload-image.post.ts`
Pass `cacheControlMaxAge: 31536000` (1 year). Safe: image filenames are
`${timestamp}-${md5}.webp` — unique/immutable, a new image is a new URL.

### 3. `server/api/blog/wordpress-sync.post.ts`
No change. `.md` posts (`blog-posts/{franchise}/{slug}.md`) keep the Blob
default; they are mutable (re-synced, `allowOverwrite:true`) and served SSR
with `Cache-Control: private, no-cache` (blog-cache-control middleware), so
CDN/transform caching does not apply to them.

### 4. New `packages/ui-{brand}/vercel.json` (×3)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "images": {
    "minimumCacheTTL": 2678400,
    "qualities": [80],
    "formats": ["image/webp"],
    "remotePatterns": [
      { "protocol": "https", "hostname": ".*\\.public\\.blob\\.vercel-storage\\.com" }
    ]
  }
}
```
Anchored-regex `hostname` (Build Output API images config syntax) covers each
brand's Blob store without hardcoding the store-id. `qualities:[80]` matches
the single `image.quality` already configured.

### 5. `nuxt.config.ts` `image`
Add `format: ['webp']` so `@nuxt/image` requests only webp, consistent with
`vercel.json`. `screens` (320–1280, 5 widths) kept as-is: already bounded;
reducing risks responsive quality without proportional saving.

## Open verification point (deploy gate — NOT locally closable)

Whether per-package `vercel.json images` is honored vs overridden by the
`.vercel/output/config.json` that the Nitro Vercel preset generates is not
documented with certainty (research confidence: Medium). Closes only on a
Vercel **preview deploy**:

```
curl -sI -H 'Accept: image/avif' \
  'https://<preview>/_vercel/image?url=<blob-url>&w=640&q=80'
```
Expect `content-type: image/webp` and `cache-control: …max-age=2678400…`.
**Plan B if Nitro overrides:** move the images config to
`nitro.vercel.config.images` in `nuxt.config.ts` (re-verify same way).

## Blast radius

~13 files: 3× `blob-storage.ts`, 3× `upload-image.post.ts`, 3× `vercel.json`
(new), 3× `nuxt.config.ts`. Consumers: blog image render
(`NuxtImg :src="featuredPost.image"`), storage unit suite (put-args
assertion), upload-image suite. `wordpress-sync` is a regression guard
(must stay default).

## Error handling

No new failure modes. `cacheControlMaxAge` is an optional passthrough; Blob
SDK validates (min 60s). Invalid `vercel.json` fails the Vercel build
loudly (fail-fast, desirable). Regex hostname mismatch → optimizer rejects
the source (404), caught by scenario 7.

## Testing strategy

Unit (Vitest, mock `@vercel/blob`): scenarios 1–4. JSON parse + assertion:
scenario 5. Existing suites delta-vs-baseline: scenario 6. Deploy-gate curl:
scenario 7 (INSUFFICIENT until preview deploy — explicitly out of local/CI
closure).

## Observable scenarios (SDD holdout)

- **SCEN-001** `uploadToStorage(d,p,ct,31536000)` → `put` called with
  `{cacheControlMaxAge:31536000}`. Evidence: unit test, mocked put args.
- **SCEN-002** `uploadToStorage(d,p,ct)` (no 4th arg) → `put` called WITHOUT
  `cacheControlMaxAge` key. Evidence: unit test, mocked put args.
- **SCEN-003** `upload-image.post` happy path → upload invoked with
  `cacheControlMaxAge=31536000`. Evidence: unit/integration test.
- **SCEN-004** `wordpress-sync` happy path → `.md` upload invoked WITHOUT
  `cacheControlMaxAge` (regression). Evidence: unit test.
- **SCEN-005** each `packages/ui-{brand}/vercel.json` parses as JSON and
  `images` = `{minimumCacheTTL:2678400, qualities:[80],
  formats:['image/webp'], remotePatterns:[host regex matching
  x.public.blob.vercel-storage.com]}`. Evidence: JSON.parse + deep assertion
  + regex match test.
- **SCEN-006** storage + blog endpoint suites pass ≥ baseline (no test
  weakened). Evidence: vitest output baseline vs post.
- **SCEN-007** (deploy gate) preview `/_vercel/image?...&w=640&q=80` with
  `Accept: image/avif` → `content-type: image/webp`,
  `cache-control max-age≥2678400`. Evidence: `curl -I` vs preview URL.
  Status: INSUFFICIENT until preview deploy — cannot close in local/CI.
