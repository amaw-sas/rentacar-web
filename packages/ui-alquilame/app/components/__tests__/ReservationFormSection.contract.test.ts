import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationFormSection.vue', import.meta.url)),
  'utf8',
)

describe('ReservationFormSection — form contract (issue 322 D02)', () => {
  it('declares formState and validationSchema used by the template', () => {
    expect(source).toMatch(/const formState\s*=/)
    expect(source).toMatch(/const validationSchema\s*=/)
    expect(source).toMatch(/:state="formState"/)
    expect(source).toMatch(/:schema="validationSchema"/)
  })

  it('binds submitForm from the store without typos', () => {
    expect(source).toMatch(/const\s*\{\s*submitForm\s*\}\s*=\s*storeForm/)
    expect(source).not.toMatch(/\bonst\b/)
    expect(source).toMatch(/@submit="submitForm"/)
  })

  it('uses non-flight ReservationFormValidationSchema only', () => {
    expect(source).toMatch(/ReservationFormValidationSchema/)
    expect(source).not.toMatch(/haveFlight\.value\s*\?/)
    expect(source).not.toMatch(/ReservationWithFlightFormValidationSchema/)
    expect(source).not.toMatch(/reservationWithFlightFormState/)
  })
})
