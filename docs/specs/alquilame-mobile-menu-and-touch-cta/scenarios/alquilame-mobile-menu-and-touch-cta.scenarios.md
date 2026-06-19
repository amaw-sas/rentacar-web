---
name: alquilame-mobile-menu-and-touch-cta
created_by: pabloandi
created_at: 2026-06-19T00:00:00Z
---

# Alquilame — mobile menu visibility + touch CTA single-tap

Two high-severity dogfood findings on the new alquilame home:

- **ISSUE-001** — the mobile header menu (hamburger) icon renders white on a
  white header → invisible. Users can't discover navigation on mobile.
- **ISSUE-002** — the primary conversion CTAs ("Ver disponibilidad" modal on
  each fleet card + the FAQ accordion) use `hydrate-on-interaction`. On touch
  devices (no hover) the first tap is consumed by lazy hydration and opens
  nothing; only the second tap works.

Root causes, for reference (not part of the holdout):
- `packages/ui-alquilame/app/layouts/default.vue` — the `UHeader :toggle` is
  `color:'neutral', variant:'ghost'` with no text color, resolving to white.
  The sibling close button (`#body` slot) already overrides with `text-gray-*`.
- `packages/ui-alquilame/app/components/home/Fleet.vue` and
  `.../home/Faq.vue` — `hydrate-on-interaction` defaults to
  `pointerenter, click, focus`; touch never fires `pointerenter`.

---

## SCEN-001: mobile menu toggle icon is visible against the white header
**Given**: the home page is open on a mobile viewport (header background is white)
**When**: the page finishes loading and the user looks at the header
**Then**: the menu toggle icon renders in a dark color clearly distinct from the
white header background (computed icon color is NOT white / rgb(255,255,255);
it is a dark gray/near-black with usable contrast), so the menu button is
visibly discoverable without interaction
**Evidence**: computed `color` of the toggle's icon span ≠ `rgb(255, 255, 255)`;
annotated screenshot shows a visible hamburger icon in the header

## SCEN-002: a single tap opens the "Ver disponibilidad" city modal on touch
**Given**: the home page is open on a mobile (touch) viewport, the fleet section
has been scrolled into view, and no hover/pointerenter has occurred on the card
**When**: the user taps a card's "Ver disponibilidad" button exactly once
**Then**: the city-selection modal ("¿En qué ciudad deseas recoger tu carro?")
becomes visible — no second tap required
**Evidence**: a `[role=dialog]` / `[aria-modal=true]` element is present and
visible in the DOM after exactly one tap on a freshly loaded page

## SCEN-003: a single tap expands a FAQ answer on touch
**Given**: the home page is open on a mobile (touch) viewport and the FAQ section
has been scrolled into view, with no prior hover on the questions
**When**: the user taps a FAQ question exactly once
**Then**: that question's answer becomes visible (the trigger reports
`aria-expanded="true"` / `data-state="open"` and the answer text is rendered),
with no second tap required
**Evidence**: after one tap, the question button's `aria-expanded` is `"true"`
and the corresponding answer text is visible in the DOM

## SCEN-004 (regression sentinel): the fix mechanism stays in place
**Given**: the source of the three touched components
**When**: the build/test suite runs
**Then**: `Fleet.vue` and `Faq.vue` hydrate their interactive islands on
visibility (`hydrate-on-visible`), not on interaction; and the header `:toggle`
carries an explicit non-white text color class so the icon never reverts to
white-on-white
**Evidence**: static source guards in
`packages/ui-alquilame/tests/mobile-menu-touch-cta.test.ts` pass
