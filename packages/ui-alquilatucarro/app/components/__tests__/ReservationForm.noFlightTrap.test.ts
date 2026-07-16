import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const form = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-D02 — flight schema trap removed', () => {
  it('always validates with ReservationFormValidationSchema (no haveFlight branch)', () => {
    expect(form).toMatch(/ReservationFormValidationSchema/)
    expect(form).not.toMatch(/haveFlight\.value\s*\?/)
    expect(form).not.toMatch(/reservationWithFlightFormState/)
  })
})
