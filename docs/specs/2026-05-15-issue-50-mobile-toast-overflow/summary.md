# Planning Summary — Issue #50

- **Date:** 2026-05-15
- **Goal:** Stop availability-searcher toasts from overflowing the mobile
  viewport, across all 3 brands, via a single shared `uiConfig` fix point.

## Artifacts

- `rough-idea.md` — concept + documented decision to collapse redundant
  sop-planning phases (brainstorming already did clarification/research).
- `../2026-05-15-issue-50-mobile-toast-overflow-design.md` — **authoritative
  detailed design** (committed; 3-iteration hostile review APPROVED;
  user-approved). Not duplicated here.
- `implementation/plan.md` — 8-step plan, file-structure map, plan-review loop
  APPROVED (1 iteration) + 3 tightening edits applied.

## Key Decisions

1. **Investigation-gated fix** — runtime DOM evidence (Steps 1–3) identifies one
   of 4 candidate causes (C1–C4) before any code change; remedy R1–R4 derived
   from evidence, not pre-committed.
2. **Single shared fix point** — additive `toaster`/`toast` key in
   `packages/logic/src/config/ui.config.ts`; `useMessages.ts` only if C3, behind
   a spec re-review gate.
3. **SDD holdout = runtime DOM oracles** via `/agent-browser` (5 scenarios with
   pinned numbers), not Vitest — no test-only steps (SDD Iron Law).
4. **Delta-vs-baseline acceptance** — typecheck (~1531 red) and console/network
   measured as delta, not absolute green.

## Complexity

- **Overall:** S–M · **Duration:** ~2–4h · **Risk:** Low (CSS-only, additive,
  isolated, revertible by single-commit revert).

## Recommended Next Steps

1. `/scenario-driven-development` — scenarios are already defined (spec
   §Observable scenarios) as the holdout; SDD drives Steps 1–8 to convergence.
2. Verify worktree `pnpm install` before Step 1.
3. `/verification-before-completion` gate (Step 8) before fix commit + PR
   (`Closes #50`).

## Open Questions

- Root cause (C1–C4) is intentionally unresolved until runtime Step 3 — by
  design, not a gap. Whether `useMessages.ts` enters scope depends on it.
