import { 
    toCalendarDateTime,
    DateFormatter,
    parseDate, 
    parseDateTime, 
    parseTime, 
    today
} from '@internationalized/date';
import type { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';

export type DateObject = CalendarDate;
export type DateTimeObject = CalendarDateTime;
export type TimeObject = Time;

const defaultTimezone = 'America/Bogota';

export function createCurrentDateObject(): DateObject {
    return today(defaultTimezone);
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