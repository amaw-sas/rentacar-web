import { describe, it, expect } from 'vitest';
import { returnDateForPickupChange } from '../scheduleAvailability';
import { createDateFromString } from '../useDateFunctions';
import type { LocationSchedule } from '../index';

// SCEN-322-T03/T04/T05 — docs/specs/issue-322-pr7-dates-tz/scenarios/dates-tz.scenarios.md
//
// The fechaRecogida watcher used to collapse the return to pickup+1 on EVERY
// pickup change (destroying the duration the user chose) and passed the pickup
// itself as nearestOpenDay's floor (so the "default" could land the return ON
// the pickup day → 0 billable days → doSearch dies in "Revisa las fechas").
// The watcher now delegates to this pure function; these tests simulate the
// user's sequence of changes against it (same split as
// rolloverWhenSameDayExhausted: pure logic here, wiring pinned in
// composables/__tests__/useSearch.preserveDuration.test.ts).

// Reference branch (issue #47 ADR): mon-fri 08:00-18:00, sat 08:00-13:00,
// sun closed, holidays closed. Verified 2026 weekdays: Jan 1 = Thursday.
const A: LocationSchedule = {
  mon: ['08:00-18:00'], tue: ['08:00-18:00'], wed: ['08:00-18:00'],
  thu: ['08:00-18:00'], fri: ['08:00-18:00'], sat: ['08:00-13:00'],
  sun: [], hol: [],
};

const d = createDateFromString;

describe('returnDateForPickupChange — SCEN-322-T03 duration is preserved', () => {
  it('pickup D → D+2 shifts a D+5 return to D+7 (still 5 days), not D+3', () => {
    // Holiday-free week: Mon Jan 19 pickup, Sat Jan 24 return (5 days).
    // User moves pickup to Wed Jan 21 → return Mon Jan 26 (open), 5 days kept.
    const result = returnDateForPickupChange(
      A,
      d('2026-01-21'), // new pickup (Wed)
      d('2026-01-19'), // previous pickup (Mon)
      d('2026-01-24'), // chosen return (Sat) — 5 days
    );
    expect(result.toString()).toBe('2026-01-26');
    // Never the old +1 collapse (would have been Thu Jan 22).
    expect(result.toString()).not.toBe('2026-01-22');
  });

  it('snaps the shifted return off a closed day to the nearest open one', () => {
    // Tue Jan 20 pickup, Fri Jan 23 return (3 days). Pickup moves to Thu Jan 22:
    // target = Sun Jan 25 (closed) → nearest open day is Mon Jan 26 (forward
    // wins the radius-1 tie so the rental is not shortened).
    const result = returnDateForPickupChange(A, d('2026-01-22'), d('2026-01-20'), d('2026-01-23'));
    expect(result.toString()).toBe('2026-01-26');
  });

  it('a permissive/unconfigured schedule keeps the exact shifted date', () => {
    const result = returnDateForPickupChange({}, d('2026-01-07'), d('2026-01-05'), d('2026-01-10'));
    expect(result.toString()).toBe('2026-01-12');
  });
});

describe('returnDateForPickupChange — SCEN-322-T04 default never lands on the pickup day', () => {
  it('pickup Saturday with Sunday (D+1) closed → return moves FORWARD past the pickup, never back onto it', () => {
    // No previous range (seed/default): duration falls back to 1. Sat Jan 10
    // pickup → target Sun Jan 11 closed. Old floor (= pickup) let nearestOpenDay
    // return Sat Jan 10 itself (backward radius 1). Floor pickup+1 forces Mon Jan 12…
    // which is the Reyes holiday (closed) → Tue Jan 13.
    const result = returnDateForPickupChange(A, d('2026-01-10'), null, null);
    expect(result.toString()).toBe('2026-01-13');
    expect(result.compare(d('2026-01-10'))).toBeGreaterThan(0); // strictly after pickup
  });

  it('an all-closed (degenerate) schedule keeps the raw target, still strictly after pickup', () => {
    const closed: LocationSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [], hol: [] };
    const result = returnDateForPickupChange(closed, d('2026-01-10'), null, null);
    expect(result.toString()).toBe('2026-01-11'); // raw pickup+1 — server validates as backstop
  });
});

describe('returnDateForPickupChange — SCEN-322-T05 an invalidated return is recalculated', () => {
  it('pickup jumps past the chosen return → return follows at pickup+duration', () => {
    // Mon Jan 5 → Sat Jan 10 (5 days); pickup jumps to Thu Jan 15 (past the
    // old return). Return recalculates to Jan 20 (Tue, open) — never before pickup.
    const result = returnDateForPickupChange(A, d('2026-01-15'), d('2026-01-05'), d('2026-01-10'));
    expect(result.toString()).toBe('2026-01-20');
  });

  it('a corrupt previous range (return ≤ previous pickup) falls back to the +1 minimum', () => {
    // Deep-link seeded return BEFORE the pickup: duration would be negative →
    // clamp to 1 day. New pickup Wed Jan 7 → Thu Jan 8 (open).
    const result = returnDateForPickupChange(A, d('2026-01-07'), d('2026-01-09'), d('2026-01-06'));
    expect(result.toString()).toBe('2026-01-08');
    expect(result.compare(d('2026-01-07'))).toBeGreaterThan(0);
  });

  it('return equal to the new pickup is never produced (floor is pickup+1)', () => {
    // Same-day previous range (duration 0) → minimum 1 day applies.
    const result = returnDateForPickupChange(A, d('2026-01-07'), d('2026-01-07'), d('2026-01-07'));
    expect(result.compare(d('2026-01-07'))).toBeGreaterThan(0);
  });
});
