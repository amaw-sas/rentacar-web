---
name: chat-unread-badge
created_by: feat/chat-unread-badge
created_at: 2026-07-14T00:00:00Z
---

# Chat unread badge + no-data-loss singleton

Customers close the chat (desktop floating panel or mobile `/chat`) before the
bot replies and never notice the answer. A confirmed data-loss race compounds it:
closing unmounts `ChatConversation` while the SSE stream keeps running orphaned;
reopening mid-stream mounts a SECOND `useChatConversation` instance whose
`restore()` lacks the in-flight turn, and its next `persist()` overwrites the
orphan's completed reply permanently.

PR1 fixes both with a **client-guarded per-brand singleton** (single stream
owner, no second instance) plus an **unread state machine** surfaced as a badge
on the single contact FAB.

Legend for evidence source:
- `[unit]` — asserted by a vitest unit test in `packages/logic`.
- `[manual]` — verified in a live browser (checklist at the end); the
  state-machine core it depends on is unit-covered.

---

## SCEN-001: SSR guard — concurrent server renders never share chat state
**Given**: the code runs during SSR (no browser globals; Nuxt `import.meta.client` is false)
**When**: `useChatConversation()` is called twice, as two independent server renders would
**Then**: each call returns a DISTINCT instance (different object identity), the
module-level client memo is never populated, and neither instance registers
document/window listeners or reads localStorage
**Evidence**: `[unit]` two calls under the server path return non-identical objects; the
client memo helper (`getOrCreateInstance`) is only reachable behind the
`import.meta.client` guard (source assertion)

## SCEN-002: reopen mid-stream shows the SAME streaming reply
**Given**: the client singleton exists for brand `X` and a turn is streaming
**When**: `useChatConversation()` is called again (a second surface mounting) for brand `X`
**Then**: it returns the SAME instance — the same `messages` ref — so the reopened
surface renders the still-streaming assistant bubble; when the stream ends there
is exactly ONE assistant turn appended (no duplicate)
**Evidence**: `[unit]` `getOrCreateInstance('X', …)` returns identical object across calls;
different brand key returns a different object. `[manual]` reopen shows one growing bubble

## SCEN-003: completed reply is not overwritten across a close/reopen cycle
**Given**: a turn completed while the surface was closed (assistant reply present in `messages`)
**When**: the surface reopens and the user sends the next message
**Then**: the previously-completed assistant reply is still present above the new
turn — the singleton's single `messages` ref is never replaced by a stale
`restore()`, so no persisted reply is clobbered
**Evidence**: `[unit]` after simulating close (unmount, no abort) + reopen, the assistant
message that completed while closed is still in `messages`; a subsequent persist round-trip preserves it

## SCEN-004: close before reply → badge "1" + announcement + decorations suppressed
**Given**: the user sent a message then closed the surface (not viewing) before the reply
**When**: the assistant turn completes
**Then**: `unread` becomes 1, an aria-live announcement text `"1 mensaje nuevo en el chat"`
is set, the `chat_reply_while_closed` analytics event is emitted, and while
`unread > 0` the decorative FAB pulse ring and green chip glow are suppressed
(one signal, not three)
**Evidence**: `[unit]` `completeAssistantTurn()` while `isViewing === false` sets `unread === 1`,
sets the announcement string, and calls the analytics emitter. `[manual]` FAB shows red "1",
pulse ring + chip glow gone

## SCEN-005: opening the 3-way menu does NOT clear the badge; opening the chat does
**Given**: `unread > 0` (badge visible on the collapsed FAB)
**When**: the user taps the FAB to open the 3-way contact menu (Chat / WhatsApp / Llamar)
**Then**: the badge remains and a dot marks the "Chat" menu option; only tapping
"Chat" (which calls `markRead()` in `openChat`) clears `unread` to 0
**Evidence**: `[unit]` `markRead()` sets `unread` to 0; merely reading `unread` does not mutate it.
`[manual]` menu open keeps badge, Chat option shows a dot, opening chat clears it

## SCEN-006: badge survives a full page reload
**Given**: `unread === 2` was persisted (`lastReadMessageId` stored behind the last two assistant turns)
**When**: a fresh instance is created (simulating reload — new refs, restore from localStorage)
**Then**: `unread` restores to 2 from `lastReadMessageId` (NOT a raw counter) and the
badge shows without any further interaction; no announcement is fired on restore
**Evidence**: `[unit]` a new instance built over the same localStorage restores `unread === 2`
and leaves the announcement string empty

