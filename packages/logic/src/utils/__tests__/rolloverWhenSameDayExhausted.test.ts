import { describe, it, expect } from 'vitest'
import {
  rolloverWhenSameDayExhausted,
  createDateFromString,
  createDateTimeFromString,
} from '../useDateFunctions'

// When the searcher clamps an old pickup date to today but it is already too
// late for any same-day slot (1h lead past the last option), today is no longer
// bookable. The pickup must roll to tomorrow at the first slot ("00:00") so the
// form never emits a past-time search the results page rejects.

// Mirrors the real hour list, which runs 00:00 → 23:00 in 30-min steps.
const OPTS = [
  { value: '00:00' },
  { value: '12:00' },
  { value: '22:30' },
  { value: '23:00' },
]

describe('rolloverWhenSameDayExhausted', () => {
  it('returns null for a future pickup date (today is irrelevant)', () => {
    const pickup = createDateFromString('2026-08-02')
    const now = createDateTimeFromString('2026-08-01T23:30:00')
    expect(rolloverWhenSameDayExhausted(pickup, now, OPTS)).toBeNull()
  })

  it('returns null when today still has a valid slot', () => {
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T10:00:00')
    expect(rolloverWhenSameDayExhausted(pickup, now, OPTS)).toBeNull()
  })

  it('returns null at the exact boundary where the last slot is still 1h ahead', () => {
    // now 22:00 → earliest 23:00 → the 23:00 slot still qualifies
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T22:00:00')
    expect(rolloverWhenSameDayExhausted(pickup, now, OPTS)).toBeNull()
  })

  it('rolls to tomorrow at 00:00 when today is exhausted', () => {
    // now 22:15 → earliest 23:15 → no slot ≥ that → not bookable today
    const pickup = createDateFromString('2026-08-01')
    const now = createDateTimeFromString('2026-08-01T22:15:00')
    expect(rolloverWhenSameDayExhausted(pickup, now, OPTS)).toEqual({
      date: '2026-08-02',
      hour: '00:00',
    })
  })

  it('rolls across a month boundary', () => {
    const pickup = createDateFromString('2026-08-31')
    const now = createDateTimeFromString('2026-08-31T23:30:00')
    expect(rolloverWhenSameDayExhausted(pickup, now, OPTS)).toEqual({
      date: '2026-09-01',
      hour: '00:00',
    })
  })
})
