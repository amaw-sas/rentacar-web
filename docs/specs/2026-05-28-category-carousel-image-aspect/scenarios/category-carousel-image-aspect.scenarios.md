---
name: category-carousel-image-aspect
created_by: claude
created_at: 2026-05-28T00:00:00Z
issue: 75
---

# Category carousel image aspect ratio (#75)

Holdout for the post-search category-model carousel. Root cause (code-verified):
the model `<img>` (`Carrusel.vue`, `:src="item.image"`) carries only `class="w-full"`.
With width pinned to 100% and no explicit `aspect-ratio`, the UA rule
`aspect-ratio: auto 800/480` resolves to each file's **intrinsic** ratio once it
loads (the `800/480` is only a pre-load fallback; Tailwind Preflight `img { height:auto }`
neutralizes the height attribute). Model photos arrive with differing intrinsic
ratios, so each card's image area renders at a different height. The carousel
pagination dots (`bottom-5`, absolute to the viewport) then land at different
offsets card-to-card and the grid looks broken.

Fix: pin a fixed `aspect-[5/3]` box (= the declared `800×480`) plus `object-cover`.
Component is triplicated, so the guarantee holds in all 3 brands.
`5/3` (not `16/10`) is the declared `width/height`, so a correctly authored photo
is cropped by ~nothing.

## SCEN-001: every model image renders at a fixed 5/3 box
**Given**: a results page (post availability search) on any brand with ≥1 available category card
**When**: each category-model `<img>` (a `Carrusel` slide) renders
**Then**: its rendered box `height / width` ≈ `3/5` (0.6 ± 0.02), independent of the source file's intrinsic ratio
**Evidence**: agent-browser `getBoundingClientRect()` ratio of `.carrusel img` elements

## SCEN-002: image heights are equal across cards
**Given**: a results page with ≥2 available category cards in the same grid row
**When**: comparing the first model image height of each card
**Then**: all heights are equal (±1px) — the cards line up
**Evidence**: agent-browser bounding-box height of the first `.carrusel img` per `.categoria`

## SCEN-003: pagination dots align across cards
**Given**: the same multi-card results grid
**When**: comparing the carousel pagination dots' vertical position across cards
**Then**: the dot rows sit at the same offset from each card's top
**Evidence**: agent-browser bounding-box `top` of each carousel's dots container

## SCEN-004: the vehicle stays visible (no mutilating crop)
**Given**: a model photo authored at ~5/3 on a white studio background
**When**: rendered with `object-cover` inside the `aspect-[5/3]` box
**Then**: the vehicle remains visible and centered — `object-cover` at the matching ratio trims ~nothing
**Evidence**: agent-browser screenshot of the results grid, visual check

## SCEN-005: the fixed-box guarantee is locked in source (all 3 brands)
**Given**: each brand's `app/components/Carrusel.vue`
**When**: the model `<NuxtImg>` class attribute is inspected
**Then**: it contains `aspect-[5/3]`, `object-cover` and `w-full`, and keeps `width="800"`/`height="480"`
**Evidence**: source-string unit test `app/components/__tests__/Carrusel.test.ts` per brand — RED before the fix, GREEN after

## SCEN-006: no regression of the #48 optimization guarantees
**Given**: the same `Carrusel.vue`
**When**: the existing `model-image-optimization.test.ts` runs and the page loads
**Then**: `sizes` shorthand, `width/height`, and eager/lazy priority are unchanged; zero blocking console errors on the results page
**Evidence**: `model-image-optimization.test.ts` still green + agent-browser console capture
