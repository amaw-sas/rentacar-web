import { describe, it, expect } from 'vitest'
import { createTimeFromString, extraHourChipLabel } from '../useDateFunctions'

// Searcher's extra-hour chip on the "Hora de devolución" selector — and the
// "Tarifa adicional por horas extras" toast, which is gated by the same
// non-null result.
//
// The first full hour is free and silent: a return 1 h or less after pickup (or
// the same/earlier hour) shows nothing. From 1 h 30 on it counts COMPLETED extra
// hours (floor): 1h30 → "+1 hora", 2h00/2h30 → "+2 horas", up to "+4 horas".
// Five hours or more becomes a full day → "+1 día".

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

  it('hides within the first free hour (30 min and exactly 1 h)', () => {
    expect(label('12:00', '12:30')).toBeNull()
    expect(label('12:00', '13:00')).toBeNull()
  })

  it('shows "+1 hora" from 1 h 30', () => {
    expect(label('12:00', '13:30')).toBe('+1 hora')
  })

  it('floors completed hours (2 h and 2 h 30 both read "+2 horas")', () => {
    expect(label('12:00', '14:00')).toBe('+2 horas')
    expect(label('12:00', '14:30')).toBe('+2 horas')
  })

  it('reads "+3 horas" at 3 h and 3 h 30', () => {
    expect(label('12:00', '15:00')).toBe('+3 horas')
    expect(label('12:00', '15:30')).toBe('+3 horas')
  })

  it('reads "+4 horas" at 4 h and 4 h 30 (cap before the day jump)', () => {
    expect(label('12:00', '16:00')).toBe('+4 horas')
    expect(label('12:00', '16:30')).toBe('+4 horas')
  })

  it('tips to "+1 día" from 5 h onward', () => {
    expect(label('12:00', '17:00')).toBe('+1 día')
    expect(label('08:00', '20:00')).toBe('+1 día')
  })
})
