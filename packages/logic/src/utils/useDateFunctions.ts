import {
    toCalendarDateTime,
    DateFormatter,
    parseDate,
    parseDateTime,
    parseTime,
    today,
    now,
    Time
} from '@internationalized/date';
import type { CalendarDate, CalendarDateTime } from '@internationalized/date';

export type DateObject = CalendarDate;
export type DateTimeObject = CalendarDateTime;
export type TimeObject = Time;

const defaultTimezone = 'America/Bogota';

export function createCurrentDateObject(): DateObject {
    return today(defaultTimezone);
}

/**
 * Current wall-clock datetime in the app timezone (America/Bogota), as a
 * CalendarDateTime. Used to compare a chosen pickup moment against "now".
 */
export function createCurrentDateTimeObject(): DateTimeObject {
    return toCalendarDateTime(now(defaultTimezone));
}

/**
 * Minimum lead time, in minutes, for a same-day pickup: the earliest hour we
 * offer when the customer picks today is at least this far ahead of "now".
 */
export const SAME_DAY_PICKUP_LEAD_MINUTES = 60;

/**
 * Filter pickup-hour options to those still valid for `pickupDate` relative to
 * `nowDateTime`. When `pickupDate` is the same calendar day as `nowDateTime`,
 * only keep slots at least SAME_DAY_PICKUP_LEAD_MINUTES (1 hour) ahead of the
 * current time, so a customer can't pick an hour that already passed or is too
 * soon for the branch to prepare the car. Any future date keeps every option.
 * Works in minutes-of-day so a late-night "now" (lead past midnight) trims to
 * empty and lets the caller fall back. Pure (now is injected) → unit-testable.
 */
export function futurePickupHourOptions<T extends { value: string }>(
    options: T[],
    pickupDate: DateObject,
    nowDateTime: DateTimeObject,
): T[] {
    const sameDay =
        pickupDate.year === nowDateTime.year &&
        pickupDate.month === nowDateTime.month &&
        pickupDate.day === nowDateTime.day;
    if (!sameDay) return options;

    const earliestMinutes =
        nowDateTime.hour * 60 + nowDateTime.minute + SAME_DAY_PICKUP_LEAD_MINUTES;
    return options.filter((opt) => {
        const slot = parseTime(opt.value);
        return slot.hour * 60 + slot.minute >= earliestMinutes;
    });
}

/**
 * Minimum rental length, in minutes, when pickup and return fall on the SAME
 * day: the return must be at least this far after the pickup hour. Below this a
 * same-day rental has zero/negative duration, which the backend rejects with
 * `same_hour_error`.
 */
export const SAME_DAY_RETURN_GAP_MINUTES = 60;

/**
 * Filter return-hour options for the chosen return day. When the return lands on
 * the same calendar day as pickup, only keep slots at least
 * SAME_DAY_RETURN_GAP_MINUTES (1 hour) after the pickup hour — so a 8 a.m.
 * pickup can be returned the same day from 9 a.m. on, never at/ before pickup.
 * A different (later) return day keeps every option; branch opening hours are
 * enforced server-side. Returns empty when the pickup is so late no same-day
 * slot remains (caller falls back). Pure (pickup hour injected) → unit-testable.
 */
export function sameDayReturnHourOptions<T extends { value: string }>(
    options: T[],
    pickupHour: TimeObject | null,
    sameDay: boolean,
    minGapMinutes: number = SAME_DAY_RETURN_GAP_MINUTES,
): T[] {
    if (!sameDay || !pickupHour) return options;

    const earliestMinutes = pickupHour.hour * 60 + pickupHour.minute + minGapMinutes;
    return options.filter((opt) => {
        const slot = parseTime(opt.value);
        return slot.hour * 60 + slot.minute >= earliestMinutes;
    });
}

/**
 * Decide whether a chosen pickup must roll forward because today is no longer
 * bookable. When `pickupDate` is today AND no same-day hour is still valid (it is
 * too late for the lead time, e.g. 11 p.m.), the earliest bookable pickup is
 * tomorrow at the first slot ("00:00"). Returns the corrected { date, hour } in
 * those cases, or null when today is still bookable or the date is in the future.
 *
 * Keeps the searcher from emitting a past-time search the results page rejects.
 * Pure (now + options injected) → deterministic and unit-testable.
 */
