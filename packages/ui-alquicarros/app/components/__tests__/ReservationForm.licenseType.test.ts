import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const form = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

// Scenarios: docs/specs/2026-10-03-selector-licencia/scenarios/selector-licencia.scenarios.md
//
// SCEN-LIC-08. The license question lives in each brand's form copy, but texts
// and options come from packages/logic. The silent failure this guard exists
// for: drop `tipoLicencia` from `baseForm` in one brand and valibot receives
// `undefined`, the picklist always fails, and that brand can never submit a
// reservation again. One of these per brand — three copies on purpose.
//
// alquicarros stacks the grid on phones (`grid-cols-1 md:grid-cols-2`), so the
// full-row span here is `md:col-span-2`, not `col-span-2`.

function fieldTag(name: string) {
  const nameIdx = form.indexOf(`name="${name}"`)
  expect(nameIdx, `no name="${name}" in the template`).toBeGreaterThan(-1)
  const start = form.lastIndexOf('<u-form-field', nameIdx)
  return form.slice(start, form.indexOf('>', nameIdx) + 1)
}

describe('SCEN-LIC-08 — the license question is wired into the form state', () => {
  it('destructures tipoLicencia from the form store refs', () => {
    expect(form).toMatch(/\btipoLicencia,[\s\S]{0,300}\} = storeToRefs\(storeForm\)/)
  })

  it('puts tipoLicencia inside baseForm, which becomes the validated form state', () => {
    const baseForm = form.match(/const baseForm = \{[\s\S]*?\n\};/)
    expect(baseForm).not.toBeNull()
    expect(baseForm![0]).toMatch(/\btipoLicencia,/)
  })

  it('binds the radio group to the form state', () => {
    expect(form).toMatch(/<u-radio-group[\s\S]{0,200}v-model="formState\.tipoLicencia"/)
    expect(form).toMatch(/data-testid="driver-license-type"/)
  })

  it('keeps the deterministic id that firstInvalidFieldEl resolves by name', () => {
    // URadioGroup (bind:false) leaves the UForm error with id undefined; without
    // this DOM id the error-focus handler silently skips the field (SCEN-LIC-04).
    expect(form).toMatch(/<u-radio-group\s+id="tipoLicencia"/)
  })

  it('sources options and notices from the shared catalog, no hardcoded copy', () => {
    expect(form).toMatch(/DRIVER_LICENSE_OPTIONS/)
    expect(form).toMatch(/driverLicenseNotice/)
    expect(form).not.toMatch(/Al recoger el carro/)
  })
})

describe('SCEN-LIC-08 — position and brand grid', () => {
  it('sits between the identification number and the email', () => {
    const idIdx = form.indexOf('name="identificacion"')
    const licIdx = form.indexOf('name="tipoLicencia"')
    const emailIdx = form.indexOf('name="email"')
    expect(idIdx).toBeGreaterThan(-1)
    expect(licIdx).toBeGreaterThan(idIdx)
    expect(emailIdx).toBeGreaterThan(licIdx)
  })

  it('spans the full row like the brand grid expects', () => {
    expect(fieldTag('tipoLicencia')).toContain('md:col-span-2')
  })
})

describe('SCEN-LIC-01/02/03 — the notice region', () => {
  it('keeps the live region always mounted with the conditional notice inside', () => {
    const region = form.match(
      /<div[^>]*role="status"[^>]*aria-live="polite"[^>]*>[\s\S]*?<\/div>/,
    )
    expect(region).not.toBeNull()
    expect(region![0]).toMatch(/v-if="licenseNotice"/)
    expect(region![0]).toMatch(/data-testid="license-document-notice"/)
    expect(region![0]).toMatch(/\{\{ licenseNotice \}\}/)
  })
})
