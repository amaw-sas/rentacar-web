# Implementation plan — collapse the contact stack into a single FAB

Date: 2026-10-06. Spec: `../design.md` (approved after 3 review passes).
Scenario set: SCEN-01..10 in the spec; authored as SDD artifacts in Step 1.

Planning phases note: requirements clarification and research were satisfied
by the brainstorming session (owner decision: single launcher on every
viewport) and by code/git archaeology recorded in the spec (`19b386c` diff,
current widgets, `chatPanelLift.ts`); no external research topics apply —
this restores a certified prior UI. The spec is the detailed design.

## File structure (all changes)

| File | Responsibility of the change |
|---|---|
| `docs/specs/2026-10-06-contact-fab-collapse/scenarios/contact-fab-collapse.scenarios.md` | Canonical SCEN-01..10 blocks (SDD contract) |
| `packages/ui-alquilatucarro/app/components/ChatWidget.vue` | Reference implementation: launcher, `menuOpen`, `closeAll`, `badgeCount`, menu `v-show`, backdrop condition, state-reset watcher, launcher measurement, CSS fallback 5.75rem, stale comments |
| `packages/ui-alquicarros/app/components/ChatWidget.vue` | Same change, preserving brand deltas |
| `packages/ui-alquilame/app/components/ChatWidget.vue` | Same change, preserving brand deltas (no Llámanos row) |
| `packages/logic/src/utils/chatPanelLift.ts` | Doc comment only (stale three-rows narrative); contract unchanged |
| Brand test files (mapping in spec Blast radius) | Guards re-expressed over the new mechanism + new assertions encoding SCEN-01..09 |
| `packages/logic/src/utils/__tests__/` chatPanelLift tests | Unchanged values; add the launcher-height case if missing |

No new files besides the scenarios doc. The widget stays one file per brand
(repo convention: triplicated, byte-similar, guarded).

## Chunk 1: Implementation steps

### Phase 1 — Foundation

- [ ] **Step 1 — Author SDD scenario artifacts** | Size: S | Dependencies: none
  Write `scenarios/contact-fab-collapse.scenarios.md` under the spec dir with
  the 10 SCEN blocks verbatim from the approved spec (Given/When/Then form).
  Acceptance: file exists; blocks match the spec; no scenario weakened.

### Phase 2 — Core functionality (reference brand)