export function rolloverWhenSameDayExhausted(
    pickupDate: DateObject,
    nowDateTime: DateTimeObject,
    hourOptions: { value: string }[],
): { date: string; hour: string } | null {
    const isToday =
        pickupDate.year === nowDateTime.year &&
        pickupDate.month === nowDateTime.month &&
        pickupDate.day === nowDateTime.day;
    if (!isToday) return null;
    if (futurePickupHourOptions(hourOptions, pickupDate, nowDateTime).length > 0) return null;

    return { date: pickupDate.add({ days: 1 }).toString(), hour: '00:00' };
}

export function createDateFromString(
    date_string: string,
): DateObject {
    return parseDate(date_string);
}

export function createDateTimeFromString(
    datetime_string: string,
): DateTimeObject {
    return parseDateTime(datetime_string);
}

export function createTimeFromString(
    time_string: string,
): TimeObject {
    return parseTime(time_string)
}

/**
 * create a datetime object from joining a date and time objects
 * @param date Date object
 * @param time Time object
 * @returns DatetimeObject
 */
export function toDatetime(date: DateObject, time: TimeObject){
    return toCalendarDateTime(date, time);
}

/**
 * format date to human readable
 * @param date Date object
 * @returns string
 */
export function formatHumanDate(date: DateObject){
    return new DateFormatter('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: defaultTimezone
    }).format(date.toDate(defaultTimezone))
}

/**
 * format date to human readable with a SHORT month (e.g. "1 de sept de 2026").
 * Used where space is tight (search-results banner); the full-month
 * formatHumanDate stays for the reservation summary / share text.
 */
export function formatHumanDateShort(date: DateObject){
    return new DateFormatter('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: defaultTimezone
    }).format(date.toDate(defaultTimezone))
}

/**
 * format a datetime object to human readable (hh:mm a)
 * @param datetime 
 * @returns 
 */
export function formatHumanTime(datetime: DateTimeObject){
    return new DateFormatter('es-CO', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: defaultTimezone
    }).format(datetime.toDate(defaultTimezone))
}

/**
 * format a datetime object to (HH:mm)
 * @param datetime 
 * @returns 
 */
