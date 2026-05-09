# Implementation plan — issue #11

Ordered, each step has acceptance. Worktree: `worktree-issue-11-franchise-testimonials` on branch `worktree-issue-11-franchise-testimonials` (off `main` @ `46ea21f`).

## Step 0 — Migration applied (DONE before plan)

- `apply_migration` on project `ilhdholjrnbycyvejsub`, name `add_franchises_testimonials_jsonb`.
- Backfill UPDATE on the 3 brands.
- Verification: `SELECT code, jsonb_array_length(testimonials)` returns 3 rows × 6.

**Status**: ✅ Applied 2026-05-09.

## Step 1 — Type: extend `ReservasApiData`

**File**: `packages/logic/src/utils/types/data/ReservasApiData.ts`
**Change**: import `Testimonial`, add `franchiseTestimonials: Record<string, Testimonial[]>` field.
**Acceptance**: `tsc --noEmit` in `packages/logic` shows new field; no other type errors.

## Step 2 — Sentinel: extend `useFetchRentacarData` + update its test

**Files**:
- `packages/logic/src/composables/useFetchRentacarData.ts`
- `packages/logic/src/composables/__tests__/useFetchRentacarData.test.ts`
**Change**:
- Sentinel: add `franchiseTestimonials: Object.freeze({}) as Record<string, Testimonial[]>` to `EMPTY_SENTINEL`.
- Test (line 27-33): the exhaustive `toEqual({...})` assertion must include the new key `franchiseTestimonials: {}`. Without this update the test fails — Step 1+2 would otherwise be a build-breaking commit.
**Acceptance**: type check passes; updated test passes; populated-state test continues to pass (it uses partial shape).

## Step 3 — Transformer: `transformFranchiseTestimonials`

**File**: `packages/logic/server/utils/transformers.ts`
**Change**: add `interface SupabaseFranchise { code: string; testimonials: unknown }` and `export function transformFranchiseTestimonials(rows: SupabaseFranchise[]): Record<string, Testimonial[]>` reusing existing `parseTestimonials`.
**Acceptance**:
- New unit test in `__tests__/transformers.test.ts` covering: 3 brands → 3 keys, malformed entries dropped, slice cap of 12 honored, empty array OK.
- Existing transformer tests still pass.

## Step 4 — Endpoint: extend `/api/rentacar-data.get.ts`

**File**: `packages/logic/server/api/rentacar-data.get.ts`
**Change**: add 5th parallel query `supabase.from('franchises').select('code, testimonials').eq('status','active').order('code')`. Add error guard. Return `franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data)`.
**Acceptance**:
- Curl/fetch hit on dev server returns the new key with 3 brands × 6 testimonials each.
- Existing endpoint tests (if any) updated; no regression.

## Step 5 — Consumer: `pages/index.vue` × 3

**Files**: `packages/ui-{alquicarros,alquilame,alquilatucarro}/app/pages/index.vue`
**Lines** (verified via grep, not assumed):
- `ui-alquicarros/app/pages/index.vue:320`
- `ui-alquilame/app/pages/index.vue:320`
- `ui-alquilatucarro/app/pages/index.vue:323`
**Change**: replace the line `const testimonios: Testimonial[] = franchise.testimonials;` with a reactive lookup:
```ts
const brandCode = useRuntimeConfig().public.rentacarFranchise as string;
const { franchiseTestimonials } = useFetchRentacarData();
const testimonios = computed<Testimonial[]>(() => franchiseTestimonials[brandCode] ?? []);
```
Reasoning: `computed` rather than plain `const` defends against transient null/sentinel→populated transitions during dev HMR or any future Suspense boundary. Cost is negligible; aligns with how other reactive lookups consume the bundle.
**Acceptance**:
- Dev server for each brand renders the 6 testimonials in `#testimonios` (manual verification with `agent-browser`).
- No console errors, no failed network requests.

## Step 6 — Cleanup: `app.config.ts` × 3

**Files**: `packages/ui-{alquicarros,alquilame,alquilatucarro}/app/app.config.ts`
**Change**: delete the `testimonials: [...]` block (lines 80-153 in `ui-alquicarros`; equivalent block in the others). Leave the rest of `franchise.*` intact.
**Acceptance**: `grep -rE "franchise\.testimonials|testimonials:\s*\[" packages/ui-*/app/app.config.ts` returns empty.

## Step 7 — E2E spec

**File**: `e2e/franchise-testimonials.spec.ts` (new, mirroring pattern of `e2e/cities-content.spec.ts`)
**Coverage**:
- Visit `/` on the dev server for one brand; assert 6 testimonial cards rendered with names/quotes from the DB.
- Optional: set `franchiseTestimonials = []` via DB stub and assert empty section without crash (skip if too brittle).
**Acceptance**: spec runs and passes locally.

## Step 8 — Verification gate

Per `<workflow>` in CLAUDE.md, before commit/PR:
- `pnpm typecheck` per ui-* package — pass.
- `pnpm test` for `packages/logic` — pass.
- `agent-browser` runtime check on each of 3 ui-* dev servers — testimonios rendered, zero console errors, zero failed requests.
- `dogfood` exploratory pass — at least 1 broken-state and 1 happy-state observed.
- Confirm `grep` cleanup assertion (Step 6 acceptance).
- Spec scenarios (S1-S10) one-by-one verified observable.

## Step 9 — Commit + PR

- Single commit per logical step where possible (types → transformer → endpoint → consumer → cleanup → e2e), or fewer if it ships cleaner.
- PR body: link issue #11, link this design doc, link the migration record, summary of scenarios verified.
- No `git push` until user authorizes (per `<constraints>`).
