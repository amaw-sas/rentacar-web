import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenarios: docs/specs/issue-99-search-copy-day-count/scenarios/search-copy-day-count.scenarios.md
//
// Wiring guard for `selectedDays` (issue #99). The day-count math lives in the
// pure `rentalDayCount` util — verified behaviorally in
// utils/__tests__/rentalDayCount.test.ts. This test guards that the store
// computed delegates to it using the FULL pickup/return datetimes (date +
// selected hour), so it can never regress to the calendar-day + abs(hour)
// heuristic that over-counted by one day. Source-level to avoid booting
// Pinia/Nuxt auto-imports, matching useStoreReservationForm.minReturnDate.test.ts.

const source = readFileSync(
  fileURLToPath(new URL('../useStoreReservationForm.ts', import.meta.url)),
  'utf8',
)

function extractComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  const end = source.indexOf('\n  });', start) + '\n  });'.length
  return source.slice(start, end)
}

describe('useStoreReservationForm — selectedDays delegates to rentalDayCount', () => {
  const block = extractComputed('selectedDays')

  it('delegates the day count to the rentalDayCount util', () => {
    expect(block).toMatch(/rentalDayCount\(/)
  })

  it('feeds rentalDayCount full datetimes built from date + selected hour', () => {
    expect(block).toMatch(/toDatetime\(/)
    expect(block).toContain('selectedPickupHour.value')
    expect(block).toContain('selectedReturnHour.value')
  })

  it('no longer relies on the calendar-day + abs(hour) heuristic', () => {
    expect(block).not.toMatch(/dayDifference\(/)
    expect(block).not.toMatch(/selectedHours\.value/)
  })

  it('imports rentalDayCount and no longer imports the dropped date helpers', () => {
    expect(source).toMatch(/rentalDayCount/)
    expect(source).not.toMatch(/\bdayDifference\b/)
    expect(source).not.toMatch(/\bhourDifference\b/)
  })
})
