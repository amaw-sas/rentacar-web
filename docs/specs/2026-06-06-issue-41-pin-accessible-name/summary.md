# Summary — Issue #41 pin accessible-name fix

**Goal**: the hero `<h1>` accessible name on every city landing is the visible
city title only, with the secret operator copy-to-WhatsApp action preserved as an
inert, customer-invisible pin.

**Root cause**: `UPageHero` renders the whole `#title` slot as `<h1>`. The
`<button aria-label="Copiar datos…">` wrapping the pin sat inside that slot, so
the accessible-name algorithm leaked the action label into the heading
(WCAG 2.5.3). `LocationIcon`'s SVG was already `aria-hidden`, so the button's
`aria-label`/`title` were the sole leak source.

**Fix**: replace the `<button>` with `<span aria-hidden="true"
@click="copySearchToWhatsapp">`. Inert (no cursor/hover/focus styles), not
focusable, no `aria-label`/`title`. Removed from the a11y tree → heading reverts
to city text only. Applied to all three franchise packages.

**Scenarios**: `scenarios/pin-accessible-name.scenarios.md` (SCEN-001..006).

**Verification**:
- Vitest source-shape (SCEN-006) — 3 packages.
- `/agent-browser` runtime: a11y snapshot of `<h1>` name, click→clipboard,
  axe-core (`nested-interactive`/`heading-order`/`aria-hidden-focus`), Tab-order,
  per brand (SCEN-001..005).

**Trade-off**: operator feature is mouse-only by design (hidden control, kept out
of the tab order).
