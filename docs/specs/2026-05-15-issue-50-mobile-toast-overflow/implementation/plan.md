# Implementation Plan — Issue #50: mobile toast viewport overflow

- **Date:** 2026-05-15
- **Design (authoritative):** `docs/specs/2026-05-15-issue-50-mobile-toast-overflow-design.md`
- **Branch / worktree:** `fix/issue-50-mobile-toast-overflow` @ `../rentacar-web-issue-50`
- **Overall complexity:** S–M · **Duration:** ~2–4h · **Risk:** Low (additive,
  single shared file; investigation-gated)

## File Structure (locked before tasks)

| File | Action | Responsibility | Boundary |
|---|---|---|---|
| `packages/logic/src/config/ui.config.ts` | **Modify** | Shared @nuxt/ui component theme overrides. Add one **additive** `toaster` (and/or `toast`) key with `slots` per the selected remedy R1/R2/R4. `as const` preserved; no existing key (`slideover`, `header`, `pageSection`, `pageHero`, `button`, `formField`, `checkbox`) touched. | Single point; propagates to all 3 brands via each `app.config.ts` `ui: uiConfig`. |
| `packages/logic/src/composables/useMessages.ts` | **Modify — CONDITIONAL (only if root cause = C3)** | Relocate the per-call `ui.root` styling collision into shared config. | Gated: requires design-doc revision + re-review **before** this file is touched (per spec Blast radius). |
| — | none | No new files. No new unit-test file: project has no toaster unit harness; the SDD holdout is **runtime DOM oracles via `/agent-browser`** (spec §Observable scenarios), not Vitest. Per SDD, no test-only steps. | — |

Rationale: the design mandates a single shared fix point. Splitting further
would fragment a 1-key config change. `useMessages.ts` is a separate
responsibility (message construction) and is touched **only** if evidence proves
C3, behind an explicit re-review gate.

## Prerequisites

- Worktree deps installed: `pnpm install` (from worktree root) if `node_modules`
  absent in the worktree (root checkout has them; worktree may need its own).
- Dev server per brand via root scripts: `pnpm dev:alquilatucarro`
  (`:alquilame`, `:alquicarros`).
- `/agent-browser` available for runtime DOM inspection at fixed viewports.
- Baseline known-red: `pnpm typecheck` ≈1531 errors; acceptance = **delta**, no
  new errors. Console/network acceptance = delta vs. captured baseline.

## Chunk 1: Baseline + Root-Cause Gate

### Step 1 — Reproduce bug + capture failing-state evidence · Size: S · Deps: none
Start `pnpm dev:alquilatucarro`; `/agent-browser` at **414px**; trigger the
"fuera de la sede seleccionada" validation toast in the searcher.
**Scenario (implicit):** Given alquilatucarro at 414px, when the sede toast
fires, then the overflow bug is observed and the DOM state is captured.
**Acceptance:**
- Bug reproduced (toast clipped / off-viewport) — screenshot + recorded.
- Computed style + `getBoundingClientRect()` recorded for
  `[data-slot="viewport"]` and toast `[data-slot="root"]`, **plus root
  `scrollWidth`/`clientWidth`/`scrollHeight`/`clientHeight`** (the intrinsic-
  width measurement C2 discrimination cites), plus the tailwind-merge-resolved
  `ui.root` classes actually applied.
- Console + network request set recorded as the **delta baseline**.

### Step 2 — Capture desktop regression baseline · Size: S · Deps: Step 1
`/agent-browser` at **1024px**; trigger a toast.
**Scenario:** Given desktop ≥640px pre-fix, when a toast fires, then its width
and centering are recorded as the regression baseline.
**Acceptance:** root width recorded (expected `384px` / `w-96`) and horizontal
center recorded (≈ `window.innerWidth/2`). Feeds Step 6 / scenario 4.

### Step 3 — Identify root cause C1–C4 (GATE) · Size: S · Deps: Steps 1–2
Apply the spec's discriminating-observations table to Step 1 evidence.
**Acceptance:**
- Exactly one cause C1/C2/C3/C4 concluded, each claim citing a specific
  measured value from Step 1 (no hand-waving). Recorded in SDD evidence.
- Selected remedy named: a single remedy, **or** a spec-permitted
  non-conflicting pair (R1+R2, R2+R4, or R3 with any of R1/R2/R4). **R1⊕R4 are
  mutually exclusive** — never paired; pick R4 if C1/C4 ambiguous, per spec. If
  evidence is ambiguous toward a non-conflicting pair, name and apply both.
