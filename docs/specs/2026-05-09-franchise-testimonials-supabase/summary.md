# Summary — issue #11: franchise.testimonials → Supabase

**Date**: 2026-05-09
**Issue**: [#11](https://github.com/amaw-sas/rentacar-web/issues/11)
**Depends on**: #6 (CLOSED 2026-05-04)

## TL;DR

Move 6 hardcoded brand testimonials from `packages/ui-{brand}/app/app.config.ts` (byte-identical across the 3 brands) to a new `franchises.testimonials jsonb` column. Reuse the exact pattern set by #6 for `cities.testimonials`. One migration, one new transformer, one new field on `ReservasApiData`, three `index.vue` edits, three `app.config.ts` deletions.

## What changes

- **DB**: `franchises` gains `testimonials jsonb NOT NULL DEFAULT '[]'`. 3 rows backfilled with the array from `ui-alquicarros`.
- **Server**: `/api/rentacar-data.get.ts` adds a 5th parallel query to `franchises` and returns `franchiseTestimonials: Record<code, Testimonial[]>`.
- **Type**: `ReservasApiData` gets `franchiseTestimonials` field.
- **Client**: each `pages/index.vue` reads from `useFetchRentacarData()` keyed by `useRuntimeConfig().public.rentacarFranchise`.
- **Cleanup**: `franchise.testimonials` deleted from the 3 `app.config.ts`.

## What does NOT change

- Other `franchise.*` fields in `app.config.ts` (title, description, ogImage, phone, etc.) — out of scope.
- Markup of the `<UPageSection id="testimonios">` block.
- `Testimonial` type definition (already extracted by #6).
- `parseTestimonials` / `testimonialSchema` (reused as-is).
- RLS policies (existing `"Anon can read franchises" USING (true)` covers the new column).
- ISR cache strategy (1h `defineCachedEventHandler` — same TODO as cities).

## Verification at completion

- 3 brands' homes render the 6 testimonials end-to-end (e2e screenshot).
- `grep -r "franchise.testimonials\|franchise\.testimonials" packages/ui-*` returns empty.
- `useFetchRentacarData().franchiseTestimonials.alquicarros.length === 6`.
- Type check passes across all 3 ui-* packages.
- Endpoint returns the new field with valid `Testimonial[]` shape per brand.

## Source of truth for the migration

- DB project: `ilhdholjrnbycyvejsub` (rentacar-dashboard production)
- Migration: `add_franchises_testimonials_jsonb` (applied 2026-05-09)
- Backfill array: extracted byte-for-byte from `packages/ui-alquicarros/app/app.config.ts:80-153`
