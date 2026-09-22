---
name: chat-typing-blink-timings-v2
created_by: orchestrator
created_at: 2026-09-21T00:00:00Z
---

# Chat: the typing indicator cuts, it does not fade

Owner decision (2026-09-21), after watching the preview of PR #493 on a phone:
the 120 ms fade goes away and the rhythm tightens. This supersedes ONLY the
timing and fade clauses of SCEN-T1 and SCEN-T2 in
`chat-typing-blink.scenarios.md`; everything else there (visual-only hiding,
single aria-live announcement, reduced motion, no timer left behind) stands
unchanged.

New contract, identical in the 3 brands:
- visible: a fresh random span in [2000, 3000] ms
- hidden: a fresh random span in [250, 500] ms
- no CSS transition on the indicator's opacity: it disappears and comes back at once

## SCEN-T6: the indicator cuts instantly, with no fade
**Given**: the chat stylesheet applied to the typing indicator
**When**: the indicator switches between shown and hidden
**Then**: its opacity transition duration is 0 in both directions (the change is a cut, not a fade)
**Evidence**: mounted DOM per brand asserting the computed/declared transition, plus a runtime check in a real browser

## SCEN-T7: shorter, tighter cycles
**Given**: a streaming reply and a stubbed random source returning different values per call
**When**: three visible→hidden→visible cycles complete
**Then**: every visible span falls in [2000, 3000] ms, every hidden span in [250, 500] ms, and the three visible spans are not all equal
**Evidence**: mounted test per brand asserting the scheduled delays (fake timers)
