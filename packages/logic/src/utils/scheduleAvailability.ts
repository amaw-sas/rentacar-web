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
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
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
  // dow ∈ [0,6] and WEEKDAY_BY_DOW has 7 entries — always defined.
  return WEEKDAY_BY_DOW[dow]!;
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
    const [start = '', end = ''] = r.split('-');
    return { start: toMinutes(start), end: toMinutes(end) };
  });
  if (!ranges.length) return [];
  return slots.filter((slot) => {
    const m = toMinutes(slot.value);
    return ranges.some(({ start, end }) => m >= start && m <= end);
  });
}

/**
 * The open day nearest to `target` for this branch — issue #47 W6. Searches
 * outward by growing radius on both sides (forward wins ties so the rental isn't
 * shortened needlessly), never returning a day earlier than `floor`. Returns
 * `target` unchanged when it is already open or the schedule is permissive
 * (`{}`/`undefined`). `null` if no day opens within `maxRadius` (a degenerate
 * all-closed schedule — the caller keeps the raw target and the server validates).
 *
 * Used to snap the inherited "return date = pickup + 7" default off a closed day
 * instead of blocking the search button.
 */
export function nearestOpenDay(
  schedule: LocationSchedule | null | undefined,
  target: DateObject,
  floor?: DateObject | null,
  maxRadius = 31,
): DateObject | null {
  if (isDayOpen(schedule, target)) return target;
  for (let d = 1; d <= maxRadius; d++) {
    const forward = target.copy().add({ days: d });
    if (isDayOpen(schedule, forward)) return forward;
    const backward = target.copy().add({ days: -d });
    if ((!floor || backward.compare(floor) >= 0) && isDayOpen(schedule, backward)) {
      return backward;
    }
  }
  return null;
}

/**
 * The latest open day at or before `target`, never earlier than `floor`.
 *
 * The backward-only twin of `nearestOpenDay`, which prefers moving FORWARD on a
 * tie. Clamping a rental to its 30-day ceiling must never move the return date
 * past that ceiling, so a closed ceiling day has to walk back, not forward.
 * `null` when no open day exists in `[floor, target]` (degenerate all-closed
 * schedule — the caller keeps the raw target and the server validates).
 */
export function latestOpenDayOnOrBefore(
  schedule: LocationSchedule | null | undefined,
  target: DateObject,
  floor: DateObject,
  maxRadius = 31,
): DateObject | null {
  for (let d = 0; d <= maxRadius; d++) {
    const day = target.copy().add({ days: -d });
    if (day.compare(floor) < 0) return null;
    if (isDayOpen(schedule, day)) return day;
  }
  return null;
}

/**
 * The return date after the PICKUP date changes — issue #322 PR7.
 *
 * Preserves the rental DURATION already on screen: moving the pickup from D to
 * D+2 shifts a D+5 return to D+7 (still 5 days) instead of collapsing every
 * change to the +1 default, which destroyed the return the user had chosen.
 * Preserving the duration unconditionally is equivalent to the old behaviour
 * whenever the duration was 1, so no "chosen vs default" detection is needed.
 *
 * When the previous range is unknown or invalid (no previous pickup/return, or
 * return ≤ previous pickup — a corrupt deep-link), the duration clamps to the
 * 1-day minimum. The result snaps to an open day of the return branch
 * (nearestOpenDay) with a FLOOR of pickup + 1: the old floor was the pickup
 * itself, so a closed D+1 could land the "default" return ON the pickup day →
 * 0 billable days → doSearch dies in "Revisa las fechas". A degenerate
 * all-closed schedule keeps the raw target — the server validates as backstop.
 */
export function returnDateForPickupChange(
  schedule: LocationSchedule | null | undefined,
  newPickup: DateObject,
  previousPickup: DateObject | null,
  currentReturn: DateObject | null,
): DateObject {
  // CalendarDate#compare is the signed difference in days (Julian-day subtraction).
  const previousDuration =
    previousPickup && currentReturn ? currentReturn.compare(previousPickup) : 0;
  const duration = Math.max(1, previousDuration);

  const target = newPickup.copy().add({ days: duration });
  const floor = newPickup.copy().add({ days: 1 });
  return nearestOpenDay(schedule, target, floor) ?? target;
}

/**
 * The slot whose time is nearest `target` (absolute minute distance; ties break
 * toward the earlier slot) — issue #47 W6. `null` for an empty list. Used to snap
 * the inherited "return hour = pickup hour" default to the closest open hour
 * (e.g. a copied 15:00 onto a branch that closes 14:00 → 14:00, not 08:00).
 */
export function nearestSlotByTime<T extends { value: string }>(
  slots: T[],
  target: string,
): T | null {
  if (!slots.length) return null;
  const t = toMinutes(target);
  return slots.reduce((best, slot) =>
    Math.abs(toMinutes(slot.value) - t) < Math.abs(toMinutes(best.value) - t)
      ? slot
      : best,
  );
}
