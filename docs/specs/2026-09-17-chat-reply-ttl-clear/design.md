# Chat: narrower reply targets, 24 h local TTL, hidden clear gesture

Owner request (2026-09-17). Web only (rentacar-web, 3 brands). The single-sede
card for cities like Neiva is a rentacar-dashboard change (`textoDeSedes` in
`lib/chat-v2/embudo.ts`) handed off as a separate prompt; the web already renders
a one-element `data-sedeCards`.

Three independent parts, planned as separate tasks and commits.

## 1. Only gama rows and sede cards are replyable

Today every assistant bubble is replyable (swipe + desktop hover button) and so
are gama rows, model cards and sede cards. The owner wants quoting limited to
**gama rows** (`.cc-quote-row`) and **sede cards** (`.cc-sede`).

Remove, in the 3 `ChatConversation.vue` copies:
- bubble-level swipe handlers on `.cc-msg.is-assistant`, the `.cc-swipe-hint`
  inside it, the `.cc-bubble-reply-btn` hover button and `replyToBubble`;
- model card (`.cc-card`) click / Enter / swipe handlers, `cc-replyable`,
  `tabindex`/role, and `replyToModelo`;
- dead leftovers: `.cc-bubble-reply-btn` / `.cc-swipe-hint` CSS, the
  `touch-action: pan-y` rule on assistant bubbles, the `--cc-sdx` writes in
  `onSwipeMove`/`onSwipeEnd`, and the composer thumbnail (`replyTo.image`,
  `.cc-reply-thumb`), which only model quotes set. `ReplyContext.image` in
  `useChatConversation.ts` goes too if nothing else reads it.
- the sede-card template comment "igual que las tarjetas de modelos" is reworded.

Kept exactly as is: gama rows and sede cards (tap, Enter, swipe, row translate
feedback, same quote contract), the composer reply bar, the in-bubble quote on
sent messages, and `scrollToQuoted`.

Superseded scenarios (deliberate owner reversal, not a weakening), amended in
place with a pointer to this spec:
- `2026-07-17-chat-reply-whatsapp` SCEN-203 "any bot bubble is replyable" → SCEN-R1.
- same file, SCEN-204 "swipe reveals the ↩ hint" → retired (hint lived only on bubbles).
- same file, SCEN-201 thumbnail clause → retired with model quotes.
- `2026-09-13-chat-parts-order` SCEN-E3 clause "tapping a card still quotes it"
  → SCEN-R2. The rest of SCEN-E3 stands.

Tests rewritten: `ChatConversation.reply.wa.test.ts` SCEN-201 (thumb
assertions), SCEN-203, SCEN-204; `ChatConversation.partsOrder.mount.test.ts`
SCEN-E3 (`.cc-card` click now expects no quote). Gama rows had no test: SCEN-R2
adds one.

## 2. Typing while the bot answers

Current behavior: the input stays editable, Enter does not send while
`isStreaming` (the `submit` guard returns before clearing `input`), the draft is
kept. But the send slot turns into a "Detener respuesta" button during a stream,
so a customer who types and taps it aborts the bot's reply.

