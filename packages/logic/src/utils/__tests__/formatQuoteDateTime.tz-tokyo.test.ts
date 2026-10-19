import { describe, it, expect, afterAll } from 'vitest';

// The weekday is computed from the civil date in UTC and the clock is read
// verbatim, so a runtime far ahead of Bogota must not shift either one.
// TZ is pinned BEFORE the dynamic import (see formatTime.tz.test.ts).
const originalTZ = process.env.TZ;
process.env.TZ = 'Asia/Tokyo';
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

const { formatQuoteDateTime } = await import('../useDateFunctions');

describe('formatQuoteDateTime — stable under TZ=Asia/Tokyo', () => {
  it('keeps weekday and clock of the civil date', () => {
    expect(new Date().getTimezoneOffset()).toBe(-540); // the pin took
    expect(formatQuoteDateTime('2026-10-16', '07:30')).toBe('viernes 16 oct. 7:30am');
    expect(formatQuoteDateTime('2026-10-16', '00:15')).toBe('viernes 16 oct. 12:15am');
  });
});
