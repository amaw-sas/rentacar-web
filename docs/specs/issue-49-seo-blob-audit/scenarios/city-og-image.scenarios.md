---
name: issue-49-seo-blob-audit
created_by: pablo
created_at: 2026-06-12T00:00:00Z
issue: 49
---

# Issue #49 — SEO audit: Vercel Blob source impact on JSON-LD & og:image

Audit goal: confirm the model-image source cutover to Vercel Blob did not break
JSON-LD or og:image on indexable pages, and close the one actionable gap found
(city landing pages emit no `og:image`/`twitter:image`).

The fix lives in `packages/logic/src/composables/useCityPageSEO.ts`, so it
propagates to all three brands.

## SCEN-001: city landing page emits a social share image
**Given**: an indexable city landing page rendered by `useCityPageSEO` (e.g. `/bogota`)
**When**: the composable runs and the `<head>` meta is inspected
**Then**: `useSeoMeta` is called with both `ogImage` and `twitterImage` set to a
non-empty value (the brand's `franchise.ogImage`), so the page is no longer
shared image-less on social networks
**Evidence**: captured `useSeoMeta` payload (unit) + `<meta property="og:image">`
present in rendered HTML of `/bogota` (runtime curl)

## SCEN-002: the share image is a stable brand asset, never a volatile Blob model image
**Given**: the city page og:image
**When**: its content URL is inspected
**Then**: it resolves to the brand's own static asset (`/img/og-<brand>.jpg`,
absolutized by nuxt-seo to the brand `site.url`) and returns HTTP 200 — it must
NOT point to a `*.public.blob.vercel-storage.com` model image, so social caches
never break when the vehicle catalog churns
**Evidence**: og:image content host is the brand domain (not blob) + HEAD 200 on the asset

## SCEN-003: JSON-LD model images use the Blob source and resolve (regression guard)
**Given**: a live city page with available categories (`/bogota`)
**When**: the rendered `application/ld+json` graph is parsed
**Then**: each model `ImageObject` `contentUrl`/`url` points to
`*.public.blob.vercel-storage.com` and returns HTTP 200 with an `image/*`
content-type — the Blob cutover did not strand JSON-LD images
**Evidence**: ld+json ImageObject nodes from `/bogota` + HEAD 200 image/* on each sampled URL

## SCEN-004: no legacy image host survives the cutover (regression guard)
**Given**: rendered HTML of the home and a city page
**When**: scanned for legacy image hosts (firebasestorage, old CDNs) in image positions
**Then**: none are present; every image URL is either a same-origin brand asset
or the Vercel Blob CDN
**Evidence**: grep over rendered HTML returns zero legacy-host matches

## SCEN-005: existing per-brand og:image contract stays satisfied (regression guard)
**Given**: the three brands' home og:image (issue #108 holdout)
**When**: the existing `seo-og-image-per-brand` suite runs
**Then**: each brand still serves its own distinct, existing 1200×630 JPEG
**Evidence**: `pnpm --filter @rentacar-main/logic test` green for that suite