## SCEN-007: reply while panel open but tab hidden → returning to the tab clears unread
**Given**: the surface is mounted (`surfaceMounted === true`) but the tab is hidden (`docVisible === false`), so `isViewing === false`
**When**: an assistant turn completes (badge increments), then the tab becomes visible again
**Then**: on the `visibilitychange → visible` event, because the surface is still
mounted, `markRead()` runs and `unread` returns to 0 with NO further user action
**Evidence**: `[unit]` complete-turn while hidden sets `unread === 1`; dispatching
`visibilitychange` with `visibilityState === 'visible'` while `surfaceMounted` resets `unread === 0`

## SCEN-008: long-chat reopen positions at the "Mensajes nuevos" separator, focus on input
**Given**: a long transcript with unread assistant messages after `lastReadMessageId`
**When**: `ChatConversation` mounts
**Then**: a "Mensajes nuevos" separator renders before the first unread assistant
message and the view scrolls to it (not the top, today's bug); focus stays on the
composer input and is never moved into the message list; when there are no unread
messages it scrolls to the bottom instead
**Evidence**: `[unit]` `firstUnreadAssistantId` returns the id of the first assistant message
after `lastReadMessageId` (and `null` when none). `[manual]` separator visible + scrolled into
view, input focused

## SCEN-009: mobile — send on /chat, navigate back before reply → FAB badges on completion
**Given**: the user sends on the `/chat` full-screen page then navigates back (surface unmounts, stream keeps running on the singleton — never aborted)
**When**: the assistant turn completes with the surface closed
**Then**: the contact FAB on the site shows the unread badge; opening the chat clears it
**Evidence**: `[unit]` `onSurfaceUnmounted()` sets `surfaceMounted === false` and does NOT abort
the controller; a subsequent complete-turn while not viewing sets `unread === 1`. `[manual]` FAB badge on return

## SCEN-010: hard-close with a turn in flight → restore shows a retry affordance
**Given**: the page was hard-closed mid-turn; the last persisted message is a user
message with no assistant reply and nothing is streaming
**When**: a fresh instance restores from localStorage
**Then**: `danglingUserTurn` is true so the UI renders an inline affordance
`"No se completó la respuesta — reintentar"`; invoking it re-submits the last user
turn without duplicating the user bubble
**Evidence**: `[unit]` restore with a trailing user message and `status === 'ready'` yields
`danglingUserTurn === true`; a completed transcript (trailing assistant) yields false.
`[manual]` affordance visible + retry re-sends

---

## Manual QA checklist (browser — Orca embedded browser / agent-browser fallback)

Runtime scenarios whose STATE MACHINE is unit-covered above but whose rendering
needs a live DOM. Run per brand (alquilatucarro, alquilame, alquicarros); desktop
≥768px for the inline panel, mobile <768px for `/chat`.

- [ ] **SCEN-002/003 (desktop)**: open panel, send a message, close mid-stream,
  reopen — the SAME bubble is still streaming; exactly one assistant reply at the
  end; send another message — the prior reply is still above it.
- [ ] **SCEN-004 (desktop)**: send, close before reply → when the reply lands the
  FAB shows a red "1"; the pulse ring and green chip glow are gone; a screen
  reader announces "1 mensaje nuevo en el chat".
- [ ] **SCEN-005**: with the badge up, tap the FAB → menu opens, badge persists,
  the "Chat" option shows a dot; tap "Chat" → badge clears.
- [ ] **SCEN-006**: with a badge showing, reload the page → badge still shows.
- [ ] **SCEN-007**: open the panel, switch to another tab, let a reply arrive
  (badge), switch back → badge clears with no click.
- [ ] **SCEN-008**: with a long transcript and unread replies, reopen → the
  "Mensajes nuevos" separator is scrolled into view (not the top); the input is
  focused; no message element has focus.
- [ ] **SCEN-009 (mobile <768px)**: on `/chat` send a message, navigate back
  before the reply → the FAB shows the badge when the reply completes; open the
  chat → badge clears.
- [ ] **SCEN-010**: force a hard close mid-turn (e.g. kill the tab while
  streaming), reopen → the dangling user turn shows "No se completó la respuesta —
  reintentar"; tapping it re-sends and streams a reply.
- [ ] **Accessibility**: the aria-live region is always present in the DOM
  (empty by default, never `v-if`-toggled); new-message text is injected on
  increment; `prefers-reduced-motion` disables any new animation.
- [ ] **Console/network**: zero console errors, zero failed requests on open /
  close / reopen / reload across all three brands.