- [ ] **Step 2 — alquilatucarro widget: restore launcher + menu state** | Size: M | Dependencies: Step 1
  Scenario-first: encode SCEN-01..09 behaviors as component tests (mount
  tests per repo convention; source assertions only where mount can't
  observe, per repo's source-assertion convention), then edit
  `ui-alquilatucarro/.../ChatWidget.vue`:
  launcher button (56 px, `bg-primary`, bubble/X, pulse, `badgeCount`,
  a11y strings per spec), `menuOpen` + `closeAll`, `<ul>` →
  `v-show="menuOpen"` + `id="contact-fab-menu"`, option clicks close the
  menu, backdrop `menuOpen || (chatEnabled && panelOpen)`, ONE stack-hide
  watcher (`(chatEnabled || whatsappVisible) && !hideContactButtons` →
  `menuOpen = false`), teaser regains `!menuOpen`, measurement ref moves to
  the launcher, CSS fallback 9rem → 5.75rem (bottom + height), stale
  comments rewritten (header, `.chat-panel`).
  Acceptance: new tests green; red-green shown for every test that asserts
  the launcher or `menuOpen` (at minimum one test each for SCEN-01, 02, 05,
  08, 09 must FAIL against the pre-change widget); a jsdom test pins the
  synchronous launcher measure in `openChat` (no ResizeObserver path);
  existing alquilatucarro ChatWidget tests pass re-expressed (a11y,
  callForwarding, inert.a11y, panel-clearance, shift) — invariants
  restated, none deleted.

- [ ] **Step 3 — chatPanelLift doc comment** | Size: S | Dependencies: Step 2
  Update the stale three-rows narrative to the launcher story; contract and
  constants unchanged. Add/keep a unit case for the launcher height (56 →
  92). Acceptance: `npx vitest run --root . packages/logic/src/utils/__tests__` green.

### Phase 3 — Integration (replicate brands)

- [ ] **Step 4 — alquicarros widget** | Size: M | Dependencies: Step 2
  Apply the Step 2 change preserving alquicarros deltas: the `tel:` row
  STAYS (declared live-brand extra), layer classes stay. Re-express its
  guards: burbuja-mission (E10 parity with the launcher present, declared
  per-brand extras still declared), fab-reservation, whatsappSchedule,
  inert.a11y; replicate the SCEN component tests. Acceptance: alquicarros
  ChatWidget tests green; parity guard passes against the updated
  alquilatucarro file.

- [ ] **Step 5 — alquilame widget** | Size: M | Dependencies: Step 2
  Same change; no Llámanos row; alquilame's `.fab-chat` white-on-primary
  delta preserved. Re-express: inert.a11y, `tests/chat-fab-left-green`,
  `home/__tests__/contact-announcement`; replicate SCEN tests (one-row-menu
  case SCEN-02 variant lives here: WhatsApp off → menu of 1).
  Acceptance: alquilame suites green.

### Phase 4 — Polish and verification

- [ ] **Step 6 — Full-suite + static gates** | Size: S | Dependencies: Steps 2-5
  From the repo root: full vitest run (kill stray dev servers first — known
  phantom-red cause), typecheck and lint per repo scripts. Known unlisted
  guard candidates that grep widget source and may trip (expect and
  re-express, never delete): `ui-alquilatucarro/tests/call-forwarding`,
  `ui-alquilatucarro` performance-quick-wins, `ui-alquicarros`
  home/reskin-invariants, `ui-alquicarros/tests/whatsapp-green-token`,
  `ui-alquilame/tests/{f0-chrome,whatsapp-green-token,perf-font-geometry}`,
  `packages/logic/tests/payload-bundle-contract`. Acceptance: all green with
  output captured (full output read, no filtered grep); any further guard
  that trips is re-expressed under the same rule.

- [ ] **Step 7 — Runtime validation (Orca embedded browser)** | Size: M | Dependencies: Step 6
  Dev servers for the 3 brands (worktree has no .env — keys via Supabase MCP
  per the documented worktree recipe). Per brand × {390 px, desktop}:
  SCEN-01/02/03/05 observed live; SCEN-04 on desktop (panel above launcher,
  `elementFromPoint` on the input edge); zero console errors, zero failed
  requests (`orca console`, `orca network` — capture per tab BEFORE
  navigating); alquilame visual-duplicate check (launcher vs Chat circle);
  screenshot evidence; exploratory QA pass (dogfood playbook). SCEN-06/07/09
  rely on component tests as sole evidence (timers/dashboard-gate matrices
  are impractical live); SCEN-08 gets a quick live probe (open menu → open
  reservation overlay → close → launcher collapsed). Chat-opening probes
  LAST (1 h per-IP rate limit). Note: `orca screenshot` can freeze on
  local pages — detect by identical file sizes, fall back to DOM+console
  validation.
  Acceptance: evidence per scenario per brand; no console/network errors.

- [ ] **Step 8 — Verification gate + commit + PR** | Size: S | Dependencies: Step 7
  /verification-before-completion with the scenario artifact contract
  (all SCEN files read, 10/10 satisfied, reward-hacking check on test
  diffs), then commit(s) and PR via the pull-request skill quality gate.
  No push without explicit user authorization.
  Acceptance: gate evidence in the PR description; CI green.

## Prerequisites

- Worktree already on branch `diego-alex-melo/3-botones-de-la-web-pasarlo-a-1`, `pnpm install` state inherited from main checkout (worktree convention: no reinstall).
- Supabase MCP available for env keys (Step 7).

## Testing strategy

- Unit/component: vitest from the repo root (`npx vitest run --root . <paths>`), per-brand ChatWidget suites + logic utils.
- Guards: re-express source assertions; red-green demanded for new scenario tests (fail on pre-change code).
- E2E/manual: Orca embedded browser matrix (3 brands × 2 viewports), console+network clean, chat probe last.

## Rollout plan

- Single PR to `main` (3 widgets + tests + scenarios doc + spec/plan docs). Vercel deploys the 3 brands (queue concurrency 1).
- Post-deploy: spot-check one brand in production, mobile viewport.
- Rollback: revert the PR — the change is UI-leaf only, no data or API surface.
- Follow-up ticket (owner decides): measure contact-channel volume before/after the launcher restoration.

## Delegation map (orchestration)

- Steps 2, 4, 5: implementation agents (sonnet), one per step, sequential
  (4 and 5 may run in parallel after 2), each briefed with the spec + the
  19b386c diff + acceptance criteria; orchestrator adversarially verifies
  diffs and runs the suites independently.
- Step 6: cheap-tier agent (haiku/sonnet) runs suites; orchestrator reads raw
  output (no grep-that-hides-Errors — assert on full output).
- Step 7: orchestrator-driven (embedded browser), evidence-first.
- Reviews after implementation: code-reviewer + edge-case-detector agents on
  the final diff (pull-request skill integrates them).
