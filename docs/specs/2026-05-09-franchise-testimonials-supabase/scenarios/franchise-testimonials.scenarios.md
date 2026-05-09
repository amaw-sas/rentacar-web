# Observable scenarios — franchise.testimonials → Supabase

These scenarios define "done". Each is observable from outside the code (HTTP response, rendered DOM, grep result, type check). Implementation must satisfy them without weakening the assertions.

## S1 — Endpoint shape

**Given** the Supabase project `ilhdholjrnbycyvejsub` with `franchises` containing 3 active rows (`alquicarros`, `alquilame`, `alquilatucarro`), each with `testimonials` populated with 6 valid items,
**when** any client requests `GET /api/rentacar-data` (cold or cached),
**then** the JSON response includes a top-level key `franchiseTestimonials` whose value is an object with exactly those 3 keys, and each value is a `Testimonial[]` of length 6 matching the shape `{ user: { name, description, avatar: { src, alt } }, quote }`.

## S2 — Reactive lookup by brand on home

**Given** a build of `ui-alquicarros` with `runtimeConfig.public.rentacarFranchise === 'alquicarros'`,
**when** a user navigates to `/`,
**then** the section `#testimonios` renders 6 `<article>` (or equivalent) testimonial cards, each containing a name, country/description, avatar `<img>`, and quote text — all sourced from `franchises.testimonials WHERE code = 'alquicarros'`.

## S3 — Brand isolation

**Given** the same build of `ui-alquicarros` from S2,
**when** the rendered HTML for `/` is inspected,
**then** no testimonial item references `alquilame` or `alquilatucarro` data (today identical content; assertion holds even when divergence is introduced future).

## S4 — Empty / missing testimonials does not crash

**Given** the same endpoint returns `franchiseTestimonials.alquicarros = []` (operator emptied the array, or row temporarily inactive),
**when** the user opens `/` on `ui-alquicarros`,
**then** the section `#testimonios` renders without runtime error, without infinite spinner, and without testimonial cards. The page above and below the section continues to render normally.

## S4b — Brand code not present in `franchiseTestimonials`

**Given** the endpoint returns `franchiseTestimonials` without a key matching `runtimeConfig.public.rentacarFranchise` (e.g. row deleted, code renamed in DB without redeploy),
**when** the user opens `/`,
**then** the section `#testimonios` renders empty (the `?? []` fallback engages), no runtime error is thrown, no `undefined.map` crashes Vue render. Same DOM outcome as S4.

## S5 — Malformed JSONB entries are filtered

**Given** the operator inserts via SQL a 7th item missing `quote`, or with `name` longer than 120 chars,
**when** the endpoint serves `franchiseTestimonials`,
**then** that entry is dropped (`parseTestimonials` filter), the remaining valid entries pass through, and the array length reflects only valid items. No 500 from the endpoint.

## S6 — Stuffing cap

**Given** the operator inserts an array of 50 testimonial items,
**when** the endpoint serves `franchiseTestimonials`,
**then** the response array is truncated to ≤ 12 items (slice cap inherited from `parseTestimonials`).

## S7 — No leftover hardcoded testimonials

**Given** the post-merge state of the worktree-issue-11 branch,
**when** running `grep -rE "franchise\.testimonials|testimonials:\s*\[" packages/ui-*/app/app.config.ts`,
**then** the command returns no match.

## S8 — Type safety end-to-end

**Given** the consumer code `const testimonios = useFetchRentacarData().franchiseTestimonials[brandCode] ?? []`,
**when** TypeScript checks the project (`tsc --noEmit` or Nuxt type check),
**then** `testimonios` is inferred as `Testimonial[]`, and `franchiseTestimonials` is `Record<string, Testimonial[]>`. No `any` introduced.

## S9 — Dashboard backwards compatibility

**Given** the rentacar-dashboard project that already reads `franchises.*`,
**when** the `testimonials` column is added with `DEFAULT '[]'`,
**then** existing `SELECT * FROM franchises` queries in the dashboard continue to return all expected columns plus the new one with default `[]` for any row pre-backfill (no row exists pre-backfill in this migration; assertion is forward-looking for future inserts).

## S10 — Cold start sentinel safety

**Given** the Nuxt plugin `rentacar-data.ts` has not yet populated `useState('rentacar-data')` (e.g., during very early SSR boundary or transient null state),
**when** `useFetchRentacarData()` is called,
**then** it returns the frozen sentinel that includes `franchiseTestimonials: {}` so consumer code `?.[brandCode] ?? []` never throws.

## S11 — Editorial latency due to ISR cache

**Given** an operator updates `franchises.testimonials` for `alquicarros` via the dashboard at time T,
**when** an end user requests `/` at any time T+Δ where Δ < 1h,
**then** the home may continue to render the previous testimonials until the `defineCachedEventHandler({ maxAge: 3600 })` window expires. This is documented intentional behavior matching `cities.testimonials` — surfaced here so it cannot be misread as a bug. Future tag-based invalidation tracked by the existing TODO at `packages/logic/server/api/rentacar-data.get.ts:54-58`.

## S12 — Inactive franchise → silent empty testimonials

**Given** an operator sets `franchises.status = 'inactive'` for an existing brand `code` (e.g. for maintenance),
**when** the endpoint refreshes (next cache regen) and the brand site is still being served from a deployment built before status flipped,
**then** the endpoint omits the inactive row (`.eq('status','active')` filter) and the home for that brand renders the section empty. This is intentional symmetry with cities/categories which apply the same filter; and harmless in practice because flipping `status='inactive'` is operationally tied to deactivating the brand site at the deploy layer. If the operator wants testimonials to remain visible while marking the franchise inactive, they should use a different mechanism (e.g. status='active' + a future `is_visible` flag).

## Non-scenarios (explicitly out of scope)

- Editing UI for testimonials in `rentacar-dashboard` (separate PR / separate repo).
- Per-city brand testimonials (those live on `cities.testimonials` from #6).
- Performance regression assertions beyond "endpoint adds at most 1 query" — covered indirectly by S1 (single roundtrip).
- Google Maps Reviews integration (future replacement, not this PR).
