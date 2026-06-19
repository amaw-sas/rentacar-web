import type LocationSchedule from './types/data/LocationSchedule';
import type { ScheduleDayKey } from './types/data/LocationSchedule';
import type { DateObject } from './useDateFunctions';
import { isHoliday } from './colombianHolidays';

/**
 * Pure availability rules over a branch's structured schedule — issue #47 W2.
 *
 * No Vue/runtime dependency: the searcher (W4) calls these to restrict the
 * calendar and the hour selector per branch. Holidays resolve to the `hol` key
 * (W3); the slot list is injected so the canonical 30-min options stay the
 * single source. Buffer is 0 — the closing time itself is a bookable slot.
 *
 * Fallback: an unconfigured schedule (`{}`, `undefined`, or one with no day
 * keys) is PERMISSIVE — every slot, every day open — matching today's behavior
 * for branches operations has not configured. The server validates as backstop.
 */

const DAY_KEYS: ScheduleDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'hol'];

// Index by UTC day-of-week (0 = Sunday … 6 = Saturday).
const WEEKDAY_BY_DOW: ScheduleDayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Minutes since midnight. The sentinel "24:00" maps to 1440 (end-of-day inclusive). */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** A schedule is "configured" once it carries at least one day-key array. */
function isConfigured(schedule: LocationSchedule | null | undefined): schedule is LocationSchedule {
  return !!schedule && DAY_KEYS.some((k) => Array.isArray(schedule[k]));
}

/** The schedule key in effect for a date: `hol` on holidays, else the weekday. */
function effectiveKey(date: DateObject): ScheduleDayKey {
  if (isHoliday(date)) return 'hol';
  const dow = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return WEEKDAY_BY_DOW[dow];
}

/**
 * Open time ranges (`"HH:MM-HH:MM"`) for a date. Unconfigured → fully open
 * (`["00:00-24:00"]`); a closed day → `[]`.
 */
export function openRangesForDate(
  schedule: LocationSchedule | null | undefined,
  date: DateObject,
): string[] {
  if (!isConfigured(schedule)) return ['00:00-24:00'];
  return schedule[effectiveKey(date)] ?? [];
}

/** Whether the branch is open at all on a date (drives calendar `is-date-unavailable`). */
export function isDayOpen(
  schedule: LocationSchedule | null | undefined,
  date: DateObject,
): boolean {
  return openRangesForDate(schedule, date).length > 0;
}

/**
 * The subset of `slots` bookable on `date` for this branch — the intersection of
 * the 30-min options with the day's open ranges. Closing edge included (buffer 0).
 */
export function bookableSlotsForDate<T extends { value: string }>(
  schedule: LocationSchedule | null | undefined,
  date: DateObject,
  slots: T[],
): T[] {
  const ranges = openRangesForDate(schedule, date).map((r) => {
    const [start, end] = r.split('-');
    return { start: toMinutes(start), end: toMinutes(end) };
  });
  if (!ranges.length) return [];
  return slots.filter((slot) => {
    const m = toMinutes(slot.value);
    return ranges.some(({ start, end }) => m >= start && m <= end);
  });
}
