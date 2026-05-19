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

Deployment note: no `ui-*/nuxt.config.ts` sets an explicit Nitro
`preset`. In production Vercel auto-selects the Nitro **vercel** preset via
`VERCEL=1` in its CI. Locally a bare `nuxt build` defaults to the
`node-server` preset and emits `.output/`, NOT `.vercel/output/config.json`.

Two distinct risks, deliberately separated:

1. **Build-time (SCEN-008a, locally closable WITH the preset forced):**
   does the Nitro Vercel preset emit our `images` config into
   `.vercel/output/config.json`? Closable locally only by forcing the
   preset, not via bare `nuxt build`:
   ```
   NITRO_PRESET=vercel pnpm --filter ui-alquilatucarro build
   # then inspect packages/ui-alquilatucarro/.vercel/output/config.json
   ```
   Preconditions: `pnpm install` done in the worktree, and a `.env.prod`
   present (the brand build script is `nuxt build --dotenv ../../.env.prod`)
   or the `--dotenv` path overridden. No live deploy needed. Catches the
   Nitro-override risk early. Plan B if the `images` block is absent: move
   config to `nitro.vercel.config.images` in `nuxt.config.ts`, rebuild,
   re-check.
2. **Runtime (SCEN-008b, genuine deploy gate):** does the live optimizer
   actually serve webp-only with the long TTL? Only a preview deploy proves
   it:
   ```
   curl -sI -H 'Accept: image/avif' \
     'https://<preview>/_vercel/image?url=<blob-url>&w=640&q=80'
   ```
   Expect `content-type: image/webp` and `cache-control: …max-age=2678400…`.

The `image.vercel.formats` lever (Change §5) is independently observable in
the resolved Nuxt config (SCEN-006) without a production build or deploy
(assert via `loadNuxtConfig` / the merged resolved config — needs deps
installed, but no `nuxt build`). It constrains what `@nuxt/image` requests
regardless of the optimizer-side config.

## Blast radius

~13 files: 3× `server/utils/blob-storage.ts`, 3×
`server/api/blog/upload-image.post.ts`, 3× `vercel.json` (new), 3×
`nuxt.config.ts`. Consumers: blog image render
(`NuxtImg :src="featuredPost.image"`), storage suite
`server/utils/__tests__/vercel-blob-storage.test.ts` (put-args assertion),
`server/api/blog/__tests__/upload-image.post.test.ts`.
`server/api/blog/wordpress-sync.post.ts` + its test are a regression guard
(must stay on the Blob default — no `cacheControlMaxAge`).

## Error handling

No new failure modes. `cacheControlMaxAge` is an optional passthrough; Blob
SDK validates (min 60s). Invalid `vercel.json` fails the Vercel build
loudly (fail-fast, desirable). Regex hostname mismatch → optimizer rejects
the source (404), caught by scenario 7.

## Testing strategy

Unit (Vitest, mock `@vercel/blob`): SCEN-001–004. JSON parse + JS-regex
match/no-match: SCEN-005. `loadNuxtConfig` resolved-config assertion:
SCEN-006. Existing suites delta-vs-baseline (`vercel-blob-storage.test.ts`,
`upload-image.post.test.ts`, `wordpress-sync.post.test.ts`): SCEN-007.
Forced-preset build (`NITRO_PRESET=vercel`) + `.vercel/output/config.json`
inspection: SCEN-008a (locally closable with preconditions, catches Nitro
override). Deploy-gate curl: SCEN-008b (INSUFFICIENT until preview deploy —
the only scenario explicitly out of local/CI closure).

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
  hostname regex, compiled with `new RegExp()`, matches a real Blob host
  (`abc123.public.blob.vercel-storage.com`) and rejects a foreign host
  (`evil.com`). Evidence: JSON.parse + deep assertion + JS-regex
  match/no-match test. Note: this validates the pattern's *intent* in the
  JS engine; Vercel compiles `hostname` server-side (Go RE2), so true
  matcher behavior is covered by SCEN-008b (runtime 200/404), not here.
- **SCEN-006** `image.vercel.formats` resolves to `['image/webp']` in each
  brand's merged Nuxt config — the only-webp lever observable without a
  production build or deploy. Evidence: `loadNuxtConfig` (or equivalent
  resolved-config read) asserting `image.vercel.formats` per brand.
  Precondition: deps installed.
- **SCEN-007** storage + blog endpoint suites pass ≥ baseline (no test
  weakened). Suites: `server/utils/__tests__/vercel-blob-storage.test.ts`,
  `server/api/blog/__tests__/upload-image.post.test.ts`,
  `server/api/blog/__tests__/wordpress-sync.post.test.ts` (alquilatucarro).
  Evidence: vitest output baseline vs post.
- **SCEN-008a** (locally closable only with the preset forced) running
  `NITRO_PRESET=vercel pnpm --filter ui-{brand} build` (preconditions:
  `pnpm install` done, `.env.prod` present or `--dotenv` overridden)
  produces `packages/ui-{brand}/.vercel/output/config.json` containing an
  `images` block with `minimumCacheTTL:2678400` and
  `formats:['image/webp']`. Bare `nuxt build` (node-server preset) does NOT
  emit this file — not a valid path for this scenario. Evidence: forced-
  preset build, then read `.vercel/output/config.json`. If the `images`
  block is absent → Plan B (move to `nitro.vercel.config.images`), rebuild,
  re-check.
- **SCEN-008b** (deploy gate — genuinely not local) preview
  `/_vercel/image?url=<blob>&w=640&q=80` with `Accept: image/avif` →
  `content-type: image/webp` and `cache-control` `max-age≥2678400`.
  Evidence: `curl -sI` vs preview URL. Status: INSUFFICIENT until preview
  deploy — the only scenario that cannot close in local/CI; 008a shrinks
  this risk by catching Nitro override at build time.