- **If C3:** STOP — open design-doc revision + re-dispatch spec reviewer; do
  **not** enter Chunk 2 until that loop re-approves (spec contingency).

## Chunk 2: Remedy + Scenario Verification

### Step 4 — Apply selected remedy in shared uiConfig · Size: S–M · Deps: Step 3
Add the additive `toaster`/`toast` key to
`packages/logic/src/config/ui.config.ts` implementing the chosen remedy. For
R1/R4 the `w-*` group is overridden directly (not `max-w`-only — silently inert
per spec tailwind-merge note); `100%` not `vw`; placement stays top-center.
Exact class string validated against the Step 1 computed style.
**Scenario:** Given the remedy applied, when the sede toast fires on
alquilatucarro at 414px, then the toast sits fully within the viewport with the
full message readable.
**Acceptance (SDD holdout — scenarios 1 & 2):** via `/agent-browser` at 414px:
- `root.left >= 0` AND `root.right <= window.innerWidth`; lateral insets ≥16px.
- `document.documentElement.scrollWidth <= window.innerWidth` (no h-scroll).
- root `scrollWidth <= clientWidth` AND `scrollHeight <= clientHeight`;
  description rect fully contained in root rect.
- `as const` intact; `pnpm typecheck` no new errors vs. baseline.

### Step 5 — Boundary-viewport verification · Size: S · Deps: Step 4
`/agent-browser` at **479px** and **481px** on alquilatucarro; fire the toast.
**Scenario:** Given alquilatucarro at 479px and 481px, when the toast fires,
then scenario-1 assertions hold at both (mobile sizing applies below sm 640px).
**Acceptance (scenario 3):** all scenario-1 oracles pass at 479px AND 481px.

### Step 6 — Desktop regression verification · Size: S · Deps: Step 4
`/agent-browser` at **1024px**; fire the toast.
**Scenario:** Given desktop 1024px post-fix, when a toast fires, then width and
centering equal the Step 2 baseline.
**Acceptance (scenario 4):** root width `384px ±1px`; `|center −
innerWidth/2| ≤ 1px`. No desktop regression.

### Step 7 — Cross-brand verification · Size: S · Deps: Step 4
`/agent-browser` on **alquilame** and **alquicarros** at **414px**; fire an
equivalent validation toast.
**Scenario:** Given alquilame and alquicarros at 414px, when the toast fires,
then scenarios 1–2 hold for each brand.
**Acceptance (scenario 5):** scenario-1 + scenario-2 oracles pass on both
brands (verified per brand, not assumed from shared config).

### Step 8 — Static + dogfood + verification gate · Size: S · Deps: Steps 4–7
**Acceptance:**
- `pnpm typecheck` — zero new errors vs. ~1531 baseline (delta only).
- `/dogfood` exploratory pass on the searcher: zero new console errors / failed
  requests vs. Step 1 delta baseline. **On dogfood failure → loop back to
  Step 4** (re-apply/adjust remedy), then re-run Steps 4–8.
- `/verification-before-completion` invoked with fresh evidence from Steps 4–7
  (the SDD guard's required gate before the real fix commit + PR).
- Then: commit the fix (guard now satisfied), open PR with `Closes #50`.

## Testing Strategy

- **SDD holdout = runtime DOM oracles** (`/agent-browser`), scenarios 1–5 from
  the design doc. No Vitest added (no toaster harness; would be a test-only step
  — forbidden by SDD).
- **Regression:** Step 6 pinned numeric desktop baseline.
- **Static:** typecheck delta-vs-baseline.
- **Exploratory:** `/dogfood` on the searcher.

## Rollout Plan

- **Deploy:** standard PR → review → merge → existing Vercel pipeline. No env,
  migration, or infra change.
- **Monitor:** none required (CSS-only config change); visual confirmation via
  the merged-branch preview deployment.
- **Rollback:** revert the single `ui.config.ts` commit (additive key →
  isolated, no coupled changes) — or the `useMessages.ts` commit too if C3 path
  was taken.

## Flagged Uncertainties

- Root cause is **unknown until Step 3**; the remedy (and whether
  `useMessages.ts` is in scope) is gated on that evidence. This is by design,
  not a planning gap.
- Worktree may need its own `pnpm install`; verify before Step 1.
