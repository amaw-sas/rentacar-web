import { describe, expect, it } from 'vitest'
import { evaluateWhatsappVisibility } from '../useChatStatus'
import type { WhatsappSchedule } from '../useChatStatus'

// SCEN S1/S2/S5/S4 — WhatsApp FAB visibility windows (Bogota civil time, UTC−5,
// no DST). `evaluateWhatsappVisibility(schedule, nowUtc)` is a pure predicate:
// true = show WhatsApp. All instants below are UTC; the −5h shift lands them on
// the intended Bogota weekday/time (verified: 2026-07-21 is a Tuesday,
// 2026-07-25 a Saturday, 2026-07-26 a Sunday).

// Standard week: weekdays 08:00–18:00, Saturday 07:00–16:00, Sunday closed.
const STANDARD: WhatsappSchedule = {
  mon: ['08:00-18:00'],
  tue: ['08:00-18:00'],
  wed: ['08:00-18:00'],
  thu: ['08:00-18:00'],
  fri: ['08:00-18:00'],
  sat: ['07:00-16:00'],
}

const at = (iso: string) => new Date(iso)

describe('evaluateWhatsappVisibility — standard schedule (S1/S2)', () => {
  it('S1 — Tuesday 10:00 Bogota is inside the window → visible', () => {
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-21T15:00:00Z'))).toBe(true)
  })

  it('S2 — Tuesday 20:00 Bogota is after close → hidden', () => {
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-22T01:00:00Z'))).toBe(false)
  })

  it('S2 — Saturday 17:00 Bogota is after the 16:00 close → hidden', () => {
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-25T22:00:00Z'))).toBe(false)
  })

  it('S2 — Sunday 11:00 Bogota with no Sunday window → hidden', () => {
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-26T16:00:00Z'))).toBe(false)
  })

  it('boundary — Saturday 15:59 Bogota is still inside [07:00, 16:00) → visible', () => {
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-25T20:59:00Z'))).toBe(true)
  })

  it('boundary — Saturday 16:00 Bogota is the exclusive end → hidden', () => {
    // 16:00 Bogota = 21:00Z Saturday.
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-25T21:00:00Z'))).toBe(false)
  })

  it('boundary — weekday 08:00 Bogota is the inclusive start → visible', () => {
    // Tuesday 08:00 Bogota = 13:00Z.
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-21T13:00:00Z'))).toBe(true)
  })
})

describe('evaluateWhatsappVisibility — no midnight crossing (S5)', () => {
  it('Saturday 07:00–16:00 with Sunday closed → Sunday 02:00 Bogota is hidden', () => {
    // Sunday 02:00 Bogota = Sunday 07:00Z. A visibility window never wraps past
    // midnight, so Saturday's window does not leak into Sunday morning.
    expect(evaluateWhatsappVisibility(STANDARD, at('2026-07-26T07:00:00Z'))).toBe(false)
  })
})

