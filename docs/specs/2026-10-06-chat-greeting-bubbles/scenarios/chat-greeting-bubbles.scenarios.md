---
name: chat-greeting-bubbles
created_by: orchestrator
created_at: 2026-10-06T00:00:00Z
---

# The teaser's two lines greet inside the empty chat

Context: the proactive teaser shows two lines as Alquie's messages and badges
«2», but an empty chat renders a gray placeholder with different text — the
promised messages don't exist. Owner decision 2026-10-06: the empty chat
renders those same two lines as assistant bubbles, presentation-only (never
stored, never sent to the bot). Lines come from `TEASER_LINE_1`/`TEASER_LINE_2`
in `useContactTeaser` (single source). Spec: `../design.md`.

## SCEN-G1: empty chat greets with the two teaser lines as Alquie bubbles
**Given**: an empty conversation (no stored messages) on any brand, panel variant or /chat page
**When**: the chat surface renders
**Then**: exactly two assistant-styled bubbles render (`.cc-msg.is-assistant`, the first with the `is-group-start` tail), containing TEASER_LINE_1 and TEASER_LINE_2 verbatim; the old gray placeholder («Pregúntame por ciudades…», `cc-empty`) does not render
**Evidence**: mounted DOM per brand (vitest) + embedded-browser DOM check on one live brand

## SCEN-G2: the greeting is presentation only — never stored, never sent
**Given**: the greeting bubbles are visible in an empty chat
**When**: the visitor sends a real message and the exchange completes
**Then**: the greeting bubbles are gone; conversation storage contains only the real messages (no greeting text); the request payload to the chat endpoint contains no greeting text
**Evidence**: component test asserting messages/storage contents + payload inspection (mock transport in vitest)

## SCEN-G3: existing conversations never greet
**Given**: a conversation restored from storage with at least one message
**When**: the surface renders
**Then**: no greeting bubbles render
**Evidence**: mounted DOM per brand with seeded storage

## SCEN-G4: the badge's promise is kept
**Given**: the teaser fired and the badge showed «2»
**When**: the visitor opens the chat
**Then**: the first thing visible is those same two lines as Alquie bubbles (continuity of SCEN-G1; no extra state plumbing — the greeting shows for every empty chat)
**Evidence**: embedded-browser flow on one live brand (teaser → badge → open → bubbles), screenshot

## SCEN-G5: suites green, guards re-expressed
**Given**: the three brand packages after the change
**When**: the unit suite runs from the repo root
**Then**: all suites pass; any guard pinning `cc-empty` or the placeholder is re-expressed over the greeting, never deleted
**Evidence**: full vitest output from the repo root
