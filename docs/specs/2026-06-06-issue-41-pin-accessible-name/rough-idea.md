# Issue #41 — pin button inside `<h1>` contaminates the heading's accessible name

## Problem

PR #40 moved the "copy search params for WhatsApp" trigger onto the `LocationIcon`
(pin) next to the city name. That pin lives inside `UPageHero`'s `#title` slot,
which Nuxt UI renders as `<h1>`. The wrapping `<button>` carries
`aria-label="Copiar datos de búsqueda para WhatsApp"`, and the WAI-ARIA
accessible-name algorithm walks the heading subtree — so the action label leaks
into the `<h1>`'s accessible name:

```
heading "ALQUILER DE CARROS EN BOGOTÁ Copiar datos de búsqueda para WhatsApp COLOMBIA" [level=1]
```

This violates WCAG 2.5.3 (Label in Name) and pollutes the primary screen-reader
navigation pattern (heading rotor) on SEO-critical city landings.

## Decisive constraint (from operator)

The pin's copy action is **secret — for operators, not customers**. So the fix
must NOT add any customer-visible label, button, or tooltip. The current
`aria-label` and `title="Copiar datos de búsqueda para WhatsApp"` both leak the
secret (the `title` shows a tooltip to any hovering customer; the `aria-label`
announces it to AT users) — both must go.

## Chosen approach (user-approved)

**Inert decorative pin.** Replace the `<button aria-label … title …>` wrapper
with a non-focusable `<span aria-hidden="true" @click="copySearchToWhatsapp">`:

- `<span>` not `<button>` → not focusable, so `aria-hidden` is valid (a focusable
  `aria-hidden` element is itself an axe `aria-hidden-focus` violation).
- `aria-hidden="true"` → removed from the accessibility tree → contributes the
  empty string to the `<h1>` name computation. `LocationIcon` is already
  `aria-hidden` on its SVG, so the heading reverts to city text only.
- No `aria-label`, no `title` → secret no longer leaks.
- No `cursor-pointer` / `hover:scale` / `focus-visible` → visually inert; the pin
  looks 100% decorative. Operators who know it's there click it (mouse only).

Applied identically to all three franchise packages
(`ui-alquicarros`, `ui-alquilame`, `ui-alquilatucarro`).

## Scope

- 3 × `app/components/CityPage.vue` — `#title` slot.
- 3 × `app/components/__tests__/CityPage.test.ts` — source-shape tests that
  currently pin the `<button>` + `aria-label` inside `#title`; rewritten to fix
  the new inert-span shape.
- No shared components, no API/data changes.

## Trade-off accepted

The operator feature is mouse-only (no keyboard activation). This is intentional:
a deliberately hidden control is consistent with mouse-only access and avoids
exposing it in the keyboard tab order. Customer-facing keyboard accessibility of
the `<h1>` and page is unaffected.
