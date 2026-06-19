import { describe, it, expect } from 'vitest';
import { colombianHolidays, isHoliday } from '../colombianHolidays';
import { createDateFromString } from '../useDateFunctions';

// Issue #47 W3 — Colombian civic holiday calendar (Ley 51 de 1983 "Emiliani":
// movable holidays are observed the following Monday). Used by W2 to pick the
// `hol` schedule key on holidays. Dates verified against the 2026 Colombian
// calendar.
describe('colombianHolidays', () => {
  it('returns the 18 official Colombian holidays for a year', () => {
    expect(colombianHolidays(2026).size).toBe(18);
  });

  it('includes the fixed, non-movable holidays', () => {
    const h = colombianHolidays(2026);
    expect(h.has('2026-01-01')).toBe(true); // Año Nuevo
    expect(h.has('2026-05-01')).toBe(true); // Día del Trabajo
    expect(h.has('2026-07-20')).toBe(true); // Independencia
    expect(h.has('2026-08-07')).toBe(true); // Batalla de Boyacá
    expect(h.has('2026-12-08')).toBe(true); // Inmaculada Concepción
    expect(h.has('2026-12-25')).toBe(true); // Navidad
  });

  it('moves a movable holiday to the following Monday (Emiliani)', () => {
    const h = colombianHolidays(2026);
    // Reyes Magos is Jan 6 (a Tuesday in 2026) → observed Monday Jan 12.
    expect(h.has('2026-01-06')).toBe(false);
    expect(h.has('2026-01-12')).toBe(true);
  });

  it('keeps Easter-relative Holy Thursday/Friday on their actual dates (not moved)', () => {
    const h = colombianHolidays(2026);
    // Easter 2026 = April 5 → Jueves Santo Apr 2, Viernes Santo Apr 3.
    expect(h.has('2026-04-02')).toBe(true);
    expect(h.has('2026-04-03')).toBe(true);
  });

  it('observes Easter-relative movable holidays on a Monday (Ascensión)', () => {
    const h = colombianHolidays(2026);
    // Ascensión (Easter+39 = Thu May 14) → observed Monday May 18.
    expect(h.has('2026-05-18')).toBe(true);
  });
});

describe('isHoliday', () => {
  it('is true for a holiday date and false for an ordinary day', () => {
    expect(isHoliday(createDateFromString('2026-01-01'))).toBe(true);
    expect(isHoliday(createDateFromString('2026-01-12'))).toBe(true);
    expect(isHoliday(createDateFromString('2026-01-02'))).toBe(false);
    expect(isHoliday(createDateFromString('2026-04-06'))).toBe(false); // Easter Monday is NOT a holiday in Colombia
  });
});
