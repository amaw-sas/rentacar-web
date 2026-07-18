---
name: teaser-chip-chat-destination
created_by: implementer-agent
created_at: 2026-07-17
---

# Teaser chip destination: Chat, not WhatsApp

While the 3-way contact menu is open the count chip relocates off the FAB (which
has become an X) onto the option it belongs to. The synthetic teaser count is a
"message", and messages live in the chat — so it belongs on the "Chat 24 horas"
option, not WhatsApp. The Chat option is dashboard-gated (`chatEnabled`), so when
chat is turned off and the Chat option is not rendered, the synthetic chip falls
back to the WhatsApp circle rather than being orphaned. A real unread continues to
own the Chat option and always wins over the synthetic count.

This change is display-only and lives entirely in `ChatWidget.vue`; the
`useContactTeaser` / `useChatConversation` state machines are untouched.

Legend for evidence source:
- `[manual]` — verified in a live browser (checklist at the end); the underlying
  synthetic-count and unread state machines are unit-covered in the
  `useContactTeaser` and `useChatConversation` specs.

---

## SCEN-001: synthetic count lands on the Chat option when chat is enabled
**Given**: chat is enabled (the "Chat 24 horas" option renders), the synthetic
teaser count is N (1 or 2), and there is no real unread (`unread === 0`)
**When**: the user opens the 3-way contact menu
**Then**: a red count chip showing N appears on the CHAT option's circle, the
green 24/7 glow dot on Chat is HIDDEN (never two indicators at once), and the
WhatsApp option shows nothing; the main FAB badge is hidden as before
**Evidence**: `[manual]` open the menu with a synthetic count and chat enabled →
the Chat circle shows N with no glow dot, WhatsApp is bare. Gating: the Chat chip
renders on `unread > 0 || syntheticCount > 0` (value `unread > 0 ? unread :
syntheticCount`), the glow dot only on `unread === 0 && syntheticCount === 0`

## SCEN-002: fallback to WhatsApp when chat is disabled
**Given**: chat is DISABLED (`chatEnabled` false, so the Chat option is not
rendered), the synthetic teaser count is N, and `unread === 0`
**When**: the user opens the 3-way menu (Chat absent; WhatsApp + Llamar shown)
**Then**: the synthetic count chip N appears on the WhatsApp option's circle so the
count is never orphaned; if chat were enabled the WhatsApp circle would show
nothing
**Evidence**: `[manual]` with chat off, open the menu → the WhatsApp circle shows
N. Gating: the WhatsApp chip renders only on `!chatEnabled && unread === 0 &&
syntheticCount > 0`. (Localhost dev has no dashboard → `chatEnabled` fail-closed
false → this is the path localhost naturally exercises.)

## SCEN-003: a real unread still wins on the Chat option (unchanged)
**Given**: a REAL unread M > 0 with chat enabled
**When**: the user opens the 3-way menu
**Then**: the Chat option's circle shows the real count M (`9+` past 9), the glow
dot is hidden, and the WhatsApp option shows nothing — the real count owns the Chat
chip and takes precedence over any synthetic count, so the count never appears in
two places
**Evidence**: `[manual]` with a real unread, open the menu → Chat shows M, no dot,
WhatsApp bare. Gating: the Chat chip value is `unread > 0 ? (unread > 9 ? '9+' :
unread) : syntheticCount`, so real precedes synthetic; the WhatsApp fallback's
`unread === 0` guard keeps it dark whenever a real unread exists

---

## Manual QA checklist (browser — Orca embedded browser / agent-browser fallback)

Runtime scenarios whose underlying state machines are unit-covered elsewhere but
whose rendering needs a live DOM. Run per brand (alquilatucarro, alquilame,
alquicarros); desktop ≥768px and mobile <768px.

- [ ] **SCEN-001 (chat enabled — Vercel preview)**: with the synthetic teaser
  count showing, open the menu → the Chat option shows the count and no green dot;
  WhatsApp shows nothing.
- [ ] **SCEN-002 (chat disabled — localhost / gated brand)**: with the synthetic
  count showing and chat off (Chat option absent), open the menu → the WhatsApp
  option shows the count.
- [ ] **SCEN-003 (real unread)**: seed a real unread, open the menu → the Chat
  option shows the count with no dot; WhatsApp shows nothing.
- [ ] **Glow exclusivity**: with no unread and no synthetic count, open the menu →
  the Chat option shows only the green 24/7 glow dot (no chip).
- [ ] **Console/network**: zero console errors, zero failed requests across
  open / close for all three brands.
