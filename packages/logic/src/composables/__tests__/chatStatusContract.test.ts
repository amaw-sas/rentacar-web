import { describe, expect, it } from 'vitest'
import { evaluateWhatsappVisibility } from '../useChatStatus'
import contract from './fixtures/chat-status.contract.json'

// D1 — CONTRACT test for GET /api/chat/status.
//
// The producer is rentacar-dashboard (branch diego-alex-melo/whatsapp-schedule-dash,
// app/api/chat/status/route.ts). This file is the tripwire for cross-repo drift:
// if the dashboard stops serving `whatsappSchedule`, renames it, or changes the
// weekday/range grammar, these assertions fail with a message naming the producer
// instead of the feature silently degrading to a no-op.
//
// Why a fixture and not a live call: unit tests must not depend on the network or
// on prod data. The fixture is a captured response; re-capture it with the curl in
// the JSON `_comment` whenever the endpoint changes.

const DASHBOARD = 'rentacar-dashboard@diego-alex-melo/whatsapp-schedule-dash (app/api/chat/status/route.ts)'
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

// Bogota-civil instants used to probe a parsed window (all verified UTC-5).
const MON_12H = new Date('2026-07-27T17:00:00Z') // Mon 12:00 Bogota
const SUN_12H = new Date('2026-07-26T17:00:00Z') // Sun 12:00 Bogota
const SAT_17H = new Date('2026-07-25T22:00:00Z') // Sat 17:00 Bogota

describe('chat/status contract — the whatsappSchedule field must exist', () => {
  it('every non-legacy captured response carries a whatsappSchedule key', () => {
    for (const key of ['scheduled', 'noSchedule', 'emptySchedule'] as const) {
      const payload = contract[key] as Record<string, unknown>
      expect(
        'whatsappSchedule' in payload,
        `CONTRACT BROKEN: fixture "${key}" has no "whatsappSchedule" key. The WhatsApp `
        + `schedule feature is inert without it. Check ${DASHBOARD} — it must return `
        + `{ brand, enabled, whatsappSchedule } with whatsappSchedule: null when unset.`,
      ).toBe(true)
    }
  })

  it('keeps the base {brand, enabled} shape intact (the field is additive)', () => {
    for (const key of ['scheduled', 'noSchedule', 'emptySchedule', 'legacyBeforeDashboardShipped'] as const) {
      const payload = contract[key] as Record<string, unknown>
      expect(typeof payload.brand, `fixture "${key}".brand must stay a string`).toBe('string')
      expect(typeof payload.enabled, `fixture "${key}".enabled must stay a boolean`).toBe('boolean')
    }
  })

  it('whatsappSchedule is null or a plain object — never a string or array', () => {
    for (const key of ['scheduled', 'noSchedule', 'emptySchedule'] as const) {
      const value = (contract[key] as Record<string, unknown>).whatsappSchedule
      const ok = value === null || (typeof value === 'object' && !Array.isArray(value))
      expect(
        ok,
        `CONTRACT BROKEN: fixture "${key}".whatsappSchedule is ${JSON.stringify(value)}. `
        + `Expected null or an object. A JSON-encoded string or an array means ${DASHBOARD} `
        + `changed its serialization and the reader will fail open (button always visible).`,
      ).toBe(true)
    }
  })

  it('uses lowercase 3-letter weekday keys only (not "monday", "lun", "hol")', () => {
    const schedule = contract.scheduled.whatsappSchedule as Record<string, unknown>
    for (const key of Object.keys(schedule)) {
      expect(
        (DAY_KEYS as readonly string[]).includes(key),
        `CONTRACT BROKEN: unexpected weekday key "${key}". The reader only understands `
        + `${DAY_KEYS.join('/')}; any other key collapses that day to hidden. Check ${DASHBOARD}.`,
      ).toBe(true)
    }
  })

  it("every captured range parses under this repo's grammar", () => {
    const schedule = contract.scheduled.whatsappSchedule as Record<string, string[]>
    for (const [day, ranges] of Object.entries(schedule)) {
      for (const range of ranges) {
        expect(
          range,
          `CONTRACT BROKEN: range "${range}" on "${day}" is not HH:MM-HH:MM. `
          + `The reader ignores unparseable ranges, so this window would never open. `
          + `Check the grammar in ${DASHBOARD} (lib/schemas/whatsapp-schedule.ts).`,
        ).toMatch(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-4]):[0-5]\d$/)
      }
    }
  })
})

