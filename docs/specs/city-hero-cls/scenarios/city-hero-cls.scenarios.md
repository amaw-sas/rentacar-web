---
name: city-hero-cls
created_by: pabloandi
created_at: 2026-07-01T12:00:00Z
---

# City / home hero CLS — reserve the image card height before utility CSS applies

Root cause (confirmed via Playwright layout-shift + boundingRect timeline, see
`reference_aspect_utility_not_in_critical_css_hero_cls`): the hero image card
reserves its height ONLY through the Tailwind `aspect-[x]` utility, whose rule is
NOT in Nuxt's inlined critical CSS (there is no `<link rel=stylesheet>`; the rest
of the CSS is JS-injected on hydration). When the card's media is `absolute
inset-0` (out of flow) it contributes no height, so pre-CSS the card computed
`aspect-ratio: auto`, height 0. When the late CSS applies, the card jumps to its
aspect height and shoves already-painted content down → CLS 0.839 on
`/{city}` (mobile). The fix reserves the box with an INLINE `aspect-ratio` on the
container so the height exists in the SSR HTML regardless of stylesheet timing.

## SCEN-CLS-01: hero image card reserves its 16:10 box before the utility stylesheet applies
**Given**: a mobile client loads the alquilame city landing `/bogota` with the JS-injected utility stylesheet blocked (no `<link rel=stylesheet>`, external CSS not yet applied)
**When**: the hero renders from the SSR HTML
**Then**: the vehicle-image card already occupies a non-zero 16:10 box (computed height > 0, ≈ card width × 10/16); it does NOT collapse to height 0 and later expand
**Evidence**: Playwright `getComputedStyle(card).aspectRatio` resolves to `16 / 10` (not `auto`) and `card.getBoundingClientRect().height > 0` while `document.querySelectorAll('link[rel=stylesheet]').length === 0`; the SSR HTML from `curl /bogota` shows an inline `style="aspect-ratio:16/10"` on the card container

## SCEN-CLS-02: city landing CLS is within Google's "good" threshold on mobile
**Given**: a mobile Lighthouse-style throttled load of `/bogota` where below-hero content paints before the late CSS
**When**: the page finishes loading
**Then**: cumulative layout shift is < 0.1 (regression from 0.839); the `#hero .grid` does not jump downward as the image card resolves
**Evidence**: Playwright `PerformanceObserver('layout-shift')` total (excluding `hadRecentInput`) < 0.1 under 4–6× CPU + slow-4G throttle, and the `#hero .grid` boundingRect top/height stays stable across the load timeline; Lighthouse mobile `cumulative-layout-shift` metric < 0.1

## SCEN-CLS-03: the fix preserves the hero visual and every existing hero invariant
**Given**: the alquilame city landing hero and its results-mode hero
**When**: rendered
**Then**: the image is still `object-cover` inside the rounded / ring / shadow 16:10 wrapper; the "Reservar ahora" CTA still navigates (SPA) to `/reservas`; results mode still mounts `<Searcher>` inside `<ClientOnly>` with its fixed-height (#109) guard; the red gradient, the #41 inert pin, the #searcher anchor, and the Date-free markup are unchanged
**Evidence**: the existing `packages/ui-alquilame/app/components/city/__tests__/Hero.test.ts` suite passes unchanged; the only DOM delta is the added inline `style` attribute on the card container

## SCEN-CLS-04: the alquilame home hero video card also reserves its 16:9 box pre-CSS
**Given**: the alquilame home hero (`components/home/Hero.vue`), whose `<video>` is in-flow but carries no width/height attributes, so pre-CSS it falls back to the 300×150 default and partially reserves the box (home CLS was 0.129, still over 0.1)
**When**: the hero renders from the SSR HTML with the utility stylesheet not yet applied
**Then**: the video card already occupies its 16:9 box (computed height ≈ width × 9/16), and home mobile CLS drops below 0.1
**Evidence**: SSR HTML from `curl /` shows an inline `style="aspect-ratio:16/9"` on the video card container; Playwright layout-shift total on `/` (mobile, throttled) < 0.1

## Out of scope (no bug — verified, not assumed)
- `ui-alquicarros/home/Hero.vue`: image is IN-FLOW (`w-full h-full`) WITH `width`/`height` attrs → the UA stylesheet reserves the ratio via presentation attributes before author CSS. Already CLS-safe.
- `ui-alquicarros/city/Hero.vue`: the landing branch is a lone CTA with no image card. No reservation to fix.
- `ui-alquilatucarro`: has no `home/Hero.vue` or `city/Hero.vue` (legacy `Hero/` sub-components); the pattern is absent.
