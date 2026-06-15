import { describe, it, expect } from 'vitest'
import {
  futurePickupHourOptions,
  SAME_DAY_PICKUP_LEAD_MINUTES,
  createDateFromString,
  createDateTimeFromString,
} from '../useDateFunctions'

// A customer choosing today as the pickup date must be offered only hours that
// are at least 1 hour ahead of "now" (SAME_DAY_PICKUP_LEAD_MINUTES) — earlier
// slots already passed or leave the branch too little lead time. Future dates
// keep every option. Pure: "now" is injected so the cases below are deterministic.

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
  it('uses a 1-hour same-day lead', () => {
    expect(SAME_DAY_PICKUP_LEAD_MINUTES).toBe(60)
  })

  it('keeps every option when the pickup date is in the future', () => {
    const pickup = createDateFromString('2026-08-02')
    const now = createDateTimeFromString('2026-08-01T17:05:00')
    expect(futurePickupHourOptions(OPTS, pickup, now)).toEqual(OPTS)
  })

  it('on today, includes a slot exactly 1 hour ahead and drops the nearer one', () => {
    // now 11:00 → earliest offered is 12:00; 11:30 (only 30 min away) is dropped
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T11:00:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
      '12:00',
      '17:00',
      '17:30',
      '18:00',
      '23:30',
    ])
  })

  it('on today, drops a slot less than 1 hour ahead', () => {
    // now 11:05 → 12:00 is only 55 min away, so it is excluded
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T11:05:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
      '17:00',
      '17:30',
      '18:00',
      '23:30',
    ])
  })

  it('drops everything within the next hour in the afternoon', () => {
    // now 17:05 → only 23:30 is ≥ 1 hour ahead (17:30 and 18:00 are too soon)
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T17:05:00')
    expect(futurePickupHourOptions(OPTS, pickup, now).map((o) => o.value)).toEqual([
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

  it('returns empty late at night, lead past midnight (caller falls back)', () => {
    // now 23:15 → earliest 00:15 next day → no same-day slot qualifies
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T23:15:00')
    expect(futurePickupHourOptions(OPTS, pickup, now)).toEqual([])
  })
})
