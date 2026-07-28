import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const form = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

// Scenarios: docs/specs/issue-396-conductor-adicional/scenarios/conductor-adicional-datos.scenarios.md
//
// SCEN-396-01 / SCEN-396-08. `withExtraDriver` lives in the SEARCH store, where the
// valibot schema cannot reach it, so each brand mirrors it into its form state. The
// mirror fails silently: drop it in one brand and `v.nullish(..., false)` fills the
// gap, the cross-field rules never fire, and that brand happily books an extra
// driver with no name and no document. Nothing else in the suite would notice.
// Hence one of these per brand — three copies on purpose.

describe('SCEN-396-08 — the withExtraDriver mirror reaches the form state', () => {
  it('destructures selectedCategory from the search store', () => {
    expect(form).toMatch(/selectedCategory[\s\S]{0,40}storeToRefs\(storeSearch\)/)
  })

  it('derives conductorAdicional from selectedCategory.withExtraDriver', () => {
    expect(form).toMatch(
      /const conductorAdicional = computed\(\s*\(\)\s*=>\s*selectedCategory\.value\?\.withExtraDriver === true/,
    )
  })

  it('puts the mirror inside baseForm, which becomes the validated form state', () => {
    const baseForm = form.match(/const baseForm = \{[\s\S]*?\n\};/)
    expect(baseForm).not.toBeNull()
    expect(baseForm![0]).toMatch(/\bconductorAdicional,/)
    expect(baseForm![0]).toMatch(/\bconductorAdicionalNombre,/)
    expect(baseForm![0]).toMatch(/\bconductorAdicionalIdentificacion,/)
    expect(form).toMatch(/reactive\(baseForm\)/)
  })

  it('binds the two fields to the store refs, not to component-local state', () => {
    expect(form).toMatch(/conductorAdicionalNombre,[\s\S]{0,120}storeToRefs\(storeForm\)/)
  })
})

describe('SCEN-396-01 — the fields appear only with the add-on contracted', () => {
  const block = form.match(/<template v-if="formState\.conductorAdicional">[\s\S]*?<\/template>/)

  it('gates the whole block on the mirror', () => {
    expect(block).not.toBeNull()
  })

  it('collects the name through a named form field so its error surfaces', () => {
    expect(block![0]).toMatch(/name="conductorAdicionalNombre"/)
    expect(block![0]).toMatch(/v-model="formState\.conductorAdicionalNombre"/)
    expect(block![0]).toMatch(/data-testid="extra-driver-name"/)
  })

  it('collects the document through a named form field so its error surfaces', () => {
    expect(block![0]).toMatch(/name="conductorAdicionalIdentificacion"/)
    expect(block![0]).toMatch(/v-model="formState\.conductorAdicionalIdentificacion"/)
    expect(block![0]).toMatch(/data-testid="extra-driver-document"/)
  })

  it('carries the data-treatment notice for the third party (Ley 1581/2012)', () => {
    expect(block![0]).toMatch(/data-testid="extra-driver-notice"/)
    expect(block![0]).toMatch(/Localiza/)
  })

  // A rebase over a brand reskin merges cleanly and still leaves these two fields
  // looking foreign: alquilame's #425-era restyle added `:ui="formFieldUi"` to every
  // labelled field, and a block inserted before it inherits nothing. Nothing else in
  // the suite notices — the testids and the v-if are untouched. So the rule is
  // relative, not absolute: whatever the holder's `identificacion` field binds, the
  // extra driver's two fields bind the same. Brands with no `:ui` stay unaffected.
  it('styles both fields like the holder identification field of the same brand', () => {
    const holder = form.match(/<u-form-field[^>]*name="identificacion"[^>]*>/)
    expect(holder).not.toBeNull()
    const holderUi = holder![0].match(/:ui="([^"]+)"/)?.[1] ?? null

    for (const field of ['conductorAdicionalNombre', 'conductorAdicionalIdentificacion']) {
      const tag = block![0].match(new RegExp(`<u-form-field[^>]*name="${field}"[^>]*>`))
      expect(tag, `no <u-form-field> for ${field}`).not.toBeNull()
      expect(tag![0].match(/:ui="([^"]+)"/)?.[1] ?? null, `${field} :ui binding`).toBe(holderUi)
    }
  })

  it('places the block before the privacy consent checkbox', () => {
    const blockIdx = form.indexOf('<template v-if="formState.conductorAdicional">')
    const consentIdx = form.indexOf('name="politicaPrivacidad"')
    expect(blockIdx).toBeGreaterThan(-1)
    expect(consentIdx).toBeGreaterThan(-1)
    expect(blockIdx).toBeLessThan(consentIdx)
  })
})
