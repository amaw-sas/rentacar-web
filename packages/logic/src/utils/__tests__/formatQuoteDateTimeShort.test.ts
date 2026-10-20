import { describe, it, expect } from 'vitest';
import { formatQuoteDateTimeShort } from '../useDateFunctions';

describe('formatQuoteDateTimeShort', () => {
  it('uses the abbreviated weekday', () => {
    expect(formatQuoteDateTimeShort('2026-10-23', '07:30')).toBe('vie 23 oct. 7:30am');
    expect(formatQuoteDateTimeShort('2026-10-25', '10:30')).toBe('dom 25 oct. 10:30am');
  });

  it('covers every weekday', () => {
    const days = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    days.forEach((d, i) => {
      expect(formatQuoteDateTimeShort(`2026-10-${19 + i}`, '08:00')).toBe(`${d} ${19 + i} oct. 8:00am`);
    });
  });

  it('accepts :ss and covers 12h edges', () => {
    expect(formatQuoteDateTimeShort('2026-10-23', '07:30:00')).toBe('vie 23 oct. 7:30am');
    expect(formatQuoteDateTimeShort('2026-10-23', '00:15')).toBe('vie 23 oct. 12:15am');
    expect(formatQuoteDateTimeShort('2026-10-23', '12:00')).toBe('vie 23 oct. 12:00pm');
    expect(formatQuoteDateTimeShort('2026-10-23', '23:59')).toBe('vie 23 oct. 11:59pm');
  });

  it('returns empty on invalid input', () => {
    expect(formatQuoteDateTimeShort('', '07:30')).toBe('');
    expect(formatQuoteDateTimeShort('2026-10-23', '')).toBe('');
    expect(formatQuoteDateTimeShort('2026-13-40', '07:30')).toBe('');
    expect(formatQuoteDateTimeShort('2026-10-23', '25:00')).toBe('');
  });
});
