---
name: chat-reply-whatsapp
created_by: implementer-agent
created_at: 2026-07-17
---

# Reply-to, WhatsApp style

Today's reply affordance is functional but flat: a beige strip over the input
("Respondiendo a: …") and a plain gray span inside the sent bubble. WhatsApp's
version — the one the user pointed at — is a rounded quote CARD: colored left
bar, author name in that color, quoted preview, optional media thumbnail, and
you can reply to ANY message by swiping it (a ↩ hint fills in as you drag);
tapping a quote jumps to the original message and flashes it.

Scope: `ChatConversation.vue` (×3 brands, byte-identical) + 4 new OPTIONAL
fields on `ReplyContext` in `packages/logic/src/composables/useChatConversation.ts`
(`author`, `preview`, `image`, `targetId`). The wire payload is untouched —
`buildChatPayloadMessages` still sends only the flattened `context` string
(its test pins this), so the dashboard needs zero changes. Old persisted
transcripts lack the new fields → every renderer falls back to `label` and
scroll-to no-ops.

Tests: `packages/ui-*/app/components/__tests__/ChatConversation.reply.wa.test.ts`
(source-regex anchors ×3). Visual/gesture halves are `[manual]` browser QA.

Legend:
- `[test]` — asserted by the vitest file above
- `[manual]` — verified in a live browser (Orca embedded browser / Vercel preview)

---

## SCEN-201: composer reply card looks like WhatsApp
**Given**: the user picked something to reply to (gama row, model card, or bot
bubble)
**When**: the composer reply area shows
**Then**: instead of the flat strip, a rounded white card renders above the
input: 4px colored left bar, the quoted AUTHOR name in that color ("Asesora"),
the quoted preview below in gray (single line, ellipsis), an X to dismiss, and
— when quoting a model card that has a photo — the model photo as a right-side
thumbnail, WhatsApp-media style.
**Evidence**: `[test]` card markup (author, preview, thumb, X) + card CSS;
`[manual]` visual parity with the WhatsApp reference.

## SCEN-202: in-bubble quote block looks like WhatsApp
**Given**: a sent user message with `replyTo`
**When**: its bubble renders
**Then**: the quote is a rounded block tinted darker than the bubble, with the
colored left bar, author name in color and preview below (2-line clamp);
legacy messages whose `replyTo` only has `label` render the label as preview.
**Evidence**: `[test]` quote markup with `preview || … label` fallback + CSS;
`[manual]` look on the green bubble.

## SCEN-203: any bot bubble is replyable
**Given**: a plain text bubble from the assistant (not just gama rows / model
cards)
**When**: the user swipes it right (touch) or uses the reply affordance shown
on hover (desktop)
**Then**: the composer opens the reply card quoting that bubble — author
"Asesora", preview = first ~80 chars of the bubble text with markdown tokens
stripped — and the submitted payload prepends a context line about the quoted
message. Links/CTAs inside the bubble still work normally (plain click never
triggers reply).
**Evidence**: `[test]` swipe/hover bindings on the assistant chunk + builder
with markdown strip; `[manual]` swipe a text bubble, send, bot answers in
context.

## SCEN-204: swipe reveals the ↩ hint
**Given**: any replyable element (bot bubble, gama row, model card)
**When**: the user drags it right
**Then**: a circular ↩ icon fades/scales in behind it proportionally to the
drag (CSS var driven), completing at the 48px trigger; releasing past the
trigger fires the reply, releasing early snaps back. Honors
`prefers-reduced-motion`.
**Evidence**: `[test]` hint element + CSS var wiring in `onSwipeMove`;
`[manual]` gesture feel on mobile viewport.

## SCEN-205: tapping a quote jumps to the original
**Given**: a sent bubble whose `replyTo.targetId` points at a message still in
the transcript
**When**: the user taps/clicks the quote block (or the composer card body)
**Then**: the list scrolls the original message into view and flashes it
briefly (keyframe with `prefers-reduced-motion` guard). If `targetId` is
absent (legacy transcript) or the message is gone, nothing happens — no error.
**Evidence**: `[test]` `data-mid` on bubbles, `scrollToQuoted` + flash
keyframe + reduced-motion guard; `[manual]` tap the quote after a quote-table
reply.