export function formatTime(datetime: DateTimeObject){
    return new DateFormatter('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(datetime.toDate(defaultTimezone))
}

/**
 * returns day difference between two dates
 * @param date_from Date init
 * @param date_to Date end
 * @returns number
 */
export function dayDifference(
    date_from: DateObject | DateTimeObject,
    date_to: DateObject | DateTimeObject,
): number {
    const jsDateFrom = date_from.toDate('UTC');
    const jsDateTo = date_to.toDate('UTC');

    // calculate difference between dates in miliseconds
    const diff = Math.abs(jsDateTo.getTime() - jsDateFrom.getTime())

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * return hour difference between two datetimes or times object
 * @param time_from Datetime or Time init
 * @param time_to Datetime or Time end
 * @returns number
 */
export function hourDifference(
    time_from: TimeObject | DateTimeObject,
    time_to: TimeObject | DateTimeObject,
): number {
    if(isTimeObject(time_from) && isTimeObject(time_to)){
        const diffHours = time_to.hour - time_from.hour;
        const diffMinutes = time_to.minute - time_from.minute;
        const diffSeconds = time_to.second - time_from.second;
        const diffMilliSeconds = time_to.millisecond - time_from.millisecond;

        return Math.abs(
            diffHours + (diffMinutes / 60) + (diffSeconds / 3600) + (diffMilliSeconds / 3600000)
        )
    }
    else if(isDateTimeObject(time_from) && isDateTimeObject(time_to)){
        const jsTimeFrom = time_from.toDate('UTC');
        const jsTimeTo = time_to.toDate('UTC');

        const diff = Math.abs(jsTimeTo.getTime() - jsTimeFrom.getTime())

        return Math.ceil(diff / (100 * 60 * 60));
    }
    else return 0;
}

/**
 * Hours past a full 24h block that are NOT billed as an extra day (grace window).
 * Single source of truth: shared by rentalDayCount (billing) and the Searcher's
 * extra-hour chip (extraHoursLabel) so neither drifts from the other.
 */
export const GRACE_HOURS = 4;

/**
 * Counts billable rental days between two datetimes.
 *
 * Bills each full 24h block, plus one extra day when the leftover beyond the
 * last full block exceeds the GRACE_HOURS window. Any positive duration bills at
 * least one day. Returns 0 when the return is not strictly after the pickup.
 *
 * Replaces the prior calendar-day + abs(hour-of-day) heuristic, which
 * over-counted by one day when the return time-of-day was earlier than pickup
 * (e.g. 12 p. m. → 5 a. m. next day = 17 h was counted as 2 days). See issue #99.
 *
 * @param pickup pickup datetime
 * @param return_ return datetime
 * @returns number of billable days
 */
export function rentalDayCount(
    pickup: DateTimeObject,
    return_: DateTimeObject,
): number {
    const totalHours =
        (return_.toDate('UTC').getTime() - pickup.toDate('UTC').getTime()) / (1000 * 60 * 60);

    if (totalHours <= 0) return 0;

    const fullDays = Math.floor(totalHours / 24);
    const leftoverHours = totalHours - fullDays * 24;
    const days = fullDays + (leftoverHours > GRACE_HOURS ? 1 : 0);

    return days === 0 ? 1 : days;
}

/**
 * Builds the Searcher's extra-hour chip label from the chosen pickup/return
 * TIMES-OF-DAY (not full datetimes). The first full hour is free and silent:
 * a return 1 h or less after pickup (or the same/earlier hour) shows nothing.
 * From 1 h 30 on it counts COMPLETED extra hours (floor) — 1h30 → "+1 hora",
 * 2h00/2h30 → "+2 horas", … up to GRACE_HOURS ("+4 horas"). Beyond that the
 * surcharge becomes a full extra day → "+1 día".
 *
 * This same non-null/null result also gates the "Tarifa adicional por horas
 * extras" toast in useSearch, so the toast and the chip always agree.
 *
 * Hour-of-day (not datetime) on purpose: it complements the calendar-day chip,
 * which already counts the day when the return hour is earlier than pickup.
 *
 * @param pickupHour chosen pickup time-of-day
 * @param returnHour chosen return time-of-day
 * @returns chip label, or null when nothing extra applies
 */
export function extraHourChipLabel(
    pickupHour: TimeObject | null,
    returnHour: TimeObject | null,
): string | null {
    if (!pickupHour || !returnHour) return null;

    const diffMinutes =
        (returnHour.hour * 60 + returnHour.minute) -
        (pickupHour.hour * 60 + pickupHour.minute);
    // First full hour is grace → nothing shown for <= 1 h (and same/earlier).
    if (diffMinutes <= 60) return null;

    const extraHours = Math.floor(diffMinutes / 60);
    if (extraHours > GRACE_HOURS) return '+1 día';
    return extraHours === 1 ? '+1 hora' : `+${extraHours} horas`;
}

export function isTimeObject(obj: TimeObject | DateTimeObject | null): obj is TimeObject {
    return obj !== null && !('toDate' in obj)
}

export function isDateTimeObject(obj: TimeObject | DateTimeObject | null): obj is DateTimeObject {
    return obj !== null && 'hour' in obj
}

export function isDateObject(obj: any): obj is DateObject {
    return obj !== null && 'toDate' in obj;
}

/**
 * Format a datetime object to 12h format (hh:mm[am|pm])
 * @param datetime DateTimeObject
 * @returns string - formato: "01:00pm", "12:00am"
 */
export function formatTime12h(datetime: DateTimeObject): string {
  const hour = datetime.hour;
  const minute = datetime.minute.toString().padStart(2, '0');

  // Convert 24h to 12h
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'pm' : 'am';

  return `${hour12.toString().padStart(2, '0')}:${minute}${period}`;
}

/**
 * Parse time string in either 12h or 24h format
 * @param timeString - "13:00" (24h) or "01:00pm" (12h)
 * @returns TimeObject or null if invalid
 */
export function parseTime12hOr24h(timeString: string): TimeObject | null {
  // Try 24h format first (existing behavior)
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    try {
      return parseTime(timeString);
    } catch {
      return null;
    }
  }

  // Try 12h format: 01:00pm, 12:30am
  const match = timeString.match(/^(\d{2}):(\d{2})(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  // Convert to 24h
  if (period === 'am') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  try {
    return parseTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  } catch {
    return null;
  }
}

/**
 * Check if time string is in 12h format (hh:mm[am|pm])
 * @param timeString - time string to check
 * @returns true if format is 12h
 */
export function isTime12hFormat(timeString: string): boolean {
  return /^\d{1,2}:\d{2}(am|pm)$/i.test(timeString);
}

/**
 * Check if time string is in 24h format (HH:mm)
 * @param timeString - time string to check
 * @returns true if format is 24h
 */
export function isTime24hFormat(timeString: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeString);
}