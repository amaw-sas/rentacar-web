import { describe, it, expect } from 'vitest'

// Scenarios: docs/specs/issue-99-search-copy-day-count/scenarios/search-copy-day-count.scenarios.md
//
// rentalDayCount counts billable rental days between two datetimes. It bills
// each full 24h block plus one extra day when the leftover exceeds a 4h grace
// window, with a minimum of 1 day for any positive duration. This replaces the
// calendar-day + abs(hour-of-day) heuristic that over-counted by one day when
// the return time-of-day was earlier than pickup (issue #99).

import { createDateTimeFromString, rentalDayCount } from '../useDateFunctions'

const dt = (iso: string) => createDateTimeFromString(iso)

describe('rentalDayCount', () => {
  it('SCEN-001: 12pm → 5am next day (17h) counts 1 day, not 2', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-04T05:00:00'))).toBe(1)
  })

  it('SCEN-002: exactly 24h counts 1 day', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-04T12:00:00'))).toBe(1)
  })

  it('SCEN-003: 29h (leftover 5h > grace) counts 2 days', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-04T17:00:00'))).toBe(2)
  })

  it('SCEN-004: same day 9h counts 1 day', () => {
    expect(rentalDayCount(dt('2026-06-03T08:00:00'), dt('2026-06-03T17:00:00'))).toBe(1)
  })

  it('SCEN-005: same day 2h counts 1 day (minimum)', () => {
    expect(rentalDayCount(dt('2026-06-03T08:00:00'), dt('2026-06-03T10:00:00'))).toBe(1)
  })

  it('SCEN-006: 28h with leftover exactly 4h stays 1 day (grace is strictly > 4h)', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-04T16:00:00'))).toBe(1)
  })

  it('SCEN-006b: 28h01m (leftover just over grace) counts 2 days', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-04T16:01:00'))).toBe(2)
  })

  it('SCEN-007: 30-day monthly rental counts 30 days', () => {
    expect(rentalDayCount(dt('2026-06-01T12:00:00'), dt('2026-07-01T12:00:00'))).toBe(30)
  })

  it('SCEN-008: identical pickup/return counts 0 days', () => {
    expect(rentalDayCount(dt('2026-06-03T12:00:00'), dt('2026-06-03T12:00:00'))).toBe(0)
  })

  it('SCEN-008b: return before pickup counts 0 days', () => {
    expect(rentalDayCount(dt('2026-06-04T12:00:00'), dt('2026-06-03T12:00:00'))).toBe(0)
  })
})
