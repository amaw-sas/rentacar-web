---
name: contact-teaser-synthetic-badge
created_by: implementer-agent
created_at: 2026-07-17
---

# Contact teaser: proactive greeting + synthetic FAB badge

The site already has a single contact FAB (Chat / WhatsApp / Llamar) with a red
badge for **real** unread chat replies (PR #323). This adds a **proactive
trigger**: a few seconds after landing, a greeting bubble appears next to the FAB
and the red chip shows 1-2 "messages" — the "someone wrote you" feeling — until
the visitor engages any contact channel (WhatsApp / Llamar / open Chat) or
dismisses the bubble.

All logic lives in a new composable `useContactTeaser.ts`, mirroring the proven
`useChatConversation` pattern: a pure, unit-testable factory
(`createContactTeaser`) plus a client-only per-brand singleton wrapper with a
hard SSR guard. The synthetic state NEVER touches the `rentacar-chat:*`
namespace or `lastReadMessageId`: **the real unread always wins** — when
`unread > 0` the synthetic badge is fully suppressed.

Frequency: at most once per browser session (sessionStorage flag); after any
contact engagement, suppressed for 15 days (localStorage, aligned with
`CHAT_TTL_MS`).

Legend for evidence source:
- `[unit]` — asserted by a vitest unit test in `packages/logic`.
- `[manual]` — verified in a live browser (checklist at the end); the
  state-machine core it depends on is unit-covered.

---

## SCEN-001: greeting appears at ~5s — badge 1, event, session flag written
**Given**: a fresh browser session with no session flag, no engagement stamp, and `realUnread()` returning 0
**When**: `start({ realUnread })` runs and 5 seconds elapse (first timer fires)
**Then**: `teaserStep` becomes 1, `teaserVisible` is true, `syntheticCount` is 1,
`teaserAnnounce` is the emoji-free line-1 text, the `contact_teaser_shown` event
is emitted with `{ step: 1 }`, and the session flag `rentacar-teaser:${brand}:shown`
is written to sessionStorage
**Evidence**: `[unit]` under fake timers, advancing 5000ms sets `teaserStep === 1`,
`syntheticCount === 1`, the announce string non-empty and emoji-free, the gtag
stub received `contact_teaser_shown` with `step: 1`, and sessionStorage holds the
shown flag

## SCEN-002: second line at +20s — badge 2, capped at 2
**Given**: step 1 is showing (5s already elapsed) with no interaction and `realUnread()` still 0
**When**: another 20 seconds elapse (second timer fires)
**Then**: `teaserStep` becomes 2, `syntheticCount` becomes 2 (never higher — the
count is capped at 2), `teaserAnnounce` reflects both lines, and a second
`contact_teaser_shown` event is emitted with `{ step: 2 }`
**Evidence**: `[unit]` advancing a further 20000ms sets `teaserStep === 2` and
`syntheticCount === 2`; no path pushes the count past 2; the gtag stub received a
`contact_teaser_shown` with `step: 2`

## SCEN-003: dismiss cancels the second timer and clears the teaser
**Given**: step 1 is showing and the +20s timer is still pending
**When**: `dismiss()` is called (the X button)
**Then**: `teaserVisible` becomes false, `syntheticCount` returns to 0, the
`contact_teaser_dismissed` event is emitted, and advancing past the +20s mark does
NOT fire step 2 (the pending timer was cleared)
**Evidence**: `[unit]` after `dismiss()` the visible flag is false and count is 0;
advancing 20000ms more leaves `teaserStep` unchanged; the gtag stub received
`contact_teaser_dismissed`

## SCEN-004: engage clears, stamps 15d suppression, and emits only when active
**Given**: a teaser is active (step ≥ 1)
**When**: `engage('whatsapp')` is called
**Then**: the teaser clears (`teaserVisible` false, `syntheticCount` 0), the
engagement stamp `rentacar-teaser:${brand}:engagedAt` is written to localStorage,
and the `contact_teaser_engaged` event is emitted with `{ target: 'whatsapp' }`;
BUT when `engage()` is called with no active teaser, the stamp is still written
while NO event is emitted
**Evidence**: `[unit]` engage-while-active clears state, writes `engagedAt`, and
the gtag stub received `contact_teaser_engaged` with the target; a separate
instance calling `engage()` with no teaser writes `engagedAt` yet the stub never
received `contact_teaser_engaged`

## SCEN-005: frequency caps + remount resume — shown once actually SHOWN
**Given**: (a) a session where the shown flag is already set, (b) a fresh session
whose engagement stamp is just under vs. just over 15 days old, and (c) a session
where the surface unmounts (`stop()`) before the teaser has shown, or between
step 1 and step 2
**When**: `start()` runs in each case (a remount re-invokes `start()` on the same
per-brand singleton)
**Then**: with the session flag set, no timer schedules and step 1 never shows;
with an engagement stamp younger than 15 days no teaser shows; with a stamp older
than 15 days the teaser is allowed again (5s → step 1). CRUCIALLY, "once per
session" means once actually SHOWN, not once attempted: `stop()` only clears
pending timers and leaves a non-terminal state resumable, so a remount before 5s
re-schedules step 1 (the visitor still sees the teaser exactly once), and a
remount between step 1 and step 2 re-arms step 2 (the badge still reaches 2).
`start()` stays idempotent within a mounted lifetime (a pending timer is never
double-scheduled).
**Evidence**: `[unit]` start with the shown flag present never advances past step
0 after 5000ms; start with `engagedAt = now - (15d - 1ms)` stays at step 0; start
with `engagedAt = now - (15d + 1ms)` reaches step 1 at 5000ms; start → advance 2s
→ stop → start → advance 5s reaches step 1 with exactly one `contact_teaser_shown`;
start → step 1 → stop → start → advance 20s reaches step 2 (count 2)

## SCEN-006: real unread always wins — permanent session suppression, zero chat writes
**Given**: `realUnread()` returns a positive number (a genuine chat reply is unread)
**When**: `start()` runs; separately, `realUnread()` flips positive AFTER step 1 is
scheduled but BEFORE the 5s timer fires; separately again, a real reply appears
while step 1 is already showing (the ChatWidget `unread` watcher calls
`suppressForSession()`)
**Then**: in every case no synthetic teaser shows (`teaserVisible` false,
`syntheticCount` 0). Once a real unread has appeared, the synthetic teaser is DONE
for the session — PERMANENTLY: the fire-time guard performs a full reset into a
terminal state (not a bare early-return), so when the user reads the real reply
and `unread` returns to 0 the synthetic badge/bubble NEVER resurrects, and any
later `start()` is a no-op. The fire-time suppression still does NOT consume the
persistent session cap (the shown flag is only written when step 1 actually
renders), so a genuinely new browser session with `realUnread === 0` can still
show. Across a full lifecycle NO key in the `rentacar-chat:*` namespace is ever
written, and suppression emits no analytics event.
**Evidence**: `[unit]` start with `realUnread => 1` never shows after 5000ms; a run
where `realUnread` returns 0 at start but 1 at fire time fully resets to step 0 AND
leaves the session flag unwritten; after `suppressForSession()` a subsequent
`start()` with `realUnread => 0` never advances past step 0 across 25s and fires no
`contact_teaser_suppressed` event; after a complete cycle the storage stubs show
zero keys matching `rentacar-chat:`

## SCEN-007: SSR guard + per-brand client singleton
**Given**: the code runs during SSR (no browser globals, `import.meta.client` false)
**When**: `useContactTeaser()` is called twice as two independent server renders
would, then (on the client) twice for the same brand
**Then**: each SSR call returns a DISTINCT inert instance that schedules nothing;
on the client, two calls for the same brand return the SAME instance (memoized),
and a different brand returns a different instance
**Evidence**: `[unit]` two server-path calls return non-identical objects and an
SSR instance with no window schedules no timer (advancing time is a no-op);
`getOrCreateTeaser('X', …)` returns identical objects across calls and a different
object for a different brand key (source assertion mirrors the chat wrapper's
`if (!import.meta.client) return` guard)

## SCEN-008: hidden while menu/panel open, reappears, pulse suppressed
**Given**: the teaser is visible (badge 1 or 2) on the collapsed FAB
**When**: the user opens the 3-way menu (or the desktop chat panel), then closes it
**Then**: while `menuOpen || panelOpen` the greeting bubble is hidden (the widget's
`teaserOpen` computed is false), and it reappears on close if still unengaged;
while a synthetic badge shows, the decorative FAB pulse ring is suppressed (one
signal, not two) — same rule the real badge already applies
**Evidence**: `[manual]` open the menu → bubble disappears, badge persists; close
→ bubble returns; the FAB attention-pulse animation is off while the badge shows.
The `teaserOpen`/`badgeCount` computeds it depends on are unit-covered via the
synthetic-count state machine

## SCEN-009: accessibility — no focus stealing, announcement, reduced-motion
**Given**: a screen-reader / reduced-motion user lands on the site
**When**: the teaser fires at 5s and again at 25s
**Then**: focus is NEVER moved to the bubble (no autofocus, no programmatic
focus); the persistent `role="status" aria-live="polite"` region (never
`v-if`-toggled) announces the emoji-free teaser text; and
`prefers-reduced-motion: reduce` disables the bubble pop animation
**Evidence**: `[manual]` with a screen reader the greeting is announced without
the caret leaving the current control; with reduce-motion set the bubble appears
without animating. `teaserAnnounce` being emoji-free is unit-covered

## SCEN-010: capture-phase integrity on alquilatucarro (WhatsApp beacons intact)
**Given**: the alquilatucarro build, where `nuxt.config.ts` capture-phase
listeners and `wa-message.client.ts` prefill the WhatsApp `?text=` and fire the
`clic_boton_whatsapp` conversion beacon
**When**: with the teaser active, the user taps the WhatsApp anchor
**Then**: the anchor still navigates to `wa.me` with the prefilled `?text=`, the
existing `clic_boton_whatsapp` beacon fires (teaser handler is bubble-phase, no
`preventDefault`, no `.stop`), AND the new `contact_teaser_engaged { target:
'whatsapp' }` event also fires — the teaser rides alongside without breaking the
existing conversion pipeline
**Evidence**: `[manual]` in the browser, tapping WhatsApp with the teaser up opens
WhatsApp with the prefilled message; the network/gtag log shows both
`clic_boton_whatsapp` and `contact_teaser_engaged`. `engage()` writing the stamp +
emitting the event is unit-covered

---

## Manual QA checklist (browser — Orca embedded browser / agent-browser fallback)

Runtime scenarios whose STATE MACHINE is unit-covered above but whose rendering
needs a live DOM. Run per brand (alquilatucarro, alquilame, alquicarros); desktop
≥768px and mobile <768px.

- [ ] **SCEN-001/002 (desktop + mobile)**: land on the home, wait ~5s → greeting
  bubble appears next to the FAB with a red "1"; wait ~20s more → a second line
  appears and the badge reads "2"; it never exceeds 2.
- [ ] **SCEN-003**: with the bubble showing, tap the X → bubble closes, badge
  clears; it does not reappear later in the same session.
- [ ] **SCEN-004 (each channel)**: with the teaser up, tap WhatsApp → clears;
  reload within 15 days → teaser does NOT reappear. Repeat for Llamar and for
  opening Chat.
- [ ] **SCEN-005**: after the teaser has shown once, reload the page in the same
  session → it does not show again (session cap); open a new session (or clear
  sessionStorage) with no engagement stamp → it shows again.
- [ ] **SCEN-005 (resume)**: on a normal page wait ~3s (bubble not yet shown),
  navigate to `/chat` and back before 5s → the teaser still appears (once); if it
  shows step 1, navigate away and back before +20s → it still reaches step 2.
- [ ] **SCEN-006**: seed a real unread chat reply (badge from the chat), then
  reload → the FAB shows the REAL badge and the synthetic teaser never appears;
  the bubble stays hidden.
- [ ] **SCEN-006 (no resurrection)**: with the teaser bubble showing, trigger a
  real chat reply → the bubble/synthetic badge give way to the real unread; open
  and read the chat so `unread` returns to 0 → the synthetic bubble/badge do NOT
  come back for the rest of the session.
- [ ] **SCEN-008**: with the bubble showing, tap the FAB to open the menu → the
  bubble hides and the badge persists; close the menu → the bubble returns; the
  FAB attention pulse is off while the badge shows.
- [ ] **SCEN-009 (accessibility)**: the `role="status"` region is always in the
  DOM (empty by default, never `v-if`-toggled); the greeting text is announced;
  focus never jumps to the bubble; `prefers-reduced-motion` disables the pop
  animation.
- [ ] **SCEN-010 (alquilatucarro)**: tap WhatsApp with the teaser up → WhatsApp
  opens with the prefilled `?text=`; the analytics log shows both
  `clic_boton_whatsapp` and `contact_teaser_engaged`.
- [ ] **Chat/tiktok pages**: on `/chat` and `/tiktok` (no FAB) there are zero
  console errors and zero failed requests.
- [ ] **Safari private mode**: storage throws → the teaser still renders
  (fail-open), no console errors.
- [ ] **Console/network**: zero console errors, zero failed requests across
  land / wait / dismiss / engage / reload for all three brands.
