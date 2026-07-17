---
name: menu-open-badge-destination
created_by: implementer-agent
created_at: 2026-07-17
---

# Menu-open badge destination

The contact FAB carries a single red count chip: real unread chat replies, or —
when there are none — the synthetic teaser count (1-2). While the 3-way menu is
collapsed the chip sits on the FAB. But when the user OPENS the menu, the FAB
morphs into an X (close), and the count used to stay on that X — so users read
"the messages are on the X", tap it, the menu closes, and they hit a dead end
with nothing inside the menu showing where the count lives.

Fix: while the menu (or the desktop chat panel) is open, hide the FAB badge and
relocate the count onto the option it actually belongs to — WhatsApp for the
synthetic teaser count, Chat for a real unread. This is display-only gating; no
state is ever cleared. The state machine and badge-merge logic in
`useContactTeaser` / `useChatConversation` are untouched — this change lives
entirely in `ChatWidget.vue`.

Legend for evidence source:
- `[manual]` — verified in a live browser (checklist at the end); the underlying
  synthetic-count and unread state machines are unit-covered in the
  `useContactTeaser` and `useChatConversation` specs.

---

## SCEN-001: menu open relocates the synthetic count from the FAB to WhatsApp
**Given**: the synthetic teaser badge shows N (1 or 2) on the collapsed FAB, with
no real unread (`unread === 0`)
**When**: the user opens the 3-way contact menu
**Then**: the main FAB badge is HIDDEN (the FAB now renders an X, which must mean
only "close" — no count on it) and a red count chip showing N appears on the
WhatsApp option's circle; **When** the menu then closes with no contact action,
the chip leaves WhatsApp and the badge returns to the FAB with the SAME N — the
relocation is display gating, state is never cleared. The desktop chat panel being
open behaves like the menu being open (FAB badge hidden).
**Evidence**: `[manual]` open the menu → the FAB X carries no badge and the
WhatsApp circle shows N; close the menu → the badge is back on the FAB with the
same N. Gating is pure `v-if` display logic (`badgeCount > 0 && !menuOpen &&
!panelOpen` on the FAB; `unread === 0 && syntheticCount > 0` on the WhatsApp
option) layered over the unit-covered synthetic-count state machine

## SCEN-002: real unread relocates the count to the Chat option (real wins)
**Given**: a REAL unread M > 0 (a genuine chat reply is unread)
**When**: the user opens the 3-way menu
**Then**: the main FAB badge is hidden and a red count chip showing M (`9+` past 9)
appears on the CHAT option's circle, REPLACING the former plain red dot — the count
chip supersedes it; the small green 24/7 glow dot shows only when `unread === 0`.
Real unread continues to win: if both a real and a synthetic count could apply, only
the Chat chip shows (the WhatsApp chip requires `unread === 0`), so the count never
appears in two places at once.
**Evidence**: `[manual]` with a real unread, open the menu → the Chat circle shows
M with no glow dot, the WhatsApp circle shows nothing, and the FAB X carries no
badge. Chip gating: Chat shows the count when `unread > 0` and the glow dot when
`unread === 0`; the WhatsApp option's `unread === 0` guard keeps it dark whenever a
real unread exists

---

## Manual QA checklist (browser — Orca embedded browser / agent-browser fallback)

Runtime scenarios whose underlying state machines are unit-covered elsewhere but
whose rendering needs a live DOM. Run per brand (alquilatucarro, alquilame,
alquicarros); desktop ≥768px and mobile <768px.

- [ ] **SCEN-001**: with the synthetic teaser badge showing N on the collapsed
  FAB, open the menu → the FAB X has no badge and the WhatsApp option shows N;
  close the menu without acting → the badge returns to the FAB with the same N.
- [ ] **SCEN-001 (panel)**: on desktop, open the chat panel → the FAB badge is
  hidden the same way.
- [ ] **SCEN-002**: seed a real unread reply, open the menu → the Chat option
  shows the count (with `9+` past 9), no green dot; the WhatsApp option shows
  nothing; the FAB X has no badge.
- [ ] **SCEN-002 (24/7 dot)**: with no unread, open the menu → the Chat option
  shows the green 24/7 glow dot (not a count), and the synthetic count, if any,
  is on WhatsApp.
- [ ] **Console/network**: zero console errors, zero failed requests across
  open / close / act for all three brands.
