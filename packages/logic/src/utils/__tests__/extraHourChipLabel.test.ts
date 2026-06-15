import { describe, it, expect } from 'vitest'
import { createTimeFromString, extraHourChipLabel } from '../useDateFunctions'

// Searcher's extra-hour chip on the "Hora de devolución" selector.
//
// Compares the chosen return TIME-OF-DAY against pickup (not the full datetime),
// complementing the calendar-day chip. Whole-hour ceiling — any fraction of an
// hour rounds up — and once the difference passes the 4h grace window it bills a
// full day ("+1 día"). Nothing shows when the return hour is the same as or
// earlier than pickup.

const label = (pickup: string, return_: string) =>
  extraHourChipLabel(createTimeFromString(pickup), createTimeFromString(return_))

describe('extraHourChipLabel', () => {
  it('hides when the return hour equals pickup', () => {
    expect(label('12:00', '12:00')).toBeNull()
  })

  it('hides when the return hour is earlier than pickup', () => {
    // e.g. pickup 12:00 → return 10:00 next day: the calendar-day chip owns it
    expect(label('12:00', '10:00')).toBeNull()
  })

  it('hides when either time is missing', () => {
    expect(extraHourChipLabel(null, createTimeFromString('12:00'))).toBeNull()
    expect(extraHourChipLabel(createTimeFromString('12:00'), null)).toBeNull()
  })

  it('shows "+1 hora" (singular) for the first whole hour', () => {
    expect(label('12:00', '13:00')).toBe('+1 hora')
  })

  it('rounds any fraction of an hour up (ceiling)', () => {
    // 30 min into the first hour still reads "+1 hora"
    expect(label('12:00', '12:30')).toBe('+1 hora')
    // crossing into the next half-hour slot tips to the next whole hour
    expect(label('12:00', '13:30')).toBe('+2 horas')
  })

  it('counts whole extra hours up to the grace ceiling', () => {
    expect(label('12:00', '14:00')).toBe('+2 horas')
    expect(label('12:00', '15:00')).toBe('+3 horas')
    expect(label('12:00', '16:00')).toBe('+4 horas')
  })

  it('keeps "+4 horas" at exactly the 4h grace boundary', () => {
    // 4h00 leftover is still within grace → no full-day jump yet
    expect(label('12:00', '16:00')).toBe('+4 horas')
  })

  it('tips to "+1 día" once past the 4h grace window', () => {
    // 4h30 > grace
    expect(label('12:00', '16:30')).toBe('+1 día')
    // 5h and beyond
    expect(label('12:00', '17:00')).toBe('+1 día')
    expect(label('08:00', '20:00')).toBe('+1 día')
  })

  it('matches the reported case: 7 days + 7 hours shows "+1 día"', () => {
    // dates are handled by the day chip; the hour chip only sees +7h of day → +1 día
    expect(label('12:00', '19:00')).toBe('+1 día')
  })
})
