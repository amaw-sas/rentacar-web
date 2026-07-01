import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createDateFromString, dayDifference } from '../../utils/useDateFunctions'

// Issue #152 — day-count chip in the Searcher's return-date selector.
//
// `rentalDays` is the plain CALENDAR-day span between pickup and return (date
// subtraction, time-of-day ignored), deliberately distinct from `selectedDays`
// (billable days via rentalDayCount). It drives the floating chip and returns 0
// when either date is missing so the chip can hide.
//
// Two layers, mirroring selectedDays.test.ts (source-level to avoid booting
// Pinia/Nuxt auto-imports):
//   1. Wiring guard: the computed delegates to dayDifference and guards the
//      empty state.
//   2. Behavioral: dayDifference (the math, previously untested) over the
//      scenarios the chip renders.

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

describe('useStoreReservationForm — rentalDays wiring (issue #152)', () => {
  const block = extractComputed('rentalDays')

  it('delegates the span to the dayDifference util', () => {
    expect(block).toMatch(/dayDifference\(/)
  })

  it('subtracts the calendar dates, not the full datetimes', () => {
    expect(block).toContain('selectedPickupDate.value')
    expect(block).toContain('selectedReturnDate.value')
    // calendar-day span: must NOT fold in the selected hours
    expect(block).not.toContain('selectedPickupHour.value')
    expect(block).not.toContain('selectedReturnHour.value')
  })

  it('returns 0 when either date is missing (empty state hides the chip)', () => {
    expect(block).toMatch(/if \(!pickupDate \|\| !returnDate\) return 0/)
  })

  it('clamps an inverted range (return before pickup) to 0 so the chip hides (dogfood #3)', () => {
    // dayDifference uses Math.abs, so without this guard an inverted deep-link
    // range (return < pickup) would render a misleading positive "X días" chip.
    expect(block).toMatch(/returnDate\.compare\(pickupDate\)\s*<\s*0\)\s*return 0/)
  })

  it('is exposed from the store', () => {
    expect(source).toMatch(/^\s*rentalDays,\s*$/m)
  })
})

describe('rentalDays — calendar-day span behavior (dayDifference)', () => {
  const span = (from: string, to: string) =>
    dayDifference(createDateFromString(from), createDateFromString(to))

  it('counts the default pickup+1 → pickup+8 window as 7 days', () => {
    expect(span('2026-06-15', '2026-06-22')).toBe(7)
  })

  it('counts a single-day rental as 1', () => {
    expect(span('2026-06-15', '2026-06-16')).toBe(1)
  })

  it('counts the maximum 30-day window', () => {
    expect(span('2026-06-15', '2026-07-15')).toBe(30)
  })

  it('counts same pickup and return dates as 0', () => {
    expect(span('2026-06-15', '2026-06-15')).toBe(0)
  })

  it('ignores time-of-day (pure calendar subtraction)', () => {
    // dayDifference operates on CalendarDate objects (no time component), so the
    // span depends only on the dates — this is exactly the contract rentalDays
    // relies on to differ from billable selectedDays.
    expect(span('2026-06-15', '2026-06-18')).toBe(3)
  })
})