describe('chat/status contract — captured payloads drive the documented behavior', () => {
  it('a real schedule opens and closes the button at the captured windows', () => {
    const schedule = contract.scheduled.whatsappSchedule
    // Mon 12:00 is inside the captured 07:00-19:00 window.
    expect(evaluateWhatsappVisibility(schedule, MON_12H)).toBe(true)
    // Sat 17:00 is past the captured 07:00-16:00 close.
    expect(evaluateWhatsappVisibility(schedule, SAT_17H)).toBe(false)
    // Sunday is captured as an explicit [] → hidden all day.
    expect(evaluateWhatsappVisibility(schedule, SUN_12H)).toBe(false)
  })

  it('whatsappSchedule: null means no schedule → always visible', () => {
    const schedule = contract.noSchedule.whatsappSchedule
    expect(schedule).toBeNull()
    for (const now of [MON_12H, SAT_17H, SUN_12H]) {
      expect(evaluateWhatsappVisibility(schedule, now)).toBe(true)
    }
  })

  it('whatsappSchedule: {} is a valid empty schedule → hidden all week', () => {
    const schedule = contract.emptySchedule.whatsappSchedule
    for (const now of [MON_12H, SAT_17H, SUN_12H]) {
      expect(
        evaluateWhatsappVisibility(schedule, now),
        'An empty object is a saved schedule with no windows: it must hide the button, '
        + 'not fail open. This is the canonical semantics shared with the dashboard.',
      ).toBe(false)
    }
  })

  it('DOCUMENTED GAP: a legacy response without the field leaves WhatsApp always visible', () => {
    // This is what production served before the dashboard branch shipped. The
    // reader fails open, so merging the web side alone changes nothing on screen.
    // This test exists so that no-op is an explicit, reviewed property.
    const legacy = contract.legacyBeforeDashboardShipped as { whatsappSchedule?: unknown }
    expect('whatsappSchedule' in legacy).toBe(false)
    for (const now of [MON_12H, SAT_17H, SUN_12H]) {
      expect(evaluateWhatsappVisibility(legacy.whatsappSchedule, now)).toBe(true)
    }
  })
})

describe('chat/status contract — grammar agreement with the producer', () => {
  // Mirrors the accept/reject table of the dashboard's own schema tests so the
  // two repos cannot drift apart silently. Probe instant: Friday 23:00 Bogota.
  const FRI_23H = new Date('2026-07-25T04:00:00Z')

  it('accepts the 24:00 end-of-day sentinel the dashboard allows', () => {
    expect(evaluateWhatsappVisibility({ fri: ['18:00-24:00'] }, FRI_23H)).toBe(true)
  })

  it('accepts off-grid minutes (the dashboard deliberately does not pin :00/:30)', () => {
    // Fri 19:30 Bogota = 2026-07-25T00:30Z.
    expect(evaluateWhatsappVisibility({ fri: ['07:15-19:45'] }, new Date('2026-07-25T00:30:00Z'))).toBe(true)
  })

  it('ignores ranges the dashboard rejects, so they never open a window', () => {
    // The dashboard refuses to store these; if one ever leaks through, the reader
    // must treat it as "no window", not as an all-day opening.
    for (const bad of ['18:00-24:30', '19:00-07:00', '07:60-19:00', '7-19']) {
      expect(
        evaluateWhatsappVisibility({ fri: [bad] }, FRI_23H),
        `range "${bad}" is rejected by the dashboard schema and must not open the day`,
      ).toBe(false)
    }
  })
})
