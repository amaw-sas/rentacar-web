# Issue #47 — Web schedule restriction (olas W1–W5) — Scenarios holdout

Derived from the ADR `docs/specs/2026-06-03-issue-47-schedule-restrictions-design.md`
(SCEN-04..12). Each scenario is the acceptance bar for its wave. Pure rules are
encoded as Vitest; integration scenarios are validated at runtime in the browser.

Reference branch **A**: `mon–fri 08:00–18:00`, `sat 08:00–13:00`, `sun []`, `hol []`.

## W1 — Read structured schedule (Vitest: `server/utils/__tests__/transformers.test.ts`)
- **W1-a** — A structured row passes through `transformBranches` intact (day keys + `hol` + `display`). ✅
- **W1-b** — An unconfigured `{}` schedule stays `{}` (no hours invented). ✅
- **W1-c** — A `null` schedule maps to `undefined`; the city-page chip hides. ✅

## W2 — Pure availability rules (Vitest: `src/utils/__tests__/scheduleAvailability.test.ts`)
- **SCEN-04** — Branch A, a Sunday → `bookableSlotsForDate` = `[]` (closed). ✅
- **SCEN-05** — Branch A, a Saturday → includes `13:00`, excludes `13:30` and `15:00`. ✅
- **SCEN-06** — Branch A, a Monday → excludes `07:30`, includes `08:00`. ✅
- **SCEN-06b** — Branch A, Saturday (closes 13:00) → `13:00` is the last slot (buffer 0). ✅
- **SCEN-07** — Branch A, a holiday → applies `hol` (`[]` → closed), not the weekday. ✅
- **SCEN-08** — `schedule = {}` → every 30-min slot available (permissive). ✅
- **SCEN-12** — The hour list is always the 30-min grid (no `08:15`/`10:37`); slots are injected from the canonical options. ✅

## W3 — Colombian holidays (Vitest: `src/utils/__tests__/colombianHolidays.test.ts`)
- **W3-a** — 18 official holidays per year (2026 verified). ✅
- **W3-b** — Emiliani: a movable holiday (Reyes, Jan 6 2026 = Tue) is observed the following Monday (Jan 12). ✅
- **W3-c** — Holy Thursday/Friday stay on their actual dates (not moved). ✅

## W4–W5 — Searcher integration (runtime, /agent-browser on a city page)
- **SCEN-09** — Pickup in A (closed Sunday) → the pickup calendar disables Sundays.
- **SCEN-10** — Pickup in A + return in B (open Sunday) → pickup calendar blocks Sunday, return calendar allows it (independent).
- **SCEN-11** — Pickup hour chosen, then the branch changes to one closed at that hour/day → the selection is flagged out-of-schedule, the search button is disabled, and a notice is shown; the form cannot be submitted.
- **SCEN-08 (runtime)** — A branch with `{}` schedule (e.g. AAMDL) → no calendar/hour restriction (current behavior preserved).

## W6 — Default snapping to nearest open slot (followup bug)

The inherited searcher defaults predate #47 and aren't schedule-aware: return date = pickup + 7 days, return hour = pickup hour. When a default lands on a closed day/hour of the return branch it blocked the search button instead of self-correcting. The fix snaps each default to the **nearest allowed** slot. Operator decision: snap, don't block.

Pure rules (Vitest: `src/utils/__tests__/scheduleAvailability.test.ts`):
- **SCEN-13** — `nearestOpenDay`: a target on a closed day (Sunday / holiday for branch A) returns the nearest open day (bidirectional, forward wins ties), never earlier than `floor`; an already-open target is returned unchanged; an unconfigured `{}`/`undefined` schedule returns the target unchanged (permissive).
- **SCEN-14** — `nearestSlotByTime`: a copied hour above the day's close (15:00, Sat closes 14:00 for ACKAL) snaps to `14:00`; below the open (06:00, opens 08:00) snaps to `08:00`; an in-range hour is returned unchanged; an empty slot list returns `null`.

Integration (runtime, /agent-browser on a city with ACKAL `sat 08:00-14:00`, `sun []`, `hol []`):
- **SCEN-15a** — Pickup on a Monday whose +7 lands on a holiday → the return date auto-snaps to the nearest open day; the search button stays enabled and no out-of-schedule notice appears.
- **SCEN-15b** — Pickup Friday, return Saturday, pickup hour 15:00 → the return hour auto-snaps to `14:00` (nearest), not `08:00` (earliest), and the button stays enabled.
- **SCEN-15c (regression)** — A branch with `{}` schedule (AAMDL) → the +7 default and hour copy are untouched (no restriction).

## Notes
- Server-side validation (`out_of_schedule_*` / `holiday_*`) remains the backstop (already shipped).
- Mobile native `<input type=date>` cannot grey out single days; SCEN-11's button block + notice is the agreed handling there.
- Manual branch change with an already-chosen date keeps the W5 behavior (notice + blocked button); only the **defaults** self-snap (agreed scope).
