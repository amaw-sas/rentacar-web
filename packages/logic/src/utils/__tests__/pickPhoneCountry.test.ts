import { describe, it, expect } from 'vitest'

import { pickPhoneCountry } from '../pickPhoneCountry'

// Scenarios: docs/specs/2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md
// SCEN-006 (unknown or missing country → CO) and SCEN-007 (the flag the customer
// last saw wins over the visitor country).

const KNOWN = new Set(['CO', 'US', 'ES'])

describe('pickPhoneCountry', () => {
  it('keeps the flag stored in the form over the visitor country (SCEN-007)', () => {
    expect(pickPhoneCountry('CO', 'US', KNOWN)).toBe('CO')
  })

  it('uses the visitor country when nothing is stored', () => {
    expect(pickPhoneCountry(null, 'US', KNOWN)).toBe('US')
  })

  it('falls back to CO when the visitor country is not offered (SCEN-006)', () => {
    expect(pickPhoneCountry(null, 'ZZ', KNOWN)).toBe('CO')
  })

  it('upper-cases before comparing', () => {
    expect(pickPhoneCountry('us', null, KNOWN)).toBe('US')
  })

  it('falls back to CO when there is no country at all (SCEN-006)', () => {
    expect(pickPhoneCountry(null, null, KNOWN)).toBe('CO')
  })

  it('skips an unknown stored country and takes the visitor one', () => {
    expect(pickPhoneCountry('ZZ', 'ES', KNOWN)).toBe('ES')
  })

  it('returns CO even when the known set is empty', () => {
    expect(pickPhoneCountry('US', 'ES', new Set())).toBe('CO')
  })
})
