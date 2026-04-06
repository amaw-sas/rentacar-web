/**
 * Unit Tests: Date Conversion Utilities
 *
 * These tests document the expected behavior of date conversion functions
 * used in the Searcher component for bidirectional sync between:
 * - Store (string dates from URL params)
 * - Calendar (CalendarDate objects from @internationalized/date)
 */

import { describe, it, expect } from 'vitest';
import { parseDate, CalendarDate } from '@internationalized/date';

/**
 * stringToCalendarDate: Converts string → CalendarDate | null
 * Used when syncing from store/URL to calendar component
 */
function stringToCalendarDate(dateString: string | null): CalendarDate | null {
  if (!dateString) return null;
  try {
    return parseDate(dateString);
  } catch {
    return null;
  }
}

/**
 * calendarDateToString: Converts CalendarDate → string | null
 * Used when syncing from calendar component back to store
 */
function calendarDateToString(calendarDate: CalendarDate | null): string | null {
  if (!calendarDate) return null;
  return calendarDate.toString();
}

describe('Date Conversion Utilities', () => {
  describe('stringToCalendarDate', () => {
    it('should convert valid ISO date string to CalendarDate', () => {
      const result = stringToCalendarDate('2026-02-10');

      expect(result).not.toBeNull();
      expect(result?.year).toBe(2026);
      expect(result?.month).toBe(2);
      expect(result?.day).toBe(10);
    });

    it('should return null for empty/null input', () => {
      expect(stringToCalendarDate(null)).toBeNull();
      expect(stringToCalendarDate('')).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(stringToCalendarDate('invalid-date')).toBeNull();
      expect(stringToCalendarDate('2026-13-45')).toBeNull(); // Invalid month/day
      expect(stringToCalendarDate('not-a-date')).toBeNull();
    });

    it('should handle edge case dates', () => {
      // Leap year Feb 29
      const leapYear = stringToCalendarDate('2024-02-29');
      expect(leapYear).not.toBeNull();
      expect(leapYear?.day).toBe(29);

      // End of year
      const endOfYear = stringToCalendarDate('2026-12-31');
      expect(endOfYear).not.toBeNull();
      expect(endOfYear?.month).toBe(12);
      expect(endOfYear?.day).toBe(31);
    });
  });

  describe('calendarDateToString', () => {
    it('should convert CalendarDate to ISO string', () => {
      const date = new CalendarDate(2026, 2, 15);
      const result = calendarDateToString(date);

      expect(result).toBe('2026-02-15');
    });

    it('should return null for null input', () => {
      expect(calendarDateToString(null)).toBeNull();
    });

    it('should handle single-digit months/days with zero padding', () => {
      const date = new CalendarDate(2026, 3, 5); // March 5
      const result = calendarDateToString(date);

      expect(result).toBe('2026-03-05');
    });
  });

  describe('Bidirectional Conversion (Round-trip)', () => {
    it('should maintain data integrity through string → Calendar → string', () => {
      const original = '2026-02-10';
      const calendarDate = stringToCalendarDate(original);
      const converted = calendarDateToString(calendarDate);

      expect(converted).toBe(original);
    });

    it('should maintain data integrity through Calendar → string → Calendar', () => {
      const original = new CalendarDate(2026, 2, 15);
      const stringDate = calendarDateToString(original);
      const converted = stringToCalendarDate(stringDate);

      expect(converted?.year).toBe(original.year);
      expect(converted?.month).toBe(original.month);
      expect(converted?.day).toBe(original.day);
    });

    it('should handle null → null round-trip', () => {
      const calendarFromNull = stringToCalendarDate(null);
      const stringFromNull = calendarDateToString(null);

      expect(calendarFromNull).toBeNull();
      expect(stringFromNull).toBeNull();
    });
  });

  describe('Real-world URL Param Scenarios', () => {
    it('should handle typical URL date params from route', () => {
      // Simulates: /fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/
      const pickupDate = stringToCalendarDate('2026-02-10');
      const returnDate = stringToCalendarDate('2026-02-15');

      expect(pickupDate).not.toBeNull();
      expect(returnDate).not.toBeNull();

      // Verify date range is valid (return > pickup)
      expect(returnDate!.compare(pickupDate!)).toBeGreaterThan(0);
    });

    it('should handle missing or incomplete URL params gracefully', () => {
      // User navigates to page without date params
      const pickup = stringToCalendarDate(null);
      const returnD = stringToCalendarDate(undefined as any);

      expect(pickup).toBeNull();
      expect(returnD).toBeNull();
    });
  });
});
