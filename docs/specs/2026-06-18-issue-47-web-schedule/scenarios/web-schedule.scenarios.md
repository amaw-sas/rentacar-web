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

## Notes
- Server-side validation (`out_of_schedule_*` / `holiday_*`) remains the backstop (already shipped).
- Mobile native `<input type=date>` cannot grey out single days; SCEN-11's button block + notice is the agreed handling there.
