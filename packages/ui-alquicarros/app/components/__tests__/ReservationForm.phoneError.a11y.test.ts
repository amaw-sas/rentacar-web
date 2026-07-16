import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const form = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X01 (issue #322): the telefono validation error must be associated
// with the input. The composable side (aria-describedby via phoneInputOptions +
// aria-invalid DOM reflection) is covered functionally in
// packages/logic usePhoneField.a11y.test.ts; this guards the template wiring:
// the error message carries the deterministic id the input points at.
describe('SCEN-322-X01 — telefono error message is referenceable', () => {
  it('renders the error through the #error slot with id="telefono-error"', () => {
    expect(form).toMatch(/<template #error="\{ error \}">/)
    expect(form).toMatch(/<span id="telefono-error">\{\{ error \}\}<\/span>/)
  })

  it('keeps VueTelInput fed by the composable options (aria-describedby path)', () => {
    expect(form).toMatch(/:inputOptions="phoneInputOptions"/)
    expect(form).toMatch(/@blur="validatePhoneField"/)
    expect(form).toMatch(/usePhoneField\(reservationForm/)
  })
})
