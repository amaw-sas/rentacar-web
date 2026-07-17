import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const form = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X07 hardening: the flight schemas were DELETED from packages/logic
// (flightForm.ts, reservationWithFlightForm.ts, userInformationWithFlightForm.ts),
// so a reintroduced with-flight branch would now fail at import. This test stays
// as the component-level tripwire: the form must bind the plain schema and carry
// no flight wiring at all.
describe('SCEN-322-D02 / SCEN-322-X07 — flight schema trap removed', () => {
  it('always validates with ReservationFormValidationSchema (no haveFlight branch)', () => {
    expect(form).toMatch(/ReservationFormValidationSchema/)
    expect(form).not.toMatch(/haveFlight/)
    expect(form).not.toMatch(/WithFlight/)
    expect(form).not.toMatch(/aerolinea|numeroVueloIda/)
  })
})
