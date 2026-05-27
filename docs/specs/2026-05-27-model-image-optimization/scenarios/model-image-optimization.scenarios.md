---
name: model-image-optimization
created_by: claude
created_at: 2026-05-27T00:00:00Z
issue: 48
---

# Model image optimization (#48)

Holdout for the post-search category-model images. Root cause (runtime-verified):
the model `<img>` (`Carrusel.vue`, `:src="item.image"`) points at an absolute
external Vercel Blob URL, and `@nuxt/image` has no `image.domains` entry for that
host, so the images bypass `/_vercel/image` and are served as raw ~412 KB JPEGs.
The optimizer itself works (same host is already in the `remotePatterns` allowlist):
`/_vercel/image?...&w=640&q=80` → `200 image/webp` ~45 KB.

The authoritative scenarios are runtime (preview deploy). SCEN-004 is a fast local
proxy. Blob host observed in prod: `9grznib0czdjtk77.public.blob.vercel-storage.com`
(shared across the 3 brands — `vehicle_categories` query is not franchise-scoped).

## SCEN-001: model image is served through the optimizer, not raw
**Given**: a user lands on a real results page (post availability search) on any brand preview (alquilatucarro / alquilame / alquicarros)
**When**: a category-model `<img>` (the `Carrusel` slide) renders
**Then**: its resolved `currentSrc` is a `/_vercel/image?url=…&w=…&q=80` URL — and is NOT a raw `https://<store>.public.blob.vercel-storage.com/….jpeg`
**Evidence**: agent-browser `currentSrc` of model `img` elements on a preview results URL; zero `currentSrc` matching the raw `*.blob.vercel-storage.com/*.jpeg` pattern

## SCEN-002: optimized variant is WebP
**Given**: the optimized model-image URL resolved in SCEN-001
**When**: fetched with header `Accept: image/avif,image/webp,*/*`
**Then**: HTTP `200` with `content-type: image/webp` and `cache-control` `max-age` ≥ 2678400
**Evidence**: `curl -sI` response headers of the rendered `currentSrc`

## SCEN-003: variant is right-sized and light
**Given**: a model card rendered at ~360–400 px width (lg grid, `grid-cols-3`) on a 2× DPR viewport
**When**: the browser selects the `srcset` candidate for the model image
**Then**: the served variant has width `≤ 768` and transferred size `≤ ~80 KB` (versus the ~412 KB raw JPEG baseline) — a ≥5× reduction
**Evidence**: `content-length` of the served `currentSrc` + its `w` query param

## SCEN-004: Blob host whitelisted in each brand's resolved Nuxt config
**Given**: each brand package (`ui-alquilatucarro`, `ui-alquilame`, `ui-alquicarros`)
**When**: the brand's Nuxt `image` config is resolved
**Then**: `image.domains` contains `9grznib0czdjtk77.public.blob.vercel-storage.com`
**Evidence**: brand config-hygiene unit test (pattern of `packages/ui-*/tests/*.test.ts`) asserting `image.domains` includes the host; fails before the fix, passes after

## SCEN-005: first card loads eagerly (LCP), the rest lazily
**Given**: a results page with ≥ 2 available category cards
**When**: inspecting the model `<img>` loading attributes across cards
**Then**: the FIRST card's first/visible model image has `loading="eager"` and `fetchpriority="high"`; every other model image has `loading="lazy"`
**Evidence**: agent-browser attribute capture (`loading`, `fetchpriority`) across the first card vs subsequent cards

## SCEN-006: local images keep working (no regression)
**Given**: the same preview results page
**When**: auditing every `<img>` `currentSrc` on the page
**Then**: local images (e.g. `/images/ciudades/chica.webp`) still resolve through `/_vercel/image` as webp (count ≥ the 7 observed pre-fix), AND the count of raw `*.blob.vercel-storage.com/*.jpeg` `currentSrc` is `0`
**Evidence**: agent-browser audit of `document.images` — `viaOptimizer` count for local images unchanged or higher, `rawBlob` count == 0
