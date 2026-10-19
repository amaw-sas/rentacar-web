import { describe, it, expect } from 'vitest';
import { formatQuoteDateTime } from '../useDateFunctions';

describe('formatQuoteDateTime', () => {
  it('formats weekday, day, month and 12h clock', () => {
    expect(formatQuoteDateTime('2026-10-16', '07:30')).toBe('viernes 16 oct. 7:30am');
    expect(formatQuoteDateTime('2026-10-18', '08:00')).toBe('domingo 18 oct. 8:00am');
  });

  it('covers the 12h edges', () => {
    expect(formatQuoteDateTime('2026-10-16', '00:15')).toBe('viernes 16 oct. 12:15am');
    expect(formatQuoteDateTime('2026-10-16', '12:00')).toBe('viernes 16 oct. 12:00pm');
    expect(formatQuoteDateTime('2026-10-16', '13:05')).toBe('viernes 16 oct. 1:05pm');
    expect(formatQuoteDateTime('2026-10-16', '23:59')).toBe('viernes 16 oct. 11:59pm');
  });

  it('uses the fixed month table with a trailing dot', () => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    months.forEach((m, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatQuoteDateTime(`2026-${mm}-10`, '10:00')).toContain(` 10 ${m}. `);
    });
  });

  it('keeps the day number without leading zero', () => {
    expect(formatQuoteDateTime('2026-11-03', '09:00')).toBe('martes 3 nov. 9:00am');
  });

  it('returns empty string for empty or invalid input', () => {
    expect(formatQuoteDateTime('', '08:00')).toBe('');
    expect(formatQuoteDateTime('2026-10-16', '')).toBe('');
    expect(formatQuoteDateTime('not-a-date', '08:00')).toBe('');
    expect(formatQuoteDateTime('2026-10-16', '25:00')).toBe('');
    expect(formatQuoteDateTime('2026-13-40', '08:00')).toBe('');
  });
});
