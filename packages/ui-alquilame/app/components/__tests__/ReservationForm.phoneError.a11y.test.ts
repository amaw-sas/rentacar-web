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

// Visitor-country phone field (spec 2026-10-04 §2-§3): the field mounts only
// once usePhoneFieldLoader has the component, the metadata and the country, and
// a same-height placeholder holds its place meanwhile. Assertions run on the
// telefono <u-form-field> fragment so comments elsewhere can't trip them.
const phoneField =
  form.match(/<u-form-field[^>]*name="telefono"[^>]*>[\s\S]*?<\/u-form-field>/)?.[0] ?? ''
const phoneComponentTag = phoneField.match(/<component\b[\s\S]*?\/>/)?.[0] ?? ''
const scriptSetup = form.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''

describe('visitor-country phone field — loader wiring', () => {
  it('loads the field through usePhoneFieldLoader, not defineAsyncComponent', () => {
    expect(scriptSetup).not.toMatch(/defineAsyncComponent\(/)
    expect(scriptSetup).toMatch(
      /usePhoneFieldLoader\(\s*\(\) => import\('vue-tel-input'\)\.then\(\(m\) => m\.VueTelInput\)/,
    )
  })

  it('renders the loaded component with the resolved country', () => {
    expect(phoneComponentTag).toMatch(/:is="phoneComponent"/)
    expect(phoneComponentTag).toMatch(/v-if="phoneComponent"/)
    expect(phoneComponentTag).toMatch(/:default-country="phoneInitialCountry"/)
    expect(phoneComponentTag).toMatch(/@country-changed="onPhoneCountryChanged"/)
    expect(phoneField).not.toMatch(/defaultCountry="CO"/)
    expect(phoneField).not.toMatch(/<VueTelInput\b/)
  })

  it('keeps the existing bindings on the phone component', () => {
    expect(phoneComponentTag).toMatch(/v-model="formState\.telefono"/)
    expect(phoneComponentTag).toMatch(/mode="international"/)
    expect(phoneComponentTag).toMatch(/:dropdownOptions="phoneDropdownOptions"/)
    expect(phoneComponentTag).toMatch(/:inputOptions="phoneInputOptions"/)
    expect(phoneComponentTag).toMatch(/:preferred-countries="phonePreferredCountries"/)
    expect(phoneComponentTag).toMatch(/@blur="validatePhoneField"/)
  })

  it('holds the place with an aria-hidden v-else placeholder right after it', () => {
    // Vue allows comments between the v-if and v-else siblings.
    const afterComponent = phoneField
      .slice(phoneField.indexOf(phoneComponentTag) + phoneComponentTag.length)
      .replace(/^(\s*<!--[\s\S]*?-->)+/, '')
    expect(phoneComponentTag).not.toBe('')
    expect(afterComponent).toMatch(/^\s*<div\b[^>]*\bv-else\b[^>]*>/)
    expect(afterComponent.match(/^\s*<div\b[^>]*>/)?.[0]).toMatch(/aria-hidden="true"/)
  })
})
