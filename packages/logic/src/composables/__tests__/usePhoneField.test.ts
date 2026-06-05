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
