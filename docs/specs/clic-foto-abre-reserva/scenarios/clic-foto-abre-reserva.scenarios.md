---
name: clic-foto-abre-reserva
created_by: info@artesyweb.com
created_at: 2026-06-19T00:00:00Z
updated_at: 2026-06-19T00:00:00Z
---

# Alquilame — clic/tap en la foto del vehículo abre la reserva

The vehicle photo in each category carousel is an actionable affordance:
activating it opens the reservation flow — the same `goNextStep` path already
wired to the "Solicitar este vehículo" button. The challenge is doing this on a
carousel: a tap must open, but a swipe (used to navigate slides) must not.

Touched component: `packages/ui-alquilame/app/components/Carrusel.vue`
(emits `select`). Consumers unchanged: `CategoryCard.vue` (`@select="goNextStep"`)
and `CategorySelectionSection.vue` (`selected-category → slideoverOpen`).

## History — first attempt shipped broken (PR #199)

The first implementation tracked Pointer Events (`pointerdown`/`pointercancel`)
to measure a swipe threshold by hand. It did NOT work in a browser, and the only
tests were source-string matches, so the breakage shipped.

Root cause: `Carrusel.vue` mixed **Pointer Events** while Embla (UCarousel)
drives the carousel with **Touch/Mouse Events** and calls `preventDefault()` on
`touchmove`. That cancels the active gesture, so the browser fires
`pointercancel` on a *normal* tap; the handler cleared the recorded position and
the following `click` hit `if (!start) return` and never emitted `select`.

Fix: drop the pointer tracking entirely. A plain `@click` emits `select`; Embla
already swallows the post-swipe `click` in the capture phase (`preventClick` +
`stopPropagation` on the carousel root), so our handler only runs on a real tap.

---

## SCEN-001: a tap/click on the vehicle image opens the reservation
**Given**: a category card carousel is rendered and the user has not dragged the
slide
**When**: the user taps/clicks the vehicle image once
**Then**: the carousel emits `select`, which the parent maps to `goNextStep`
(the same handler as the "Solicitar este vehículo" button), opening the
reservation flow ("Resumen de la reserva")
**Evidence (runtime)**: mounting `Carrusel.vue` and triggering `click` on the
photo emits `select`
(`packages/ui-alquilame/app/components/__tests__/Carrusel.behavior.test.ts`);
end-to-end, the click opens the "Resumen de la reserva" slideover
(`e2e/clic-foto-abre-reserva.spec.ts`)

## SCEN-002: a swipe on the image does NOT open the reservation
**Given**: a category card carousel is rendered
**When**: the user presses on the image and drags to navigate slides, then
releases
**Then**: the reservation flow does NOT open — the gesture is a swipe and the
trailing `click` is suppressed by Embla, so `select` is not emitted
**Evidence (runtime)**: Embla cancels the post-drag `click` in the capture phase
(`preventClick` + `stopPropagation`); covered end-to-end as the swipe-navigates
path in `e2e/clic-foto-abre-reserva.spec.ts`

## SCEN-003: the image is operable by keyboard (Enter / Space)
**Given**: a keyboard-only or screen-reader user tabs to the vehicle image
**When**: the image wrapper receives focus and the user presses Enter or Space
**Then**: the reservation flow opens (the wrapper exposes a button role, is
focusable, carries an accessible name, and its key handler emits `select`);
no pointing device is required — satisfying WCAG 2.1.1 (Keyboard)
**Evidence (runtime)**: triggering `keydown` Enter and Space on the mounted
wrapper emits `select`, and the wrapper carries `role="button"`, `tabindex="0"`
and an `aria-label` bound to the model name (`Carrusel.behavior.test.ts`)

## SCEN-005 (regression sentinel): the broken pointer-tracking stays out
**Given**: the source of `Carrusel.vue`
**When**: the build/test suite runs
**Then**: the photo wrapper keeps its button role + `onActivate` wiring on
click/Enter/Space, `select` remains a declared emit, and the pointer-tracking
that broke the tap (`@pointercancel`, `onImageClick`, `SWIPE_THRESHOLD_PX`) is
NOT reintroduced
**Evidence**: static source sentinels in
`packages/ui-alquilame/app/components/__tests__/Carrusel.test.ts` pass
