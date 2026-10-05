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
// Vue allows comments between the v-if and v-else siblings.
const afterComponent = phoneField
  .slice(phoneField.indexOf(phoneComponentTag) + phoneComponentTag.length)
  .replace(/^(\s*<!--[\s\S]*?-->)+/, '')
const placeholderTag = afterComponent.match(/^\s*<div\b[^>]*>/)?.[0] ?? ''
// The v-else wrapper up to the #error slot that follows it.
const placeholder = afterComponent.split(/<template #error/)[0] ?? ''

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

  it('holds the place with a v-else wrapper right after it, aria-hidden while loading', () => {
    expect(phoneComponentTag).not.toBe('')
    expect(placeholderTag).toMatch(/^\s*<div\b[^>]*\bv-else\b[^>]*>/)
    // The grey box is aria-hidden; the wrapper is not, because it also hosts the
    // load-failure notice, which must be read out.
    expect(placeholder).toMatch(/<div\b[^>]*\bv-else\b[^>]*\baria-hidden="true"[^>]*>/)
    expect(placeholderTag).not.toMatch(/aria-hidden/)
  })
})

// Review fix 1: when the component or the metadata fails to load, the browser
// keeps the failed import for the life of the page (whatwg/html#6768), so only a
// reload helps. The placeholder turns into a notice with a reload button, and it
// carries id="telefono" so the label and the first-invalid-field scroll reach it
// while the real input is missing.
describe('visitor-country phone field — load failure', () => {
  it('gives the placeholder the input id, focusable from script only', () => {
    expect(placeholderTag).toMatch(/\bid="telefono"/)
    expect(placeholderTag).toMatch(/\btabindex="-1"/)
  })

  it('switches to the notice on phoneLoadFailed', () => {
    expect(placeholder).toMatch(/v-if="phoneLoadFailed"/)
    expect(scriptSetup).toMatch(/\bphoneLoadFailed\b[\s\S]*?=\s*usePhoneFieldLoader\(/)
  })

  it('tells the customer and offers a reload', () => {
    expect(placeholder).toContain('No pudimos cargar el campo del teléfono.')
    expect(placeholder).toContain('Recargar la página')
    expect(placeholder).toMatch(/<button\b[^>]*\btype="button"[^>]*@click="reloadNuxtApp\(/)
  })
})

// Review fix 2: changing only the flag does not change `telefono`, so the
// debounced revalidation never runs and the old message would stay under the new
// flag. The loader calls back on every flag change; the form re-checks only when
// an error is showing (no nagging on a field the customer has not finished).
describe('visitor-country phone field — flag change revalidates', () => {
  it('re-validates on a flag change only while the field shows an error', () => {
    expect(scriptSetup).toMatch(
      /usePhoneFieldLoader\([\s\S]*?\{\s*onCountryChanged:\s*\(\)\s*=>\s*\{\s*if\s*\(phoneFieldInvalid\.value\)\s*validatePhoneField\(\);?\s*\},?\s*\}\s*\)/,
    )
    expect(scriptSetup).toMatch(/\bphoneFieldInvalid,[\s\S]*?=\s*usePhoneField\(reservationForm/)
  })
})
