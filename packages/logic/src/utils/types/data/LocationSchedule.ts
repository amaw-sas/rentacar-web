/**
 * Structured per-branch operating hours — contract v2 (issue #47).
 *
 * Each day key holds an array of `"HH:MM-HH:MM"` ranges. Borders are aligned to
 * 30-minute slots; the upper border may be the sentinel `"24:00"` (end-of-day,
 * inclusive) for 24h branches. An absent key OR an empty array means CLOSED that
 * day. `hol` applies on Colombian holidays (Ley Emiliani), overriding the
 * weekday key. `display` is the human string derived in the dashboard and is the
 * only field rendered by the city pages.
 *
 * An empty object `{}` (no day keys) means UNCONFIGURED → permissive: the web
 * applies no proactive restriction and the server validates as backstop.
 */
export type ScheduleDayKey =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun'
  | 'hol';

export default interface LocationSchedule {
  mon?: string[];
  tue?: string[];
  wed?: string[];
  thu?: string[];
  fri?: string[];
  sat?: string[];
  sun?: string[];
  hol?: string[];
  /** Human-readable string derived from the structured ranges (dashboard-owned). */
  display?: string;
}