Owner decision (2026-09-17): during a stream the slot shows the normal send
button, **disabled** (`disabled` while `isStreaming`) and visibly inactive: no
`cc-send-active` brand colour while streaming, and a dimmed disabled style
(`opacity` like alquilame's `.cc-send:disabled { opacity: 0.7 }`) added
identically to the alquilatucarro/alquicarros copies (parity). alquilame keeps its
existing disabled style (`ChatConversation.brand.test.ts` pins its `.cc-send` CSS).
The user-facing stop button is removed in the 3 brands. `stop()` stays in the
composable; only `clear()` calls it (the watchdog aborts the controller directly,
and unmount must never abort — that invariant stays pinned).

Superseded: `issue-322-pr11-a11y-cleanup` SCEN-322-X04 clauses about the visible
stop control → SCEN-R3. `ChatConversation.stop.a11y.test.ts` (per brand) is
rewritten for the disabled send button (asserts no `Detener respuesta`, no
`chat-stop-test`, no `stop` destructure; keeps the unmount-does-not-abort
assertion); `useChatConversation.watchdog.test.ts` stays.

## 3. Conversation lifetime 24 h + hidden clear gesture

### 3a. TTL
- `CHAT_TTL_MS` goes from 15 days to 24 hours, measured from the newest message's
  `createdAt`, local only (Supabase record untouched).
- The constant and a single `isChatTranscriptExpired(msgs, now)` helper move to a
  new leaf module `packages/logic/src/utils/chatTtl.ts` (no imports from the
  engine). `useChatConversation.ts` and `useChatUnreadBadge.ts` both import it:
  no import cycle, the FAB chunk does not pull the engine, and both apply the same
  edge rule (non-empty transcript with no `createdAt` = expired). `CHAT_TTL_MS`
  stays re-exported from `useChatConversation.ts` for existing importers.
- `useContactTeaser.ts` currently aliases `TEASER_SUPPRESS_MS = CHAT_TTL_MS`. It
  keeps 15 days with its own constant; its behavior does not change.
- `2026-07-15-chat-ttl-expiry` SCEN-001/002 (15-day ages) are superseded by
  SCEN-R4; the ttlExpiry test ages (16/14 days) become 25 h / 23 h.

### 3b. Expiry on return to a live tab
Today expiry runs only when the per-brand singleton is created, and the singleton
exists only after `ChatConversation` mounted once in that page lifetime. A phone
browser that keeps such a tab alive for days keeps showing the old conversation.

On `visibilitychange` → visible and on `pageshow` (idempotent; both can fire on a
bfcache restore), BEFORE `markRead()`:
1. Skip if a reply is streaming.
2. Re-read the stored messages. Newest `createdAt` = max over memory and storage.
3. If that newest is older than 24 h → wipe memory (messages, conversationId,
   replyTo, lastRead, first-message tracking) and the 3 keys. The typed draft
   `input` is kept.
4. Otherwise do nothing. Storage younger than 24 h (e.g. another tab chatted) is
   never deleted, and no cross-tab adoption is attempted (not requested).
   Out of scope, pre-existing: a stale tab keeps its old transcript on screen and
   its next `persist()` can overwrite the other tab's storage (true today too).

### 3c. FAB unread badge
`useChatUnreadBadge.restore()` reads the stored messages without TTL. It applies
the same 24 h rule: an expired stored conversation counts 0 unread, so a return
visit never shows a badge that opens an empty chat. The badge re-runs its
`restore()` on `visibilitychange` → visible as well, so a tab left open with the
chat never opened drops yesterday's badge. `StoredChatMessage` gains the optional
`createdAt` field it needs. The visible re-read is skipped once the live engine for that
brand has published an unread count, so the engine stays the source of truth.

### 3d. Hidden clear gesture
- An absolutely positioned, transparent hit area over the title block
  (`.cc-titlewrap`: "¿En qué te ayudamos?" + status line), ending at least 8 px
  before `.cc-dismiss`, in both header skins (alquilame's band header and the
  shared one). `aria-hidden="true"`, not focusable, no visible change.
- Holding it 2 s with pointer events (touch or mouse) calls `clear()`, then also
  empties the draft `input`. `clear()` already `stop()`s any stream first.
- Release, `pointerleave`, `pointercancel`, or moving more than 10 px before 2 s
  cancels. A short tap does nothing. The close button keeps working on one tap.
- Mobile hardening on the hit area: `touch-action: none`, `user-select: none`,
  `-webkit-user-select: none`, `-webkit-touch-callout: none`, and `contextmenu`
  prevented, so iOS selection/callout and Android long-press menus do not cancel
  the hold.
- After a mid-stream clear, the aborted turn's `persist()` may write `[]` to the
  messages key. Accepted: the observable contract is "no messages restored, no
  conversationId, no lastRead".
- Analytics: after a clear or TTL wipe the next message counts as a first chat
  message again (`chat_message_sent` #1 / `generate_lead`). Accepted: a return
  visit a day later is a new chat session.

## Gates
- Vitest for `packages/logic` and the 3 brands (run from repo root), including
  `ChatConversation.parity.test.ts` (alquicarros ≡ alquilatucarro byte-identical).
- Typecheck of the 3 brands.
- Runtime at 390 px and desktop in the embedded browser, zero console errors; the
  2 s hold validated with real touch emulation, not only fake timers.

## Blast radius
- `packages/ui-{alquilatucarro,alquicarros,alquilame}/app/components/ChatConversation.vue`
- `packages/logic/src/composables/useChatConversation.ts`
- `packages/logic/src/composables/useChatUnreadBadge.ts`
- `packages/logic/src/composables/useContactTeaser.ts` (own constant, same value)
- `packages/logic/src/utils/chatTtl.ts` (new)
- Tests: per brand `ChatConversation.brand.test.ts` (alquilame, must stay green), `ChatConversation.reply.wa.test.ts`,
  `ChatConversation.partsOrder.mount.test.ts`, new stream-typing and
  clear-gesture tests, `ChatConversation.stop.a11y.test.ts`; logic `useChatConversation.ttlExpiry.test.ts`,
  `useChatUnreadBadge` tests, `useContactTeaser.test.ts` (name only).
- Specs amended: `issue-322-pr11-a11y-cleanup`, `2026-07-15-chat-ttl-expiry`, `2026-07-17-chat-reply-whatsapp`,
  `2026-09-13-chat-parts-order`.
- Consumers: `ChatWidget.vue` and `pages/chat.vue` per brand render
  `ChatConversation`; no prop/API change.

Scenarios: `scenarios/chat-reply-ttl-clear.scenarios.md`.
