import { describe, it, expect, afterAll } from 'vitest';

// SCEN-322-T01 — docs/specs/issue-322-pr7-dates-tz/scenarios/dates-tz.scenarios.md
//
// formatTime must return the WALL-CLOCK hour of the CalendarDateTime, immune to
// the runtime's timezone. The old DateFormatter carried no `timeZone`, so it
// re-expressed the Bogota instant in the PROCESS zone: under TZ=UTC a 08:30
// wall time rendered as "13:30" (and 00:00 as "05:00"), corrupting the stored
// hours and diverging SSR (UTC server) vs client (local zone).
//
// TZ is pinned BEFORE the module import: `import` hoists above statements, so a
// static import would let Intl cache the host zone first. The dynamic import
// guarantees the formatter (if any) is created under TZ=UTC.
const originalTZ = process.env.TZ;
process.env.TZ = 'UTC';
afterAll(() => {
  // Don't leak the pin to other test files sharing this worker process.
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

const { formatTime, toDatetime, createDateFromString, createTimeFromString } =
  await import('../useDateFunctions');

const datetime = (date: string, time: string) =>
  toDatetime(createDateFromString(date), createTimeFromString(time));

describe('formatTime — stable under any runtime TZ (SCEN-322-T01)', () => {
  it('returns the 08:30 wall time under TZ=UTC (not the +5h shifted 13:30)', () => {
    expect(new Date().getTimezoneOffset()).toBe(0); // the pin actually took
    expect(formatTime(datetime('2026-07-16', '08:30'))).toBe('08:30');
  });

  it('midnight stays "00:00" (the corrupted output was "05:00")', () => {
    expect(formatTime(datetime('2026-07-16', '00:00'))).toBe('00:00');
  });

  it('pads and keeps 24h format across the day', () => {
    expect(formatTime(datetime('2026-07-16', '09:05'))).toBe('09:05');
    expect(formatTime(datetime('2026-07-16', '12:00'))).toBe('12:00');
    expect(formatTime(datetime('2026-07-16', '23:30'))).toBe('23:30');
  });
});
