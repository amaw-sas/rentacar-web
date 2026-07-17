---
name: chat-bubbles-whatsapp
created_by: implementer-agent
created_at: 2026-07-17
---

# Chat bubbles, WhatsApp style

The chat widget's bubbles already borrowed WhatsApp's palette (beige `#ece5dd`
canvas, green `#d9fdd3` outgoing) but not its geometry: no tail, timestamp on
its own full-width row, mismatched radii, shadow only on incoming. This spec
closes that gap in `ChatConversation.vue` (triplicated byte-identical across the
3 brand packages — parity is a repo constraint). Structured parts (quote table,
model cards, CTAs), reply-quote, composer and input bar are OUT of scope.

Tests: `packages/ui-*/app/components/__tests__/ChatConversation.bubbles.wa.test.ts`
(source-regex anchors, ×3). They pin the structural encoding; the visual halves
are `[manual]` browser QA — source regexes cannot see the CSS cascade.

Legend for evidence source:
- `[test]` — asserted by the vitest file above
- `[manual]` — verified in a live browser (Orca embedded browser)

---

## SCEN-101: tail on the first bubble of a visible same-sender run
**Given**: a conversation with runs of consecutive messages from the same sender
**When**: bubbles render
**Then**: only the FIRST bubble of each run shows a triangular tail at its top
outer corner (outgoing: top-right, `#d9fdd3`; incoming: top-left, white) with
that corner squared; later bubbles in the run — including assistant `---`
chunks after the first — keep the uniform radius and no tail. The typing
placeholder opens the assistant run and carries the tail. The tail protrudes
8px into the 16px container padding → no horizontal scroll.
**Evidence**: `[test]` class bindings + tail CSS; `[manual]` tail pattern
`1100` over user + 3-bubble assistant reply, `scrollWidth === clientWidth`.

## SCEN-102: timestamp tucked into the bottom-right corner
**Given**: a bubble whose message has `createdAt`
**When**: it renders text content
**Then**: the time sits inside the bubble at the bottom-right, sharing the last
text line when there is room (inline spacer reserves its width; a full last
line wraps the time onto its own short line — never overlapping text). Bubbles
whose last chunk carries structured parts (`quoteTable`/`gamaCards`/`actions`)
return the time to its own row below the parts. The own-row override selectors
MUST match the spacer's specificity (`.cc-msg.is-assistant.has-parts …`) — with
fewer classes the spacer rule wins and the override is dead CSS.
**Evidence**: `[test]` spacer + override selectors incl. specificity guard;
`[manual]` short/long messages and a quote-table bubble.

## SCEN-103: WhatsApp radius and shadow on both roles
**Given**: any bubble
**When**: it renders
**Then**: uniform `7.5px` radius (tail corner squared only on run starts) and
the subtle `0 1px 0.5px rgba(11,20,26,.13)` shadow on BOTH roles (previously
incoming-only).
**Evidence**: `[test]` base rule anchors; `[manual]` visual parity with the
WhatsApp reference screenshot.

## SCEN-104: ghost assistant placeholders do not break runs
**Given**: a failed turn left an empty persisted assistant message (no text, no
parts — it renders no bubble but stays in the array for "Reintentar")
**When**: the user sends another message so the transcript is
`[user A, ghost, user B]`
**Then**: bubble B renders WITHOUT a tail — run detection walks back past
non-rendering placeholders instead of comparing raw array neighbors (which
would put tails on both adjacent user bubbles).
**Evidence**: `[test]` walk-back skip condition in `isGroupStart`.

## SCEN-105: chunk ending in a block markdown CTA
**Given**: an assistant chunk whose rendered markdown ends in a block-level
`cc-link-btn` CTA (fallback links do not set `actions`, so `has-parts` is off)
**When**: the bubble renders with a timestamp
**Then**: the inline spacer is suppressed and the time returns to its own row —
otherwise the spacer forms an empty ~1.4em strip under the button. Browsers
without `:has()` keep the strip (no overlap; graceful degradation).
**Evidence**: `[test]` `:has()` override selectors; `[manual]` bot reply with a
trailing CTA link.
