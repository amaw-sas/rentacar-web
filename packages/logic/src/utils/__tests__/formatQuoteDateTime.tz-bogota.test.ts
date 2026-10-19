import { describe, it, expect, afterAll } from 'vitest';

// Bogota is UTC-5 (behind UTC): a weekday taken from local getDay() on a
// UTC-midnight Date would land on the previous day. Pin TZ BEFORE the dynamic
// import (see formatQuoteDateTime.tz-tokyo.test.ts).
const originalTZ = process.env.TZ;
process.env.TZ = 'America/Bogota';
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

const { formatQuoteDateTime } = await import('../useDateFunctions');

describe('formatQuoteDateTime — stable under TZ=America/Bogota', () => {
  it('keeps weekday and clock of the civil date', () => {
    expect(new Date().getTimezoneOffset()).toBe(300); // the pin took
    expect(formatQuoteDateTime('2026-10-16', '07:30')).toBe('viernes 16 oct. 7:30am');
  });

  it('keeps a Sunday on Sunday', () => {
    expect(formatQuoteDateTime('2026-10-18', '12:00')).toBe('domingo 18 oct. 12:00pm');
  });

  it('keeps year boundaries on the right weekday', () => {
    expect(formatQuoteDateTime('2026-01-01', '00:00')).toBe('jueves 1 ene. 12:00am');
    expect(formatQuoteDateTime('2026-12-31', '23:59')).toBe('jueves 31 dic. 11:59pm');
  });
});