describe('evaluateWhatsappVisibility — fail-open is reserved for shape faults (S4)', () => {
  it('null schedule → always visible', () => {
    expect(evaluateWhatsappVisibility(null, at('2026-07-22T01:00:00Z'))).toBe(true)
  })

  it('undefined schedule → always visible', () => {
    expect(evaluateWhatsappVisibility(undefined, at('2026-07-22T01:00:00Z'))).toBe(true)
  })

  it('non-object schedule → always visible (payload is not a schedule at all)', () => {
    expect(evaluateWhatsappVisibility('nope' as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
    expect(evaluateWhatsappVisibility(42 as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
    expect(evaluateWhatsappVisibility([] as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
    expect(evaluateWhatsappVisibility(true as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
  })

  it('active day present but not a list → fail-open visible (shape fault)', () => {
    // Tuesday 20:00 Bogota; tue is a string / null instead of an array.
    expect(evaluateWhatsappVisibility({ tue: '08:00-18:00' } as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
    expect(evaluateWhatsappVisibility({ tue: null } as unknown, at('2026-07-22T01:00:00Z'))).toBe(true)
  })

  it('an unusable clock (Invalid Date) → fail-open visible', () => {
    expect(evaluateWhatsappVisibility(STANDARD, new Date('not-a-date'))).toBe(true)
  })
})

// The canonical contract shared with the dashboard: an empty object is a VALID
// schedule meaning "no windows anywhere", NOT a malformed payload. Only
// null/undefined means "no schedule configured → always visible".
describe('evaluateWhatsappVisibility — {} is a valid schedule → hidden ALL week', () => {
  // One instant per Bogota weekday (midday, so no boundary effects).
  const middayPerWeekday: Array<[string, string]> = [
    ['sun', '2026-07-26T17:00:00Z'],
    ['mon', '2026-07-27T17:00:00Z'],
    ['tue', '2026-07-21T17:00:00Z'],
    ['wed', '2026-07-22T17:00:00Z'],
    ['thu', '2026-07-23T17:00:00Z'],
    ['fri', '2026-07-24T17:00:00Z'],
    ['sat', '2026-07-25T17:00:00Z'],
  ]

  it.each(middayPerWeekday)('{} hides WhatsApp on %s', (_day, iso) => {
    expect(evaluateWhatsappVisibility({} as unknown, at(iso))).toBe(false)
  })

  it('an object whose keys are all unrecognized behaves like {} → hidden', () => {
    // No weekday key matches, so every day resolves to "no window configured".
    expect(evaluateWhatsappVisibility({ foo: ['08:00-18:00'] } as unknown, at('2026-07-21T15:00:00Z'))).toBe(false)
    expect(evaluateWhatsappVisibility({ lunes: ['08:00-18:00'] } as unknown, at('2026-07-27T17:00:00Z'))).toBe(false)
  })
})

// D6 — a typo must not swing the day open. A malformed range simply opens no
// window; well-formed ranges beside it keep working.
describe('evaluateWhatsappVisibility — malformed ranges are IGNORED, not fail-open', () => {
  it('a lone malformed range leaves the day closed', () => {
    // Tuesday 20:00 Bogota; the only range is unparseable → no window at all.
    expect(evaluateWhatsappVisibility({ tue: ['8-18'] } as unknown, at('2026-07-22T01:00:00Z'))).toBe(false)
    expect(evaluateWhatsappVisibility({ tue: ['08:00_18:00'] } as unknown, at('2026-07-22T01:00:00Z'))).toBe(false)
    expect(evaluateWhatsappVisibility({ tue: ['25:00-26:00'] } as unknown, at('2026-07-22T01:00:00Z'))).toBe(false)
  })

  it("the reviewer's counterexample: a single missing digit no longer opens Sunday 24h", () => {
    // Sunday 03:00 Bogota = 08:00Z. '8:00-16:00' (missing leading zero) is
    // malformed; before D6 this returned true and left Sunday open all day.
    expect(evaluateWhatsappVisibility({ sun: ['8:00-16:00'] } as unknown, at('2026-07-26T08:00:00Z'))).toBe(false)
  })

  it('a malformed range does not disturb a valid sibling range', () => {
    const mixed = { tue: ['garbage', '08:00-18:00'] } as unknown
    // Tuesday 10:00 Bogota → inside the valid window despite the bad sibling.
    expect(evaluateWhatsappVisibility(mixed, at('2026-07-21T15:00:00Z'))).toBe(true)
    // Tuesday 20:00 Bogota → outside it; the bad sibling must not open the day.
    expect(evaluateWhatsappVisibility(mixed, at('2026-07-22T01:00:00Z'))).toBe(false)
  })

  it('a non-string range entry is ignored the same way', () => {
    const weird = { tue: [{ start: '08:00', end: '18:00' }, '08:00-18:00'] } as unknown
    expect(evaluateWhatsappVisibility(weird, at('2026-07-21T15:00:00Z'))).toBe(true)
    expect(evaluateWhatsappVisibility(weird, at('2026-07-22T01:00:00Z'))).toBe(false)
  })
})

describe('evaluateWhatsappVisibility — explicit closed day vs open window', () => {
  it('empty array for the active day → hidden that day', () => {
    // Tuesday 10:00 Bogota; tue explicitly empty.
    expect(evaluateWhatsappVisibility({ tue: [] } as unknown, at('2026-07-21T15:00:00Z'))).toBe(false)
  })

  it('absent active day but other valid days present → hidden that day', () => {
    // Tuesday 10:00 Bogota; only mon is configured.
    expect(evaluateWhatsappVisibility({ mon: ['08:00-18:00'] } as unknown, at('2026-07-21T15:00:00Z'))).toBe(false)
  })

  it('multiple windows in a day — inside the second window → visible', () => {
    // Tuesday 20:00 Bogota; split shift covers the evening.
    const split: WhatsappSchedule = { tue: ['08:00-12:00', '18:00-22:00'] }
    expect(evaluateWhatsappVisibility(split, at('2026-07-22T01:00:00Z'))).toBe(true)
  })

  it('between two windows → hidden', () => {
    // Tuesday 15:00 Bogota = 20:00Z; falls in the midday gap.
    const split: WhatsappSchedule = { tue: ['08:00-12:00', '18:00-22:00'] }
    expect(evaluateWhatsappVisibility(split, at('2026-07-21T20:00:00Z'))).toBe(false)
  })
})

describe('evaluateWhatsappVisibility — 24:00 close', () => {
  it('window closing at 24:00 keeps WhatsApp visible at 23:59 Bogota', () => {
    // Tuesday 23:59 Bogota = Wednesday 04:59Z.
    const lateNight: WhatsappSchedule = { tue: ['18:00-24:00'] }
    expect(evaluateWhatsappVisibility(lateNight, at('2026-07-22T04:59:00Z'))).toBe(true)
  })

  it('a 24:00 close does not leak into the next day', () => {
    // Wednesday 00:30 Bogota = 05:30Z; Tuesday's 24:00 close must not carry over,
    // and Wednesday has no window.
    const lateNight: WhatsappSchedule = { tue: ['18:00-24:00'] }
    expect(evaluateWhatsappVisibility(lateNight, at('2026-07-22T05:30:00Z'))).toBe(false)
  })

  it('24:00 is rejected as a start — the range is ignored, so the day stays closed', () => {
    // Tuesday 10:00 Bogota; 24:00 is only valid as a close, so this opens nothing.
    expect(evaluateWhatsappVisibility({ tue: ['24:00-24:00'] } as unknown, at('2026-07-21T15:00:00Z'))).toBe(false)
  })
})
