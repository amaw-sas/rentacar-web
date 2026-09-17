# Implementation plan — chat reply targets, 24 h TTL, hidden clear

Spec: `../design.md` · Scenarios: `../scenarios/chat-reply-ttl-clear.scenarios.md`
Created 2026-09-17. Branch `diego-alex-melo/chat-reply-ttl-clear`.

Planning phases 1-6 of sop-planning were covered by the approved brainstorming
spec (owner Q&A, code-grounded review ×3). This file holds the file map and steps.

## File map

| File | Responsibility | Steps |
|---|---|---|
| `packages/logic/src/utils/chatTtl.ts` (new) | `CHAT_TTL_MS` (24 h) + `isChatTranscriptExpired(msgs, now)`; leaf, no imports | 3 |
| `packages/logic/src/utils/index.ts` (exported as `@rentacar-main/logic/utils`) | re-export chatTtl | 3 |
| `packages/logic/src/composables/useChatConversation.ts` | use helper at init; visible/pageshow expiry; re-export `CHAT_TTL_MS`; drop `ReplyContext.image` + reword `replyTo` comment (done in Step 3, track B owns this file) | 3 |
| `packages/logic/src/composables/useChatUnreadBadge.ts` | TTL-aware `restore()`, re-restore on visible unless engine published | 4 |
| `packages/logic/src/composables/useContactTeaser.ts` | own 15-day constant; NO import of `./useChatConversation` (that edge pulls the engine into the FAB graph) | 3 |
| `packages/ui-{alquilatucarro,alquicarros,alquilame}/app/components/ChatConversation.vue` | reply targets, disabled send, hidden clear hit area | 1, 2, 5 |
| per-brand `__tests__/ChatConversation.reply.wa.test.ts`, `.partsOrder.mount.test.ts`, `.stop.a11y.test.ts`, new `.clearGesture.mount.test.ts`, new `.streamDraft.mount.test.ts` | encode scenarios | 1, 2, 5 |
| logic `__tests__/useChatConversation.ttlExpiry.test.ts`, badge test, `useContactTeaser.test.ts` | encode scenarios | 3, 4 |
| superseded specs (`2026-07-15-chat-ttl-expiry`, `2026-07-17-chat-reply-whatsapp`, `2026-09-13-chat-parts-order`, `issue-322-pr11-a11y-cleanup`) | pointer notes to this spec | 1, 2, 3 |

## Steps
1. Reply limited to gama rows + sede cards (SCEN-R1, R2) | Size: M | Dependencies: none
2. Disabled send button during stream, no stop button (SCEN-R3) | Size: S | Dependencies: Step 1 (same .vue files)
3. `chatTtl.ts` + 24 h TTL + expiry on visible/pageshow (SCEN-R4, R5, R5b) | Size: M | Dependencies: none
4. Unread badge honors TTL (SCEN-R5c) | Size: S | Dependencies: Step 3
5. Hidden 2 s clear gesture (SCEN-R6, R7, R8) | Size: M | Dependencies: Step 2
6. Full gates + runtime QA in the 3 brands | Size: M | Dependencies: 1-5

Parallelism: track A = 1 → 2 → 5 (only the 3 brand component dirs + their tests + reply/a11y/parts-order spec notes); track B = 3 → 4 (only `packages/logic` + ttl-expiry spec note). Disjoint files: `useChatConversation.ts` belongs to track B only; track A must not touch it. `ReplyContext.image` removal is deferred to Step 6 (after Step 1 removed the template usage), so neither track breaks the other's typecheck.

Verification commands (all from repo root):
- Brand tests: `npx vitest run --root . packages/ui-alquilatucarro/app/components/__tests__ packages/ui-alquicarros/app/components/__tests__ packages/ui-alquilame/app/components/__tests__`
- Logic tests: `npx vitest run --root . packages/logic/src`
- Typecheck: `pnpm typecheck:safe`
- Dead-code grep is scoped to the 3 `ChatConversation.vue` files (ignore `.output/`).

## Prerequisites
- Kill stray dev servers before vitest (phantom timeouts under load). Run vitest from the repo root: `npx vitest run --root . <paths>`.
- Local dev for runtime QA: brand dev server + dashboard on :3000 for real chat turns.

## Implementation Steps (SDD per step: scenario → failing test → code → green → refactor)

### Step 1 — Reply targets
- Scenario first: rewrite SCEN-203 as SCEN-R1 (bubble has no swipe handlers, no `cc-bubble-reply-btn`, no `cc-swipe-hint`, swipe on bubble leaves `replyTo` null — mounted, not only source regex); retire SCEN-204 and SCEN-201 thumb assertions; rewrite SCEN-E3 card click to expect no quote; add gama-row tap test (quote + fetch body context) and model card not focusable.
- Code: remove bubble swipe/hover reply, `replyToBubble`, model card handlers/`cc-replyable`/tabindex/role, `replyToModelo`, dead CSS, `--cc-sdx` writes, `.cc-reply-thumb` + `replyTo.image`; reword sede comment. Identical in alquilatucarro/alquicarros (parity), equivalent in alquilame.
- Amend `2026-07-17-chat-reply-whatsapp` (SCEN-201 thumb, 203, 204) and `2026-09-13-chat-parts-order` (SCEN-E3 clause) with pointer notes.
- Model card no-quote assertions cover tap, Enter and swipe. SCEN-R1 is a mounted test (reuse the harness in `partsOrder.mount.test.ts`); source regex only for the dead-code guard.
- Acceptance: brand tests + `pnpm typecheck:safe` green; SCEN-R1/R2 tests green in 3 brands; parity test green; `grep replyToBubble|replyToModelo|cc-swipe-hint|cc-bubble-reply-btn|cc-reply-thumb` returns nothing in the 3 components.

