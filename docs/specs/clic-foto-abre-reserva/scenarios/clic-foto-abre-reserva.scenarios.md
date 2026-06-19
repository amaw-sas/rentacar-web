---
name: clic-foto-abre-reserva
created_by: info@artesyweb.com
created_at: 2026-06-19T00:00:00Z
---

# Alquilame — clic/tap en la foto del vehículo abre la reserva

The vehicle photo in each category carousel becomes an actionable affordance:
activating it opens the reservation flow — the same `goNextStep` path already
wired to the "Solicitar este vehículo" button. The challenge is doing this on a
carousel: a tap must open, but a swipe (used to navigate slides) must not.

Touched component: `packages/ui-alquilame/app/components/Carrusel.vue`
(emits `select`). Consumers unchanged: `CategoryCard.vue` (`@select="goNextStep"`)
and `CategorySelectionSection.vue` (`select → slideoverOpen`).

Root causes addressed (from the pre-PR quality gate, not part of the holdout):
- The clickable wrapper was a plain `<div>` with `@click` only — no keyboard
  affordance (WCAG 2.1.1 failure on a now load-bearing CTA).
- `pointerStart` was never reset on a `pointerdown` that had no following
  `click` (`pointercancel`, swipe captured by the carousel, drag off the
  element), so a later stray click could be measured against stale coordinates.
- A `click` arriving with no recorded `pointerdown` fell through to an
  unconditional `emit('select')`.

---

## SCEN-001: a tap/click on the vehicle image opens the reservation
**Given**: a category card carousel is rendered and the user has not dragged the
slide (the pointer goes down and up within the swipe threshold, ≤ 10px movement)
**When**: the user taps/clicks the vehicle image exactly once
**Then**: the carousel emits `select`, which the parent maps to `goNextStep`
(the same handler as the "Solicitar este vehículo" button), opening the
reservation flow
**Evidence**: source guard — the slide wrapper binds `@click` to a handler that
calls `emit('select')` when pointer movement is within threshold; `Carrusel.vue`
declares `select` in `defineEmits`

## SCEN-002: a swipe on the image does NOT open the reservation
**Given**: a category card carousel is rendered
**When**: the user presses on the image and drags more than the swipe threshold
(> 10px in x or y) to navigate slides, then releases
**Then**: the reservation flow does NOT open — the movement is recognized as a
swipe and `select` is not emitted
**Evidence**: source guard — the click handler computes `dx`/`dy` from the
recorded `pointerdown` position and returns early (no emit) when either exceeds
the threshold constant

## SCEN-003: the image is operable by keyboard (Enter / Space)
**Given**: a keyboard-only or screen-reader user tabs to the vehicle image
**When**: the image wrapper receives focus and the user presses Enter or Space
**Then**: the reservation flow opens (the wrapper exposes a button role, is
focusable, carries an accessible name, and its key handler emits `select`); no
pointing device is required — satisfying WCAG 2.1.1 (Keyboard)
**Evidence**: source guard — the wrapper carries `role="button"`, `tabindex="0"`,
an `aria-label` bound to the model name, and `@keydown.enter`/`@keydown.space`
handlers that emit `select`

## SCEN-004: an abandoned pointer gesture cannot trigger a spurious open
**Given**: a `pointerdown` fired on the image but no matching `click` followed
(the carousel captured the swipe, the OS cancelled the gesture, or the drag
ended off the element)
**When**: a later `click` arrives that has no `pointerdown` of its own (e.g. the
recorded position was cleared, or a synthetic click)
**Then**: the reservation flow does NOT open — the handler treats a click with no
fresh recorded `pointerdown` as untrusted and does not emit; `pointercancel`
clears any recorded position so the next genuine tap is measured against its own
gesture
**Evidence**: source guard — `Carrusel.vue` binds `@pointercancel` to a reset of
the recorded position, and the click handler returns early when no position was
recorded (it does NOT emit unconditionally)

## SCEN-005 (regression sentinel): the behavior stays wired in source
**Given**: the source of `Carrusel.vue`
**When**: the build/test suite runs
**Then**: the slide wrapper keeps its button role + keyboard handlers, the swipe
threshold guard, the pointercancel reset, and the no-stale-click guard; and
`select` remains a declared emit
**Evidence**: static source guards in
`packages/ui-alquilame/app/components/__tests__/Carrusel.test.ts` pass
