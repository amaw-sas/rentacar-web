---
name: contact-fab-collapse
created_by: orchestrator
created_at: 2026-10-06T00:00:00Z
---

# Contact stack collapses back into a single launcher FAB

Context: since `19b386c` (PR #419) every contact channel is an always-visible
labeled button; PR #495 re-added «Llámanos», leaving a 3-row permanent stack
that covers the mobile hero. This restores the pre-July single launcher that
expands into the channel menu, on every viewport, in the 3 brands. Spec:
`../design.md`. "Gates" below = dashboard switches (`chatEnabled`,
`whatsappVisible`) and the stack-visibility rule
`(chatEnabled || whatsappVisible) && !hideContactButtons`.

## SCEN-01: collapsed by default — one button, no rows
**Given**: any page of any brand where the stack-visibility rule is true
**When**: the page loads (SSR + hydration settle)
**Then**: exactly one floating contact button renders (56 px, brand-primary circle, speech-bubble icon); no channel rows, no «Chat 24 horas / WhatsApp / Llámanos» labels are visible
**Evidence**: mounted DOM per brand (vitest) + 390 px screenshot per brand

## SCEN-02: tap opens the gated menu
**Given**: the collapsed launcher
**When**: the visitor taps it
**Then**: the menu (`#contact-fab-menu`) shows only gate-allowed channels (alquilame with WhatsApp off shows a one-item menu — accepted); the launcher becomes an X with `aria-expanded="true"`; a dimmed backdrop (`bg-black/50`) covers the page; the app root is NOT inert
**Evidence**: mounted DOM assertions per brand + embedded-browser click, screenshot

## SCEN-03: WhatsApp / Llámanos act and close the menu
**Given**: the open menu
**When**: the visitor taps WhatsApp or Llámanos
**Then**: the existing `wa.me` link / `tel:` href (Ads forwarding-aware via `useCallPhone`) fires unchanged; `teaser.engage` runs; the menu closes
**Evidence**: mounted DOM (hrefs + menu state after click) per brand; callForwarding guard stays green

## SCEN-04: Chat opens the panel anchored above the launcher
**Given**: the open menu on desktop (≥768 px)
**When**: the visitor taps «Chat 24 horas»
**Then**: the menu closes and the inline panel opens with `bottom` = launcher height + 24 + 12 px (92 px for the 56 px launcher; CSS fallback 5.75rem); `elementFromPoint` over the input's edge hits the input, not the launcher or a label. On mobile the same tap navigates to `/chat` and `menuOpen` is left false
**Evidence**: component test on the measured lift (jsdom synchronous measure pinned) + embedded-browser `elementFromPoint` check

## SCEN-05: Escape and backdrop close everything
**Given**: the open menu, or the open panel, or both states reachable in sequence
**When**: the visitor presses Escape or clicks the backdrop
**Then**: menu and panel close (`closeAll`) and the launcher returns to its collapsed state (bubble icon, `aria-expanded="false"`)
**Evidence**: mounted DOM per brand (keydown + backdrop click)

## SCEN-06: one badge, right place, never cleared by the menu
**Given**: real unread N>0 (with chat enabled) or synthetic teaser count M>0
**When**: the widget is collapsed / then the menu is opened
**Then**: collapsed → the launcher badges `badgeCount` (real wins; real never badges with chat off; `9+` cap). Menu open → the launcher badge hides (NOT cleared) and the count shows on the Chat option circle. Green 24/7 chip only when both counts are 0. Opening the menu alone never marks read
**Evidence**: component tests covering real/synthetic/chat-off matrix

## SCEN-07: teaser bubble vs menu
**Given**: the teaser fires with the widget collapsed
**When**: the bubble is visible / the menu is opened / the menu closes without engage
**Then**: bubble shows above the launcher and clicking it opens the chat directly (no menu); while the menu is open the bubble is hidden (`!menuOpen`); after closing the menu without engaging, the bubble can reappear (teaser timers untouched)
**Evidence**: component tests on `teaserOpen` behavior through the menu cycle

## SCEN-08: reservation overlay resets the menu, not the panel
**Given**: the menu is open (and separately: the panel is open)
**When**: the reservation overlay opens, then closes
**Then**: the stack re-appears with the launcher collapsed (no pre-opened menu); an open chat panel survives the overlay unchanged (today's behavior). `data-shift-left` stays DORMANT and source-guarded only (CSS extended to the launcher; no runtime assertion — see spec)
**Evidence**: component test toggling `reservationOverlayOpen`; shift guards green

## SCEN-09: gates off — nothing renders, no stale menu
**Given**: `chatEnabled` and `whatsappVisible` both off
**When**: the page loads / the gates turn off while the menu is open
**Then**: no launcher renders (same stack-visibility rule as today); when a channel later returns, the menu does not reappear pre-opened (`menuOpen` was reset by the single stack-hide watcher)
**Evidence**: component tests on the watcher; whatsappSchedule guard green

## SCEN-10: suites green with re-expressed guards
**Given**: the three brand packages and `packages/logic` after the change
**When**: the unit suite runs from the repo root
**Then**: every guard in the spec's blast-radius list passes re-expressed over the new mechanism (E10 parity, shift, clearance, a11y, callForwarding, teaser) — none deleted or weakened to pass
**Evidence**: full vitest output from the repo root (no filtered grep), typecheck + lint output
