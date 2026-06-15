import { describe, it, expect } from 'vitest'
import {
  futurePickupHourOptions,
  createDateFromString,
  createDateTimeFromString,
} from '../useDateFunctions'

// A customer choosing today as the pickup date must not be offered an hour that
// already passed (e.g. it's 5:05 p.m. and they pick noon) — the backend rejects
// that pickup. futurePickupHourOptions trims the hour list to slots strictly
// after "now" on the same day, and leaves future dates untouched. Pure: "now"
// is injected so the cases below are deterministic.

const OPTS = [
  { value: '00:00' },
  { value: '11:30' },
  { value: '12:00' },
  { value: '17:00' },
  { value: '17:30' },
  { value: '18:00' },
  { value: '23:30' },
]

describe('futurePickupHourOptions', () => {
  it('keeps every option when the pickup date is in the future', () => {
    const pickup = createDateFromString('2026-08-02')
    const now = createDateTimeFromString('2026-08-01T17:05:00')
    expect(futurePickupHourOptions(OPTS, pickup, now)).toEqual(OPTS)
  })

  it('on today, drops slots at or before the current time', () => {
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T17:05:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
      '17:30',
      '18:00',
      '23:30',
    ])
  })

  it('on today, a slot exactly equal to now is excluded (strictly after)', () => {
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T17:30:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
      '18:00',
      '23:30',
    ])
  })

  it('just after midnight keeps the rest of the day but drops 00:00', () => {
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T00:01:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
      '11:30',
      '12:00',
      '17:00',
      '17:30',
      '18:00',
      '23:30',
    ])
  })

  it('returns empty late at night (caller is responsible for the fallback)', () => {
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T23:45:00')
    expect(futurePickupHourOptions(OPTS, pickup, now)).toEqual([])
  })
})
