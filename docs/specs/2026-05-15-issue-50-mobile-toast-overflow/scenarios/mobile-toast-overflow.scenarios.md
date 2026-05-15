---
name: mobile-toast-overflow
created_by: sdd
created_at: 2026-05-15T00:00:00Z
---

# Issue #50 — Availability-searcher toast must respect the mobile viewport

Holdout contract. Write-once after first commit. Validated by runtime DOM
oracles via `/agent-browser` (no Vitest harness for the @nuxt/ui toaster).
Acceptance is delta-vs-baseline: project typecheck baseline is red (~1531
errors); console/network compared to the pre-fix capture, not absolute zero.

## SCEN-001: mobile toast stays inside the viewport (alquilatucarro @ 414px)
**Given**: alquilatucarro home open at viewport width 414px
**When**: the "está por fuera de la sede seleccionada" validation toast fires
  from the *Consulta disponibilidad y precios* searcher
**Then**: the toast `[data-slot="root"]` element satisfies, via
  `getBoundingClientRect()`: `left >= 0` AND `right <= window.innerWidth`,
  with left and right insets each `>= 16px`; AND
  `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal
  scrollbar appears)
**Evidence**: `/agent-browser` `browser_evaluate` JSON of
  `{ rootRect, innerWidth, docScrollWidth }` at 414px + screenshot

## SCEN-002: full toast content is readable, not clipped (alquilatucarro @ 414px)
**Given**: the toast from SCEN-001 is shown at 414px
**When**: it has fully rendered
**Then**: the toast root has `scrollWidth <= clientWidth` AND
  `scrollHeight <= clientHeight` (no content clipped on either axis under
  `overflow-hidden`); AND the description element's bounding rect is fully
  contained within the toast root's bounding rect (title + full description
  visible on every edge)
**Evidence**: `/agent-browser` `browser_evaluate` JSON of
  `{ root: {scrollWidth, clientWidth, scrollHeight, clientHeight}, descRect,
  rootRect }` + screenshot showing title + full message

## SCEN-003: mobile sizing holds across the ≤480px boundary (479px and 481px)
**Given**: alquilatucarro home at viewport width 479px, then again at 481px
**When**: the validation toast fires at each width
**Then**: all SCEN-001 oracles hold at BOTH 479px and 481px (both below the
  `sm` 640px breakpoint → mobile sizing must apply at each; discriminates a
  breakpoint bug from a content-overflow bug)
**Evidence**: `/agent-browser` `browser_evaluate` JSON for 479px and 481px
  (two captures) + two screenshots

## SCEN-004: desktop behaviour does not regress (alquilatucarro @ 1024px)
**Given**: alquilatucarro home at viewport width 1024px (≥ `sm` 640px)
**When**: a toast fires
**Then**: the toast root width equals `384px` (`w-96`, tolerance ±1px) AND it
  is horizontally centered (`abs(rootCenterX - window.innerWidth / 2) <= 1px`),
  matching the pre-fix desktop baseline captured before any code change
**Evidence**: pre-fix baseline JSON + post-fix `/agent-browser`
  `browser_evaluate` JSON of `{ rootRect, innerWidth }` at 1024px

## SCEN-005: fix holds for the other two brands (alquilame, alquicarros @ 414px)
**Given**: alquilame home at 414px, and alquicarros home at 414px
**When**: an equivalent validation toast fires on each brand
**Then**: SCEN-001 AND SCEN-002 oracles hold for alquilame AND for alquicarros
  (verified per brand via `/agent-browser`, not assumed from shared config)
**Evidence**: `/agent-browser` `browser_evaluate` JSON + screenshot per brand
  (two brands, two captures)
