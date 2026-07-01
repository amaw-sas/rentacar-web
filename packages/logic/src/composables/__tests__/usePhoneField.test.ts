import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured (issue #65 SCEN-008, unit-level slice): the phone field
// must expose autocomplete="tel" and must NOT carry the stale
// aria-label="Número de teléfono" — that aria-label overrode the visible
// "Teléfono" label as the accessible name, violating WCAG 2.5.3 Label in Name.
// The accessible name is provided by the UFormField label instead (asserted in
// the runtime DOM scenario; this test guards the composable config that feeds
// VueTelInput's inputOptions).
//
// Source-level test (codebase convention) avoids mocking Nuxt auto-imports
// (computed) — same approach as useCategory.getTotalPrice.test.ts.

const source = readFileSync(
  fileURLToPath(new URL('../usePhoneField.ts', import.meta.url)),
  'utf8',
)

describe('usePhoneField — phone input accessibility config (issue #65)', () => {
  it('exposes autocomplete="tel" so browsers/agents can autofill the phone', () => {
    expect(source).toMatch(/autocomplete:\s*['"]tel['"]/)
  })

  it('drops the stale aria-label so it cannot override the "Teléfono" label', () => {
    expect(source).not.toContain('aria-label')
    expect(source).not.toContain('Número de teléfono')
  })

  it('keeps id and name "telefono" for the form control', () => {
    expect(source).toMatch(/id:\s*['"]telefono['"]/)
    expect(source).toMatch(/name:\s*['"]telefono['"]/)
  })
})

// Scenario captured (issue #276 SCEN-276-05, unit-level slice): VueTelInput does
// not wire into UFormField, so UForm never revalidates `telefono` on its own
// events and a field error goes stale after the user fixes the number. The
// composable must bridge this: expose a `validatePhoneField` handler that calls
// UForm's `validate({ name: 'telefono' })`, and set up a debounced watch so a
// corrected value revalidates without needing a full submit. The observable
// DOM behavior (error clears without re-submit) is asserted in the runtime
// scenario; this guards the wiring at the source level (codebase convention).
describe('usePhoneField — telefono revalidation bridge (issue #276)', () => {
  it('validates the telefono field by name so the form can clear its stale error', () => {
    expect(source).toMatch(/validate\(\{\s*name:\s*["']telefono["']\s*\}\)/)
  })

  it('debounces revalidation while the user edits so a corrected number clears the error', () => {
    expect(source).toContain('watchDebounced')
  })
})
