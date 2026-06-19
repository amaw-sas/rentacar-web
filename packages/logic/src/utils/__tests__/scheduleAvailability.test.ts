import { describe, it, expect } from 'vitest';
import {
  openRangesForDate,
  isDayOpen,
  bookableSlotsForDate,
} from '../scheduleAvailability';
import { createDateFromString } from '../useDateFunctions';
import type { LocationSchedule } from '../index';

// Issue #47 W2 — pure availability rules over the structured schedule.
// Reference branch A (from the ADR): mon-fri 08:00-18:00, sat 08:00-13:00,
// sun closed, holidays closed.
const A: LocationSchedule = {
  mon: ['08:00-18:00'], tue: ['08:00-18:00'], wed: ['08:00-18:00'],
  thu: ['08:00-18:00'], fri: ['08:00-18:00'], sat: ['08:00-13:00'],
  sun: [], hol: [],
};

// Canonical 30-min slots 00:00 … 23:30 (the searcher's hour options, values only).
const SLOTS = Array.from({ length: 48 }, (_, i) => ({
  value: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
}));
const values = (slots: { value: string }[]) => slots.map((s) => s.value);

// Verified 2026 weekdays: Jan 1 = Thursday.
const SUNDAY = createDateFromString('2026-01-04');
const MONDAY = createDateFromString('2026-01-05');
const SATURDAY = createDateFromString('2026-01-10');
const HOLIDAY_MONDAY = createDateFromString('2026-01-12'); // Reyes (observed) — a Monday that is a holiday

describe('bookableSlotsForDate', () => {
  it('SCEN-04 — a closed day (Sunday for branch A) yields no slots', () => {
    expect(bookableSlotsForDate(A, SUNDAY, SLOTS)).toEqual([]);
  });

  it('SCEN-05 / SCEN-06b — Saturday includes the closing slot 13:00 but excludes 13:30 and 15:00', () => {
    const v = values(bookableSlotsForDate(A, SATURDAY, SLOTS));
    expect(v).toContain('13:00'); // buffer 0: the closing time itself is bookable
    expect(v).not.toContain('13:30');
    expect(v).not.toContain('15:00');
    expect(v[0]).toBe('08:00'); // opens 08:00
  });

  it('SCEN-06 — Monday excludes 07:30 (before open) and includes 08:00', () => {
    const v = values(bookableSlotsForDate(A, MONDAY, SLOTS));
    expect(v).not.toContain('07:30');
    expect(v).toContain('08:00');
    expect(v).toContain('18:00'); // closing slot included
    expect(v).not.toContain('18:30');
  });

  it('SCEN-07 — a holiday applies `hol` (closed), not the weekday schedule', () => {
    // Jan 12 2026 is a Monday, but it is the observed Reyes holiday → hol [] → closed,
    // even though branch A opens on Mondays.
    expect(isDayOpen(A, HOLIDAY_MONDAY)).toBe(false);
    expect(bookableSlotsForDate(A, HOLIDAY_MONDAY, SLOTS)).toEqual([]);
  });

  it('SCEN-08 — an unconfigured `{}` schedule is permissive (every slot, any date)', () => {
    expect(bookableSlotsForDate({}, SUNDAY, SLOTS)).toEqual(SLOTS);
    expect(bookableSlotsForDate(undefined, MONDAY, SLOTS)).toEqual(SLOTS);
    expect(isDayOpen({}, SUNDAY)).toBe(true);
  });

  it('treats a 24h branch (00:00-24:00) as fully open including the last slot', () => {
    const allDay: LocationSchedule = { mon: ['00:00-24:00'] };
    expect(bookableSlotsForDate(allDay, MONDAY, SLOTS)).toEqual(SLOTS);
  });
});

describe('openRangesForDate / isDayOpen', () => {
  it('returns the weekday ranges on an ordinary day and [] on a closed day', () => {
    expect(openRangesForDate(A, MONDAY)).toEqual(['08:00-18:00']);
    expect(openRangesForDate(A, SUNDAY)).toEqual([]);
    expect(isDayOpen(A, MONDAY)).toBe(true);
    expect(isDayOpen(A, SUNDAY)).toBe(false);
  });

  it('a configured schedule with an absent day key treats that day as closed (not permissive)', () => {
    // Only Monday defined; Sunday key absent → closed, NOT "unconfigured".
    const monOnly: LocationSchedule = { mon: ['08:00-18:00'] };
    expect(isDayOpen(monOnly, SUNDAY)).toBe(false);
    expect(isDayOpen(monOnly, MONDAY)).toBe(true);
  });
});
