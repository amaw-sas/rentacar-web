---
name: chat-typing-blink
created_by: orchestrator
created_at: 2026-09-20T00:00:00Z
---

# Chat: the "escribiendo…" indicator breathes instead of sitting still

Owner decision (2026-09-20): while the bot is answering, the typing line must
appear and disappear in an irregular rhythm — visible 2–4 s, hidden 0.4–1 s,
every cycle a different length — so it reads like a person typing, pausing and
typing again. Today it is painted once and stays fixed for the whole wait
(`ChatConversation.vue`, the `.cc-typing-text` row).

All scenarios hold identically in the 3 brands (alquilatucarro, alquicarros,
alquilame), and alquilatucarro ≡ alquicarros stays byte-identical.

## SCEN-T1: the indicator hides and comes back while the reply is still streaming
**Given**: a streaming reply with no text yet, and the typing row rendered
**When**: 4.1 s of streaming elapse, then 1.1 s more
**Then**: the row is visually hidden at some point inside the first window and visible again inside the second; the cycle repeats for as long as the stream lasts
**Evidence**: mounted DOM per brand with fake timers (class/style toggle observed across cycles)

## SCEN-T2: no two consecutive cycles last the same
**Given**: a streaming reply and a stubbed random source returning different values per call
**When**: three visible→hidden→visible cycles complete
**Then**: every visible span falls in [2000, 4000] ms and every hidden span in [400, 1000] ms, and the three visible spans are not all equal
**Evidence**: mounted test per brand asserting the scheduled delays (fake timers)

## SCEN-T3: hiding is visual only — a screen reader is told "escribiendo" once
**Given**: a streaming reply
**When**: the indicator completes two hide/show cycles
**Then**: the text node stays in the DOM the whole time (the row is never unmounted and its text never changes), and the live region announcing it is declared once
**Evidence**: mounted DOM per brand (same node identity across cycles) + source assertion of the aria-live declaration

## SCEN-T4: whoever asked for less motion keeps it steady
**Given**: the browser reports `prefers-reduced-motion: reduce`
**When**: a reply streams for 10 s
**Then**: the indicator stays visible the whole time, exactly like today, and no blink timer is scheduled
**Evidence**: mounted test per brand with a stubbed matchMedia

## SCEN-T5: the rhythm stops with the reply and leaves no timer behind
**Given**: a streaming reply whose indicator is mid-cycle
**When**: the reply finishes (or the component unmounts, or the conversation is cleared with the hidden gesture)
**Then**: no blink timer remains pending, and the next reply starts its indicator visible
**Evidence**: mounted test per brand asserting pending timer count after the stream ends and after unmount
