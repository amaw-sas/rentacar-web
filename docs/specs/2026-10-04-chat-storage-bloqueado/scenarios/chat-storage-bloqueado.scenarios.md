---
name: chat-storage-bloqueado
created_by: orchestrator
created_at: 2026-10-04T00:00:00Z
---

# Chat disponible con el almacenamiento del sitio bloqueado

Applies to the three brands. In strict-privacy browsers the mere property access
`window.sessionStorage` / `window.localStorage` throws a SecurityError (a
throwing getter — `typeof` does NOT protect against it). Root cause confirmed
2026-10-04 by A/B against production: with a throwing `sessionStorage` getter the
chat FAB disappears (createContactTeaser evaluates `typeof sessionStorage` in
ChatWidget's setup); with a getter returning `undefined`, or a storage whose
methods throw, everything works. The contract: blocked storage only costs
persistence (transcript across reloads), never the chat itself, and never logs
errors.

"0 console errors" below means: zero `console.error`, zero uncaught page errors,
zero Vue hydration-mismatch messages captured via Playwright `page.on('console')`
+ `page.on('pageerror')` across load, FAB click and one chat round-trip.

## SCEN-PRIV-01: sessionStorage blocked → chat still works
**Given**: a chromium iPhone 13 context where `Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('blocked','SecurityError')}})` runs before any page script, on a brand page with chat enabled (alquilame `/bogota`)
**When**: the page loads, the visitor opens the chat FAB and sends "Hola"
**Then**: the FAB is visible, the panel opens, an assistant reply bubble arrives, and 0 console errors are recorded
**Evidence**: Playwright transcript — FAB locator count = 1, assistant message count ≥ 1, captured console/pageerror arrays empty

## SCEN-PRIV-02: localStorage blocked → chat still works
**Given**: same context but the throwing getter is installed on `localStorage` instead
**When**: the page loads, the visitor opens the chat FAB and sends "Hola"
**Then**: same as SCEN-PRIV-01 — FAB visible, reply arrives, 0 console errors
**Evidence**: Playwright transcript — same observables as SCEN-PRIV-01

## SCEN-PRIV-03: both storages blocked → chat still works
**Given**: throwing getters installed on BOTH `sessionStorage` and `localStorage`
**When**: the page loads, the visitor opens the chat FAB and sends "Hola"
**Then**: same as SCEN-PRIV-01 — FAB visible, reply arrives, 0 console errors (includes the color-mode/hydration errors seen in the 2026-10-04 baseline: gone)
**Evidence**: Playwright transcript — same observables as SCEN-PRIV-01

## SCEN-PRIV-04: normal storage → persistence unchanged
**Given**: a default context (no storage blocking) where the visitor sent "Hola" and received a reply
**When**: the page is reloaded and the chat is reopened
**Then**: the previous transcript (the "Hola" bubble) is still there, exactly as today
**Evidence**: Playwright transcript — user message "Hola" present after reload

## SCEN-PRIV-05: factories never throw under blocked storage (unit)
**Given**: vitest with a throwing accessor installed over `globalThis.sessionStorage` / `globalThis.localStorage`
**When**: `createContactTeaser(cfg)` and `createChatConversation(cfg)` are invoked, the teaser `start()`s and the conversation records a message in memory
**Then**: no call throws; teaser behaves as "nothing stored" (schedules step 1); conversation starts empty and keeps messages in memory for the session
**Evidence**: vitest run output from repo root (`npx vitest run --root . <rutas>`) — new specs green

## SCEN-PRIV-06: the three brands stay green
**Given**: the repository after the fix
**When**: the existing unit suites of the touched packages run from the repo root
**Then**: alquilame, alquilatucarro and alquicarros suites pass — no cross-brand parity guard trips
**Evidence**: vitest run output, exit code 0, no FAIL lines and no Unhandled Errors section
