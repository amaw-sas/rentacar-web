# Collapse the contact stack back into a single FAB

Date: 2026-10-06. Scope: `ChatWidget.vue` in the three brand packages
(`ui-alquilatucarro`, `ui-alquicarros`, `ui-alquilame`), `chatPanelLift.ts`,
and their tests.

## Why

Since commit `19b386c` (PR #419, 2026-07-27) every contact channel renders as
its own always-visible labeled button. PR #495 (2026-09-23) added «Llámanos»
back, so alquilatucarro and alquicarros now stack three permanent rows
(Chat 24 horas, WhatsApp, Llámanos) plus labels on mobile — roughly the bottom
third of a phone viewport, covering the hero content (owner complaint,
screenshot 2026-10-06). Before `19b386c` a single launcher FAB expanded into
the channel menu. This change restores that launcher on every viewport size.

The July change was deliberate (zero-friction access to WhatsApp/phone) but
shipped with no measurement. Restoring the launcher adds one tap before any
contact action; if contact volume drops afterwards, this is the first suspect.
Measuring contact volume is out of scope — ticket it separately so the warning
isn't lost (owner decides).

## Design

Modify the current `ChatWidget.vue` in place (do NOT revert to the pre-July
file — everything that landed since must survive). `19b386c`'s diff is the
reference for what to re-add. Brand-local deltas are preserved as-is: each
brand keeps its own `.fab-chat` colors (alquilame's white-on-primary circle),
its channel rows (alquilame has no Llámanos row today and still won't), and
its layer classes.

### Launcher FAB (restored)

- One 56 px (`w-14 h-14`) round button, brand primary (`bg-primary`), white
  speech-bubble icon; becomes an X while the menu or the chat panel is open.
  Placed at the bottom of the stack, after the `<ul>` (pre-July DOM order;
  tab order menu-items-then-launcher is the certified old behavior and is
  kept). The 48 px channel circles right-align with it via the stack's
  existing `items-end`; no new alignment CSS.
- `menuOpen` ref (client-only, starts collapsed). Tap: if `panelOpen`, close
  the panel; else toggle `menuOpen`.
- `animate-pulse-attention` plays only while collapsed (`!menuOpen &&
  !panelOpen`) and badge-free (existing keyframes).
- Launcher badge: `badgeCount = (chatEnabled && unread > 0) ? unread :
  displayedSyntheticCount` — the pre-July rule. Real unread never badges when
  the dashboard has chat off; `displayedSyntheticCount` is already gated on
  `chatEnabled` via `teaserAllowed`. `9+` cap. Badge renders only while
  collapsed (`!menuOpen && !panelOpen`) — hidden, not cleared, when open.
- Count destination while the menu is open: the Chat option circle, exactly
  as the current `<ul>` markup already does (real unread wins over synthetic
  there too). There is no WhatsApp fallback: synthetic counts cannot exist
  with chat off, so the only badge-able option is Chat. The 24/7 green chip
  on the Chat circle keeps today's rule (shows only when both counts are 0).
- A11y: `aria-expanded="menuOpen"`, `aria-controls="contact-fab-menu"`,
  `aria-label` = «Cerrar» when menu/panel open, else «Abrir opciones de
  contacto» + « (N mensaje(s) nuevo(s))» when `badgeCount > 0` (pre-July
  strings). Focus stays on the launcher across open/close — opening the menu
  moves no focus; Escape closes and focus remains where it was. The panel
  keeps its existing focus/inert handling untouched.

### Channel menu

- The existing `<ul>` becomes `v-show="menuOpen"` with
  `id="contact-fab-menu"`; rows keep their current markup and gating
  (Chat: `chatEnabled`; WhatsApp: `whatsappVisible`; Llámanos: `tel:` from
  `useCallPhone()`, Ads forwarding untouched). No open/close transition
  (pre-July had none).
- Selecting ANY option closes the menu: `openChat` sets `menuOpen = false`,
  and the WhatsApp/Llámanos anchors do the same in their `@click` (alongside
  the existing `teaser.engage` calls). Opening the menu alone is NOT an
  engage.
- One-row menus are accepted: when gates leave a single channel (alquilame
  with WhatsApp off, or chat-off brands), the launcher still opens a one-item
  menu. Uniform behavior beats a direct-action special case whose trigger
  (dashboard switches, schedules) changes at runtime.
- Backdrop: `v-if="menuOpen || (chatEnabled && panelOpen)"`, keeping today's
  dimmed styling (`bg-black/50 backdrop-blur-sm`) — the pre-July certified
  look. Click runs `closeAll()` (menu + panel). Background `inert` stays
  panel-only: the menu is a dismiss-layer pattern (dimmed, click-to-close),
  not a modal.
- Escape runs `closeAll()`. Note: `closeAll` is a NEW helper
  (`menuOpen = false` + the existing `closePanel`) — today's widget only has
  `closePanel`.

### State resets

| Event | Effect |
|---|---|
| Reservation overlay opens (`hideContactButtons` true) | `menuOpen = false` — the stack unmounts; without this the menu would reappear pre-opened when the overlay closes. The PANEL is untouched: it lives outside the stack and today survives the overlay — keep that behavior. While the panel outlives an unmounted launcher, `--panel-lift` keeps the last measurement (or the 5.75rem fallback) — same exposure the `<ul>` has today, accepted |
| Stack hides for any reason | ONE watcher on the full stack-visibility expression — `(chatEnabled \|\| whatsappVisible) && !hideContactButtons` — sets `menuOpen = false` when it goes false. This single watcher covers the overlay row above and the both-channels-off case; do not write two. The panel keeps its own existing `chatEnabled` watcher |
| `chatEnabled` flips off, stack still visible | existing watcher keeps closing the panel; the menu may stay open — its Chat row unmounts via its own `v-if` |
| Option selected | `menuOpen = false` (covers mobile `/chat` navigation leaving a stale open menu behind) |

The stack container visibility rule is unchanged
(`(chatEnabled || whatsappVisible) && !hideContactButtons`); the launcher
renders inside it. `data-shift-left` CSS gains the launcher: the existing
selectors cover `.contact-fab-stack` and its `ul`; the launcher (a direct
child button) is already carried by the container's `align-items` override,
verify and extend the selector only if needed. Stale comments go with the
change: the widget header («2 accesos directos… sin abrir un menú»), the
`.chat-panel` comment (9rem / «lista de canales» story), and the
`chatPanelLift.ts` three-rows narrative.

### Teaser

- The bubble slot stays first in the stack (above menu and launcher), gated
  `v-if="chatEnabled"` as today — WhatsApp-only brands never show it
  (unchanged).
- `teaserOpen` regains `!menuOpen` (pre-July condition): the bubble hides
  while the menu is open and reappears when the menu closes without an
  engage, because `teaserVisible` and its timers are untouched by `menuOpen`.
  No geometry conflict: bubble and open menu are never visible together.
- Clicking the bubble keeps opening the chat directly (`openChat`), not the
  menu — current behavior, better than July's.

### Panel anchoring (desktop)

The measured element changes from the `<ul>` (now `display:none` when
collapsed — height 0) to the **launcher button**, which is always mounted
while the stack is. `openChat` closes the menu and opens the panel, so the
only thing under the panel is the launcher:

- `measureChannels()` → `measureLauncher()`: ref moves to the button; the
  ResizeObserver re-attach logic transfers unchanged (same `watch` on the
  element ref).
- `chatPanelLiftPx()` keeps its contract (visible-thing height in →
  `bottom` px out); update its doc comment (the "three rows" story is stale)
  and its unit tests' expected values.
- CSS fallback: `.chat-panel { bottom: var(--panel-lift, 5.75rem) }` — the
  launcher case (56 + 24 + 12 = 92 px), replacing the stale 9rem two-row
  fallback in both `bottom` and the `height` formula.
- `openChat` stays synchronous: it measures the launcher (always mounted,
  unaffected by the menu's `v-show`), sets `menuOpen = false`, then
  `panelOpen = true`. No nextTick needed — that was the flaw in measuring
  the `<ul>`. The jsdom path (no ResizeObserver) relies on this synchronous
  measure; keep a unit test pinning it. Panel/input non-overlap is verified
  with `elementFromPoint` over the input edge (the technique the old
  `chatPanelLift.ts` doc comment describes).

### Invariants re-expressed, not weakened

Source-assertion guards pin today's structure. Each guard's underlying
invariant must be restated over the new mechanism — never deleted to make a
red test pass. Precedent: `ChatWidget.shift.test.ts` SCEN-1's comment
documents the previous such migration. Mapping:

- E10 byte-similarity / brand-parity guards (`burbuja-mission`): the widget
  sections they compare must stay in lockstep across brands with the launcher
  added; declared per-brand extras (tel row) remain declared.
- Shift guards (`shift.test.ts`, `chat-fab-left-green.test.ts`): shift stays
  attribute-driven (`data-shift-left` + CSS, no dynamic `:class` on the
  stack); assertions extend to the launcher.
- Clearance guards (`panel-clearance`, `fab-reservation`): re-point from
  3-row stack heights to the launcher measurement and the new fallback.
- A11y guards (`inert.a11y`, `a11y`): inert remains panel-only; new
  assertions for `aria-expanded`/`aria-controls` on the launcher.

## Blast radius

- `packages/ui-alquilatucarro/app/components/ChatWidget.vue`
- `packages/ui-alquicarros/app/components/ChatWidget.vue`
- `packages/ui-alquilame/app/components/ChatWidget.vue`
- `packages/logic/src/utils/chatPanelLift.ts` (doc comment, maybe fallback
  constant) + its unit tests
- Tests (mapping verified against the tree 2026-10-06):
  `ui-alquilatucarro/app/components/__tests__/`: `ChatWidget.a11y`,
  `ChatWidget.callForwarding`, `ChatWidget.inert.a11y`,
  `ChatWidget.panel-clearance`, `ChatWidget.shift`;
  `ui-alquicarros/app/components/__tests__/`: `ChatWidget.burbuja-mission`,
  `ChatWidget.fab-reservation`, `ChatWidget.inert.a11y`,
  `ChatWidget.whatsappSchedule`;
  `ui-alquilame`: `app/components/__tests__/ChatWidget.inert.a11y`,
  `tests/chat-fab-left-green`, `app/components/home/__tests__/
  contact-announcement`. Any further guard that greps ChatWidget source
  surfaces when the suite runs — same re-express rule applies.
- No consumer imports `ChatWidget` state; it's a leaf mounted per layout.
  `/chat`, `ChatConversation`, dashboard: untouched.

## Observable scenarios

- SCEN-01 — Given any page on any brand with the widget visible, when the
  page loads, then exactly one floating contact button renders (no channel
  rows, no labels), brand-primary circle with speech-bubble icon.
- SCEN-02 — Given the collapsed launcher, when the visitor taps it, then the
  menu opens showing only gate-allowed channels, the launcher shows an X with
  `aria-expanded="true"`, and a dimmed backdrop covers the page (no inert).
- SCEN-03 — Given the open menu, when the visitor taps WhatsApp or Llámanos,
  then the existing `wa.me` / `tel:` (forwarding-aware) link fires, teaser
  engage runs, and the menu closes.
- SCEN-04 — Given the open menu on desktop, when the visitor taps Chat, then
  the menu closes and the inline panel opens anchored above the launcher
  (panel bottom = launcher height + 24 + 12 px; no overlap with the input).
  On mobile the tap navigates to `/chat` and the menu state is closed.
- SCEN-05 — Given the open menu or panel, when the visitor presses Escape or
  taps the backdrop, then both close and the launcher returns to collapsed.
- SCEN-06 — Given unread or synthetic counts, when collapsed, then the
  launcher badges `badgeCount` (real wins only while `chatEnabled`, `9+`
  cap); when the menu opens, the launcher badge hides (not clears) and the
  count shows on the Chat option circle; the green chip shows only when both
  counts are 0.
- SCEN-07 — Given the teaser fires with the widget collapsed, then the bubble
  shows above the launcher and clicking it opens the chat directly; while the
  menu is open the bubble is hidden; closing the menu without engaging lets
  it reappear.
- SCEN-08 — Given the reservation overlay opens while the menu is open, when
  the overlay closes, then the launcher is back in its collapsed state (no
  pre-opened menu) and an open chat panel survives the overlay unchanged
  (today's behavior). The `data-shift-left` mechanism stays source-guarded
  only: it is DORMANT today (`hideContactButtons` unmounts the stack in the
  same state that would enable `shiftLeft` — see the «OJO: hoy es
  INALCANZABLE» note in the widget) and this change keeps it dormant, with
  the CSS extended to cover the launcher.
- SCEN-09 — Given chat off and WhatsApp off on the dashboard, when the page
  loads, then no launcher renders (same stack-visibility rule as today); if
  they turn off while the menu is open, the menu does not reappear when a
  channel returns.
- SCEN-10 — Given the three brand packages, when the unit suite runs from the
  repo root, then every re-expressed guard in the blast-radius list passes.

## Runtime validation

Orca embedded browser on all 3 brands, mobile (390 px) and desktop viewports:
zero console errors, zero failed requests, visual check that the hero is no
longer covered and the menu/panel open and close correctly. On alquilame,
check the launcher next to the open menu's Chat circle — both are
primary-on-white-icon, a possible visual duplicate to judge on screen. Chat
probes last (1 h per-IP rate limit — validate everything else first).

## Implementation deviations (2026-10-06, quality integration)

Three fixes from the post-implementation review agents, all strengthening the
spec's intent; each is test-first and replicated in the 3 brands:

1. `aria-expanded="menuOpen || panelOpen"` instead of the literal
   `="menuOpen"` above: with the panel open the launcher is an X labeled
   «Cerrar», and announcing it as collapsed contradicted the visible state for
   screen readers. The spec's literal was carried over from the pre-July code,
   which had the same inconsistency.
2. `closeAll`/`onChannelLink` restore focus to the launcher when the menu
   hides while focus is on a menu item (menu items precede the launcher in
   tab order; hiding the `<ul>` dropped focus to `<body>`).
3. The chat-open beacon uses `teaserOpen` (bubble actually visible), not
   `teaserVisible` (timer alive): opening from the menu row now reports
   `fab`, never a deterministic false `teaser` — this protects the very
   contact-volume metric named in «Why».

Declined after review, with reasons: menu-only backdrop keeps the blur on
mobile (certified pre-July look; transient, user-initiated cost — follow-up if
low-end QA shows jank); cosmetic refactors of certified restored code (ternary
label, repeated collapse condition, `chatPanelLiftPx` param name) are not worth
re-touching 3 parity-locked copies; teaser aria-live while hidden and
menu-survives-client-navigation are pre-existing LOW behaviors.

## Out of scope

Chat conversation internals, `/chat` page, dashboard, conversion
instrumentation for the menu (separate ticket, owner decides).
