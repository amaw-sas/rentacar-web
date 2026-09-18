---
name: chat-reply-ttl-clear
created_by: orchestrator
created_at: 2026-09-17T00:00:00Z
---

# Chat: reply targets, 24 h TTL, hidden clear

All scenarios hold identically in the 3 brands.

## SCEN-R1: assistant bubbles are not replyable
**Given**: a rendered assistant turn with plain text, and one with a price table
**When**: the customer swipes the bubble right past 48 px, or hovers it on desktop
**Then**: no reply card appears above the composer (`replyTo` stays null); the bubble has no reply button and no swipe hint
**Evidence**: mounted DOM per brand (vitest) + runtime check at 390 px

## SCEN-R2: model cards are not replyable; gama rows and sede cards still are
**Given**: an assistant turn with a price table (gama rows), model cards and sede cards
**When**: the customer taps / presses Enter / swipes a model card
**Then**: nothing is quoted; the card is not focusable and has no `cc-replyable`
**And when**: the customer taps a gama row, or a sede card
**Then**: the composer quote appears with the existing gama contract / SCEN-E11 sede contract, and the sent message carries its context
**Evidence**: mounted DOM + instance.replyTo + captured fetch body per brand (vitest), runtime screenshot

## SCEN-R3: typing while the bot answers keeps the draft and does not send
**Given**: a reply is streaming
**When**: the customer types "otra pregunta" and presses Enter
**Then**: no second chat request is made, no user bubble is added, the input still contains "otra pregunta"; the send button is visible, disabled and visibly dimmed (not brand-coloured in alquilatucarro/alquicarros; alquilame keeps its pinned brand background, dimmed), and no "Detener respuesta" control exists; tapping the disabled button does nothing and the bot's reply keeps streaming; once the stream ends the button enables and Enter or tap sends the draft
**Evidence**: new mounted test per brand + runtime network panel (one request during the stream) + screenshot of the disabled button

## SCEN-R4: a conversation older than 24 h starts empty on load
**Given**: storage holds messages whose newest `createdAt` is 25 h ago
**When**: the chat initializes
**Then**: no messages render and the messages, conversationId and lastRead keys are removed; with newest 23 h ago the messages remain
**Evidence**: `useChatConversation.ttlExpiry.test.ts` + runtime (seeded storage, reload)

## SCEN-R5: a tab left open expires when it comes back
**Given**: a page where the chat was opened (singleton alive) and the newest message becomes older than 24 h while hidden, with no newer transcript in storage
**When**: the page becomes visible again (`visibilitychange` → visible or `pageshow`, in any order, possibly both)
**Then**: the conversation is wiped exactly like SCEN-R4 and a typed draft stays in the input; a conversation younger than 24 h is untouched; a stream in progress is never wiped
**Evidence**: logic test with fake timers

## SCEN-R5b: expiry in a stale tab never deletes another tab's live conversation
**Given**: tab A's in-memory transcript is 25 h old, and storage holds a transcript from tab B dated 1 h ago
**When**: tab A becomes visible
**Then**: storage keeps tab B's messages and conversationId (nothing is deleted)
**Evidence**: logic test with fake timers and shared stubbed storage

## SCEN-R5c: the unread badge ignores an expired conversation
**Given**: storage holds an unread assistant reply whose newest `createdAt` is 25 h ago
**When**: the page loads with the chat closed, or a tab already open with that badge becomes visible again
**Then**: the FAB shows no unread badge; with 23 h the badge shows as today; a non-empty stored transcript with no `createdAt` also shows no badge
**Evidence**: `useChatUnreadBadge` logic test

## SCEN-R6: holding the title area for 2 s clears the conversation
**Given**: a chat with messages and a typed draft, optionally while a reply is streaming
**When**: the owner presses and holds the header title area for 2 s
**Then**: any stream stops, all messages and the draft disappear, no conversationId or lastRead is stored and no messages are restored after reload; the next message is sent without `conversationId`
**Evidence**: mounted test with fake timers per brand + runtime hold with touch emulation, then reload

## SCEN-R7: short, moved or interrupted presses do nothing
**Given**: a chat with messages
**When**: the title area is tapped; or held 1.9 s and released; or the pointer moves more than 10 px, leaves, or is cancelled before 2 s
**Then**: messages remain; the close button still closes with a single tap
**Evidence**: mounted test with fake timers per brand

## SCEN-R8: the hidden control is invisible
**Given**: the rendered header in each brand
**Then**: the header looks identical to before (before/after screenshots); the control is `aria-hidden`, not focusable, and a long press on it opens no text selection or context menu
**Evidence**: runtime screenshots at 390 px and desktop + DOM assertions
