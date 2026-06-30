/**
 * Dogfood hallazgo #2: una fecha de recogida pasada (deep-link / URL stale)
 * mostraba el toast "Revisa la HORA de recogida" cuando el problema real era la
 * FECHA. El predicado debe distinguir una fecha de calendario ya pasada de hoy
 * con una hora ya vencida, para que la UI apunte al campo correcto.
 *
 * SCEN-4: predicado puro pickupTimingIssue (determinístico, now inyectado).
 */
import { describe, it, expect } from 'vitest'
import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date'
import { pickupTimingIssue } from './pickupTimingIssue'

// now fijo: 2026-06-30 14:00 (mediodía pasado)
const now = new CalendarDateTime(2026, 6, 30, 14, 0)

describe('pickupTimingIssue', () => {
  it('past_date: pickup date before today (any hour)', () => {
    expect(pickupTimingIssue(new CalendarDate(2026, 1, 5), new Time(12, 0), now)).toBe(
      'past_date',
    )
    // even an hour later than `now` does not save a past calendar date
    expect(pickupTimingIssue(new CalendarDate(2026, 1, 5), new Time(23, 0), now)).toBe(
      'past_date',
    )
  })

  it('past_time: today with an hour already passed', () => {
    expect(pickupTimingIssue(new CalendarDate(2026, 6, 30), new Time(10, 0), now)).toBe(
      'past_time',
    )
  })

  it('null: today with a still-future hour', () => {
    expect(pickupTimingIssue(new CalendarDate(2026, 6, 30), new Time(18, 0), now)).toBe(
      null,
    )
  })

  it('null: a future calendar date', () => {
    expect(pickupTimingIssue(new CalendarDate(2026, 7, 1), new Time(8, 0), now)).toBe(null)
  })

  it('past_time: pickup moment exactly equal to now (boundary, mirrors original <= 0)', () => {
    expect(pickupTimingIssue(new CalendarDate(2026, 6, 30), new Time(14, 0), now)).toBe(
      'past_time',
    )
  })
})
