import { describe, it, expect } from 'vitest'
import {
  sameDayReturnHourOptions,
  SAME_DAY_RETURN_GAP_MINUTES,
  createTimeFromString,
} from '../useDateFunctions'

// When pickup and return fall on the same calendar day, the return must be at
// least 1 hour after the pickup hour (SAME_DAY_RETURN_GAP_MINUTES) so the rental
// never has zero/negative duration (the backend's same_hour_error). A different
// return day keeps every option. Pure: pickup hour is injected → deterministic.

const OPTS = [
  { value: '00:00' },
  { value: '08:00' },
  { value: '08:30' },
  { value: '09:00' },
  { value: '12:00' },
  { value: '23:00' },
  { value: '23:30' },
]

describe('sameDayReturnHourOptions', () => {
  it('uses a 1-hour same-day gap', () => {
    expect(SAME_DAY_RETURN_GAP_MINUTES).toBe(60)
  })

  it('keeps every option when return is NOT the same day as pickup', () => {
    expect(sameDayReturnHourOptions(OPTS, createTimeFromString('08:00'), false)).toEqual(OPTS)
  })

  it('keeps every option when there is no pickup hour yet', () => {
    expect(sameDayReturnHourOptions(OPTS, null, true)).toEqual(OPTS)
  })

  it('same day: includes the slot exactly 1 hour after pickup and drops nearer ones', () => {
    // pickup 08:00 → earliest return 09:00; 08:00 and 08:30 are dropped
    expect(
      sameDayReturnHourOptions(OPTS, createTimeFromString('08:00'), true).map((o) => o.value),
    ).toEqual(['09:00', '12:00', '23:00', '23:30'])
  })

  it('same day: drops a slot less than 1 hour after pickup', () => {
    // pickup 08:30 → earliest 09:30; 09:00 is only 30 min away, excluded
    expect(
      sameDayReturnHourOptions(OPTS, createTimeFromString('08:30'), true).map((o) => o.value),
    ).toEqual(['12:00', '23:00', '23:30'])
  })

  it('same day: returns empty when the pickup is too late for any same-day return', () => {
    // pickup 23:00 → earliest 00:00 next day → no same-day slot qualifies (caller falls back)
    expect(sameDayReturnHourOptions(OPTS, createTimeFromString('23:00'), true)).toEqual([])
  })

  it('respects a custom gap', () => {
    // 2-hour gap: pickup 08:00 → earliest 10:00; 09:00 dropped
    expect(
      sameDayReturnHourOptions(OPTS, createTimeFromString('08:00'), true, 120).map((o) => o.value),
    ).toEqual(['12:00', '23:00', '23:30'])
  })
})