### Step 2 — Disabled send during stream
- Scenario first: new mounted test per brand: streaming (fetch held open) → set input "otra pregunta" → dispatch `submit` on the form (jsdom has no implicit Enter submission; real Enter is checked at runtime in Step 6) → fetch called once, no new user bubble, input value kept, send button `disabled`, no `[data-testid=chat-stop-test]`, no `cc-send-active` class (WA copies); click the disabled button → status still `streaming`, no abort, fetch once; stream ends → button enabled → form submit sends, and separately a button click sends. Rewrite `stop.a11y.test.ts` (no stop control, no `stop` destructure, unmount-does-not-abort kept).
- Code: single submit button, `:disabled="isStreaming || !input.trim()"`, `cc-send-active` only when `!isStreaming`; `.cc-send:disabled { opacity: 0.7 }` in the two WA copies; alquilame keeps its style (brand test green).
- Amend `issue-322-pr11-a11y-cleanup` SCEN-322-X04 with a pointer note.
- alquilame exception: its `.cc-send` background stays `var(--ui-primary)` (pinned by brand test); disabled = dimmed brand colour. The WA copies drop the brand colour.
- Acceptance: brand tests + `pnpm typecheck:safe` green; `ChatConversation.brand.test.ts` green.

### Step 3 — TTL module and visible expiry
- Scenario first: ttlExpiry tests ages → 25 h / 23 h (SCEN-R4); new tests: helper unit (empty → false, no createdAt → true, boundary); visible/pageshow wipe with fake timers (SCEN-R5), younger than 24 h on visible → untouched (negative case), skipped while streaming, idempotent double fire, draft kept; stale tab + fresh storage → storage untouched (SCEN-R5b). The existing ttlExpiry harness stubs `addEventListener` as no-ops: capture listeners in a map (as `useChatConversation.unread.test.ts` does) so tests can fire visibilitychange/pageshow. Teaser test still asserts 15 days. Source guard test: `chatTtl.ts` has no imports; `useContactTeaser.ts` and `useChatUnreadBadge.ts` do not import `useChatConversation`.
- Code: create `packages/logic/src/utils/chatTtl.ts`, re-export from `utils/index.ts`; engine imports `../utils/chatTtl` relatively and uses it at init and in an `expireIfStale()` called first in the visible handler and on `pageshow`; resets conversationId, replyTo, lastRead, first-message tracking; keeps `input`. `useContactTeaser.ts` gets its own 15-day constant and removes its `./useChatConversation` import.
- Amend `2026-07-15-chat-ttl-expiry` (SCEN-001/002) with a pointer note.
- Acceptance: logic tests + `pnpm typecheck:safe` green; guard test green.

### Step 4 — Badge TTL
- Scenario first: badge test: stored unread reply 25 h old → count 0; 23 h → 1; no createdAt → 0; visible re-restore drops stale badge; skipped after an engine publish; while an engine exists but never published, re-restore still runs and applies the TTL (pinned).
- Code: `StoredChatMessage.createdAt?`; `restore()` uses `isChatTranscriptExpired`; visible listener re-restores unless an engine publish happened.
- Acceptance: logic tests + `pnpm typecheck:safe` green; guard test from Step 3 still green.

### Step 5 — Hidden clear gesture
- Scenario first: mounted test per brand with fake timers and pointer events (jsdom has `PointerEvent`). Seed storage with messages, `conversationId` and `lastReadMessageId`, and assert they are present before the hold. Hold 2000 ms → messages empty, draft empty, conversationId/lastRead keys absent, messages key absent or `[]`; a second `createChatConversation(cfg)` on the same storage restores no messages; the next send body has no conversationId (SCEN-R6, also mid-stream); tap, 1900 ms release, move >10 px, pointerleave, pointercancel → messages kept; dismiss button emits on one click (SCEN-R7); hit area `aria-hidden="true"`, no tabindex, contextmenu default prevented (SCEN-R8).
- Code: transparent element `position:absolute; inset:0` inside `.cc-titlewrap` (made `position: relative`), so the flex gap keeps it off `.cc-dismiss` (verify ≥ 8 px at runtime); pointerdown starts 2 s timer, pointerup/leave/cancel/move>10px clear it; on fire `clear()` then the component sets `input = ''` and resets `announce` (the engine's `clear()` touches neither); CSS `touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none`; `@contextmenu.prevent`. Timer cleared on unmount.
- Acceptance: brand tests + `pnpm typecheck:safe` green; parity green.

### Step 6 — Gates and runtime QA
- Cleanup first: drop `ReplyContext.image` in `useChatConversation.ts` and reword the `replyTo` comment ("gama row / sede card").
- `pnpm` typecheck for the 3 brands; full vitest for logic + 3 brands from root.
- Runtime (Orca embedded browser, 390 px + desktop, each brand): gama row tap quotes, bubble swipe and model card don't; during a real stream type + Enter keeps draft, button dimmed, one chat request; hold title 2 s with touch emulation → empty, reload stays empty; seeded 25 h storage → empty on load, no FAB badge; before/after header screenshots identical; zero console errors, zero failed requests.
- /code-review + review agents, then /verification-before-completion before commit.

## Testing Strategy
- Unit: `chatTtl.ts`, engine expiry, badge restore (fake timers, stubbed storage/document).
- Component (mounted, per brand): reply targets, stream draft, clear gesture.
- Runtime: Orca embedded browser + /dogfood across 3 brands.

## Rollout Plan
- One PR, commits per step. No push without owner authorization.
- Vercel preview per brand; owner checks on phone (long press on real iOS/Android).
- Rollback: revert the PR; local storage format unchanged (only TTL shorter), so no migration.
