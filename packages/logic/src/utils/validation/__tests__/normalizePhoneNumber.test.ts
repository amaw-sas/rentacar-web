import { describe, it, expect } from 'vitest'
import { isValidPhoneNumber } from 'libphonenumber-js'
import * as v from 'valibot'
import { normalizePhoneNumber } from '../normalizePhoneNumber'
import { UserInformationFormValidationSchema } from '../userInformationForm'

// Scenarios: docs/specs/mx-phone-legacy-prefix/scenarios/mx-phone-legacy-prefix.scenarios.md
//
// WhatsApp shows Mexican mobiles with a legacy `1` after the country code
// (+52 1 …). E.164 / libphonenumber-js treats +521XXXXXXXXXX (11 digits) as
// INVALID; the canonical form is +52XXXXXXXXXX (10 digits). Operators copy the
// number verbatim from the client's WhatsApp, so the form rejected a real number.

const validBase = {
  nombreCompleto: 'Juan',
  apellidos: 'Pérez',
  tipoIdentificacion: 'Cedula Ciudadania',
  identificacion: '1020304050',
  email: 'juan@example.com',
  politicaPrivacidad: true,
}

const parsePhone = (telefono: string) =>
  v.safeParse(UserInformationFormValidationSchema, { ...validBase, telefono })

describe('normalizePhoneNumber — legacy MX mobile prefix', () => {
  // SCEN-002
  it('strips the legacy 1 from a WhatsApp-copied MX mobile → canonical E.164', () => {
    expect(normalizePhoneNumber('+52 1 81 8169 5428')).toBe('+528181695428')
    expect(normalizePhoneNumber('+5218181695428')).toBe('+528181695428')
    expect(isValidPhoneNumber(normalizePhoneNumber('+52 1 81 8169 5428'))).toBe(true)
  })

  // SCEN-003 — modern MX mobile without the 1 keeps its digits, stays valid
  it('leaves a modern MX mobile (no legacy 1) as a valid number', () => {
    const out = normalizePhoneNumber('+52 81 8169 5428')
    expect(out.replace(/[^\d+]/g, '')).toBe('+528181695428')
    expect(isValidPhoneNumber(out)).toBe(true)
  })

  // SCEN-004 — non-MX numbers are returned byte-for-byte unchanged
  it('returns a Colombian number unchanged', () => {
    expect(normalizePhoneNumber('+573001234567')).toBe('+573001234567')
  })

  it('is a no-op for empty / nullish input', () => {
    expect(normalizePhoneNumber('')).toBe('')
    expect(normalizePhoneNumber(null as unknown as string)).toBe(null)
    expect(normalizePhoneNumber(undefined as unknown as string)).toBe(undefined)
  })

  // SCEN-005 guard — must NOT over-strip junk into a false positive
  it('does not rewrite a +521 string that is not a valid 10-digit MX mobile', () => {
    // stripping the 1 would leave +52555 (invalid) → keep original untouched
    expect(normalizePhoneNumber('+52 1 55 5')).toBe('+52 1 55 5')
  })
})

describe('UserInformationFormValidationSchema — MX legacy prefix acceptance', () => {
  // SCEN-001
  it('accepts the WhatsApp-copied MX mobile +52 1 81 8169 5428', () => {
    expect(parsePhone('+52 1 81 8169 5428').success).toBe(true)
    expect(parsePhone('+5218181695428').success).toBe(true)
  })

  // SCEN-003
  it('accepts a modern MX mobile without the legacy 1', () => {
    expect(parsePhone('+52 81 8169 5428').success).toBe(true)
  })

  // SCEN-004
  it('still accepts the existing Colombian format', () => {
    expect(parsePhone('+573001234567').success).toBe(true)
  })

  // SCEN-005
  it('still rejects a bogus number that only looks like the legacy form', () => {
    expect(parsePhone('+52 1 55 5').success).toBe(false)
  })
})
