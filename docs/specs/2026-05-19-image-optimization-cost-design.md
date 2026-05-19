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
      { "protocol": "https", "hostname": "^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$" }
    ]
  }
}
```
`hostname` is an **anchored PCRE-style regex**, the form shown in the
official Vercel Build Output API images-config example
(`"hostname": "^via\\.placeholder\\.com$"`, vercel.com/docs/build-output-api/configuration).
`vercel.json` `images` and Build Output API share the same `ImagesConfig`
type, so the regex form applies. The pattern matches any brand's Blob store
host (`<store-id>.public.blob.vercel-storage.com`, store-id = lowercase
alnum+hyphen) without hardcoding the id. `qualities:[80]` matches the single
`image.quality` already configured.

**Assumption (compounds the deploy gate below):** each Vercel project's
Root Directory must be `packages/ui-{brand}` for the per-package
`vercel.json` to be picked up. If the project root is the repo root, the
file is ignored *silently* (no build failure). Verify in the Vercel project
settings or via the deploy gate.

### 5. `nuxt.config.ts` `image`
Add provider-scoped `vercel: { formats: ['image/webp'] }`. This is the
@nuxt/image option that constrains the **Vercel optimizer** allow-list
(default is `image/webp` + `image/avif`) — confirmed in @nuxt/image docs
(`github.com/nuxt/image .../providers/vercel.md`). NOT `image.format`,
which only sets the `<NuxtPicture>` default and does NOT restrict the
optimizer (the blog renders `<NuxtImg>`). This is the **locally observable**
half of the only-webp goal (resolved Nuxt config / build artifact), distinct
from the deploy-gated `vercel.json`. `screens` (320–1280, 5 widths) kept
as-is: already bounded; reducing risks responsive quality without
proportional saving.

### Cost matrix (quantifies the saving)

Per source image, transformations billed = `widths × qualities × formats`
(× on each cache MISS/STALE). Before: 5 widths × 1 quality × up-to-2 formats
(webp+avif via `Accept` negotiation) = **up to 10**. After: 5 × 1 × 1 webp =
**5** → transformations and cache-writes ~halved. Independently, TTL goes
from default 1h (`minimumCacheTTL` 3600s) to 31d (config) / 1y (Blob images),
collapsing repeated STALE re-billing of the same variant.

## Open verification point (mostly closable at build; one true deploy gate)

Two distinct risks, deliberately separated:

1. **Build-time (SCEN-008a, locally closable):** does the Nitro Vercel
   preset emit our `images` config into `.vercel/output/config.json`?
   Run `nuxt build` and inspect the artifact — no deploy needed. Catches
   the Nitro-override risk early. Plan B if absent: move config to
   `nitro.vercel.config.images` in `nuxt.config.ts`, rebuild, re-check.
2. **Runtime (SCEN-008b, genuine deploy gate):** does the live optimizer
   actually serve webp-only with the long TTL? Only a preview deploy proves
   it:
   ```
   curl -sI -H 'Accept: image/avif' \
     'https://<preview>/_vercel/image?url=<blob-url>&w=640&q=80'
   ```
   Expect `content-type: image/webp` and `cache-control: …max-age=2678400…`.

The `image.vercel.formats` lever (Change §5) is independently observable in
the resolved Nuxt config (SCEN-006) with no build or deploy — it constrains
what `@nuxt/image` requests regardless of the optimizer-side config.

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

Unit (Vitest, mock `@vercel/blob`): SCEN-001–004. JSON parse + compiled-regex
match/no-match: SCEN-005. Resolved Nuxt config assertion: SCEN-006. Existing
suites delta-vs-baseline: SCEN-007. `nuxt build` + `.vercel/output/config.json`
inspection: SCEN-008a (locally closable, catches Nitro override). Deploy-gate
curl: SCEN-008b (INSUFFICIENT until preview deploy — the only scenario
explicitly out of local/CI closure).

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
  formats:['image/webp'], remotePatterns:[{protocol:'https',
  hostname:'^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$'}]}`. The
  hostname regex, compiled, matches a real Blob host
  (`abc123.public.blob.vercel-storage.com`) and rejects a foreign host
  (`evil.com`). Evidence: JSON.parse + deep assertion + `new RegExp()`
  match/no-match test.
- **SCEN-006** `image.vercel.formats` resolves to `['image/webp']` in each
  brand's Nuxt config (locally observable — the only-webp lever that does
  NOT need a deploy). Evidence: assert the value in the loaded
  `nuxt.config.ts` `image.vercel.formats`.
- **SCEN-007** storage + blog endpoint suites pass ≥ baseline (no test
  weakened). Evidence: vitest output baseline vs post.
- **SCEN-008a** (locally closable) after `nuxt build` (Vercel preset), the
  generated `.vercel/output/config.json` contains an `images` block with
  `minimumCacheTTL:2678400` and `formats:['image/webp']` (proves whether
  Nitro emitted/honored our config without a live deploy). Evidence: build,
  then read `.vercel/output/config.json`. If Nitro does NOT include it →
  trigger Plan B (move to `nitro.vercel.config.images`) and re-run.
- **SCEN-008b** (deploy gate — genuinely not local) preview
  `/_vercel/image?url=<blob>&w=640&q=80` with `Accept: image/avif` →
  `content-type: image/webp` and `cache-control` `max-age≥2678400`.
  Evidence: `curl -sI` vs preview URL. Status: INSUFFICIENT until preview
  deploy — the only scenario that cannot close in local/CI; 008a shrinks
  this risk by catching Nitro override at build time.
