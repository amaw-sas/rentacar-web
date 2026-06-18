import type { DateObject } from './useDateFunctions';

/**
 * Colombian civic holiday calendar — issue #47 W3.
 *
 * Implements Ley 51 de 1983 ("Ley Emiliani"): a set of holidays that do not
 * fall on a Monday are observed the FOLLOWING Monday. Fixed holidays
 * (Año Nuevo, Trabajo, Independencia, Boyacá, Inmaculada, Navidad) and the two
 * Holy-Week days (Jueves/Viernes Santo) stay on their actual date.
 *
 * Pure and deterministic (input year → output dates). Consumed by the searcher's
 * availability rules (W2) to apply the branch's `hol` schedule on holidays.
 * All Colombia is America/Bogota (UTC-5, no DST); weekday math is done in UTC on
 * pure calendar dates, which is timezone-agnostic for a day-of-week.
 */

type YMD = { year: number; month: number; day: number };

/** Day of week in UTC: 0 = Sunday … 6 = Saturday. */
function dayOfWeek({ year, month, day }: YMD): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addDays({ year, month, day }: YMD, days: number): YMD {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Emiliani: if the date is not a Monday, observe it the following Monday. */
function toNextMonday(ymd: YMD): YMD {
  const dow = dayOfWeek(ymd);
  const add = (1 - dow + 7) % 7; // 0 when already Monday
  return add === 0 ? ymd : addDays(ymd, add);
}

/**
 * Easter Sunday for a Gregorian year — anonymous Gregorian algorithm
 * (Meeus/Jones/Butcher). Returns the month (3=March, 4=April) and day.
 */
function easterSunday(year: number): YMD {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function iso({ year, month, day }: YMD): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const cache = new Map<number, Set<string>>();

/**
 * The set of Colombian holiday dates (ISO `YYYY-MM-DD`) for a given year.
 * Memoized per year — the calendar is fixed once the year is known.
 */
export function colombianHolidays(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const dates: YMD[] = [];

  // Fixed, non-movable.
  dates.push(
    { year, month: 1, day: 1 },   // Año Nuevo
    { year, month: 5, day: 1 },   // Día del Trabajo
    { year, month: 7, day: 20 },  // Independencia
    { year, month: 8, day: 7 },   // Batalla de Boyacá
    { year, month: 12, day: 8 },  // Inmaculada Concepción
    { year, month: 12, day: 25 }, // Navidad
  );

  // Fixed but Emiliani-movable (observed the following Monday).
  for (const base of [
    { year, month: 1, day: 6 },   // Reyes Magos
    { year, month: 3, day: 19 },  // San José
    { year, month: 6, day: 29 },  // San Pedro y San Pablo
    { year, month: 8, day: 15 },  // Asunción de la Virgen
    { year, month: 10, day: 12 }, // Día de la Raza
    { year, month: 11, day: 1 },  // Todos los Santos
    { year, month: 11, day: 11 }, // Independencia de Cartagena
  ]) {
    dates.push(toNextMonday(base));
  }

  // Easter-relative, non-movable (Holy Week).
  const easter = easterSunday(year);
  dates.push(addDays(easter, -3)); // Jueves Santo
  dates.push(addDays(easter, -2)); // Viernes Santo

  // Easter-relative, Emiliani-movable.
  dates.push(toNextMonday(addDays(easter, 39))); // Ascensión del Señor
  dates.push(toNextMonday(addDays(easter, 60))); // Corpus Christi
  dates.push(toNextMonday(addDays(easter, 68))); // Sagrado Corazón

  const set = new Set(dates.map(iso));
  cache.set(year, set);
  return set;
}

/** True when the calendar date is a Colombian holiday. */
export function isHoliday(date: DateObject): boolean {
  return colombianHolidays(date.year).has(date.toString());
}
