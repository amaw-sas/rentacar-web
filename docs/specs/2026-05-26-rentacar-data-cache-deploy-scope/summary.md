# Planning Summary: deployment-scoped cache key for `/api/rentacar-data`

**Date:** 2026-05-26
**Goal:** Stop every Vercel deploy from failing since #58 by scoping the `rentacar-data` cache to a single deployment, so a restored cross-build response with an outdated schema can never crash the `/` prerender.

## Artifacts
- `../2026-05-26-rentacar-data-cache-deploy-scope-design.md` — approved design (root cause, fix, alternatives, scenarios C1–C6). Spec-reviewer approved (iter2).
- `implementation/plan.md` — file structure + 3-step plan with scenario-embedded acceptance criteria. Plan-reviewer approved.
- `summary.md` — this file.

(No `rough-idea`/`idea-honing`/`research`/`detailed-design` — the design came from `/brainstorming`; sop-planning consumed it and produced the file structure + implementation plan, per the brainstorming→planning handoff.)

## Key decisions
1. **Per-deploy cache key via `app.buildId`** (Approach A) over a manually-bumped static version (B, fragile) or disabling persistence (C, invasive). Auto-busting, no recurrence, keeps within-deploy caching.
2. **Fail-loud preserved** — no consumer-side shape-masking; SCEN-003 (issue #2) stays intact. The fix changes which cache entry is read, never whether failures surface.
3. **Pure `rentacarDataCacheKey(buildId)` helper** extracted for a node-env unit test (matches the `fetchRentacarData` extract-for-testability pattern) and to guard the deploy-unique invariant (throws on empty `buildId`).
4. **Definition of done = Vercel preview GREEN**, capturing both the RED base and GREEN fix against the same restored cache — not the unit test.

## Complexity
- **Overall:** S (one option + one tiny helper + one unit test + comment).
- **Duration:** ~1–2h including local build + deploy verification.
- **Risk:** Low. Self-contained, side-effect-free; a bad change only errors the deploy (live site stays on the last green deploy), and revert is a one-commit rollback.

## Recommended next steps
1. Proceed to `/scenario-driven-development` with SCEN-C1–C6 as the holdout.
2. Implement Step 1 (helper + handler), then Step 2 (adversarial regression), red→green.
3. `/verification-before-completion` before the PR.
4. Open PR after user authorizes push; the deploy gate (SCEN-C6) is the final proof.

## Open questions
- None blocking. Broader cache strategy (tag-based invalidation, `maxAge`) stays deferred to #7 / #16-F2.
