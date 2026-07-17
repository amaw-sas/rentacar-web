import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import {
  identificationError,
  UserInformationFormValidationSchema,
} from '../userInformationForm'
import { ReservationFormValidationSchema } from '../reservationForm'
// ReservationWithFlightFormValidationSchema removed (issue #322 SCEN-322-X07):
// the flight branch was dead code — no template ever collected flight fields.

// Scenarios: docs/specs/issue-44-identification-validation/scenarios/identification-validation.scenarios.md
//
// The reservation form accepted trivial sentinels (123456, 000000, …) and arbitrary
// strings as `identificacion`, which — combined with a backend findOrCreateCustomer
// bug — let one user hijack any customer sharing that CC. These tests pin the
// frontend hardening: CC = digits 7–12, PP = alphanumeric 6–15, sentinel blocklist
// for every type, error forwarded onto the `identificacion` field.

const CC = 'Cedula Ciudadania'
const PP = 'Pasaporte'

const CC_MSG = 'La cédula debe tener solo números (7 a 12 dígitos)'
const PP_MSG = 'El pasaporte debe tener entre 6 y 15 caracteres (letras y números)'
const SENTINEL_MSG = 'Escribe tu identificación real, no un valor de prueba'

const BLOCKLIST = [
  '123456', '1234567', '12345678', '123456789', '1234567890',
  '000000', '0000000', '00000000',
  '111111',
  '999999', '9999999', '99999999', '999999999', '9999999999',
]

// Valid base for full-schema parsing — only identificacion/tipoIdentificacion vary.
const validBase = {
  nombreCompleto: 'Juan',
  apellidos: 'Pérez',
  telefono: '+573001234567',
  email: 'juan@example.com',
  politicaPrivacidad: true,
}

const parse = (tipoIdentificacion: string, identificacion: string) =>
  v.safeParse(UserInformationFormValidationSchema, {
    ...validBase,
    tipoIdentificacion,
    identificacion,
  })

describe('identificationError — pure cross-field rule', () => {
  // SCEN-001
  it('accepts a valid CC (digits 7–12)', () => {
    expect(identificationError(CC, '1020304050')).toBeNull()
    expect(identificationError(CC, '1023456')).toBeNull() // min 7 (not blocklisted)
    expect(identificationError(CC, '123456789012')).toBeNull() // max 12
  })

  // SCEN-002 — real incident passport was lowercase `a13676498`
  it('accepts a valid passport, including real lowercase ones', () => {
    expect(identificationError(PP, 'AB123456')).toBeNull()
    expect(identificationError(PP, 'a13676498')).toBeNull()
    expect(identificationError(PP, 'ABC123')).toBeNull() // min 6
    expect(identificationError(PP, 'ABCDEFGHIJ12345')).toBeNull() // max 15
  })

  // SCEN-004 — blocklist applies to every offered type
  it('rejects every blocklisted sentinel under both CC and PP', () => {
    for (const value of BLOCKLIST) {
      expect(identificationError(CC, value), `CC ${value}`).not.toBeNull()
      expect(identificationError(PP, value), `PP ${value}`).not.toBeNull()
    }
  })

  it('lets the sentinel message win over format for a blocklisted but well-formed length', () => {
    // 1234567 is 7 digits (valid CC length) but blocklisted → sentinel message, not null.
    expect(identificationError(CC, '1234567')).toBe(SENTINEL_MSG)
  })

  // SCEN-005
  it('rejects CC with non-digits or out-of-range length', () => {
    expect(identificationError(CC, '12ab567')).toBe(CC_MSG) // letters
    expect(identificationError(CC, '123456')).not.toBeNull() // 6 digits (too short + blocklisted)
    expect(identificationError(CC, '1234567890123')).toBe(CC_MSG) // 13 digits
    expect(identificationError(CC, '102030')).toBe(CC_MSG) // 6 digits, not blocklisted
  })

  // SCEN-006
  it('rejects passport with symbols or out-of-range length', () => {
    expect(identificationError(PP, 'AB12')).toBe(PP_MSG) // too short
    expect(identificationError(PP, 'AB-1234')).toBe(PP_MSG) // symbol
    expect(identificationError(PP, 'ABCDEFGHIJ1234567')).toBe(PP_MSG) // 17 chars
  })

  // SCEN-008
  it('tolerates surrounding whitespace but is not bypassed by it', () => {
    expect(identificationError(CC, '  1020304050  ')).toBeNull()
    expect(identificationError(CC, '  123456  ')).toBe(SENTINEL_MSG)
  })

  it('returns null for empty input (presence enforced at field level)', () => {
    expect(identificationError(CC, '')).toBeNull()
    expect(identificationError(CC, null)).toBeNull()
    expect(identificationError(CC, undefined)).toBeNull()
  })
})

describe('UserInformationFormValidationSchema — full form integration', () => {
  // SCEN-001
  it('passes a valid CC submission', () => {
    expect(parse(CC, '1020304050').success).toBe(true)
  })

  // SCEN-002
  it('passes a valid passport submission', () => {
    expect(parse(PP, 'AB123456').success).toBe(true)
    expect(parse(PP, 'a13676498').success).toBe(true)
  })

  // SCEN-003 — sentinel blocked and the issue lands on the identificacion field
  it('blocks sentinel 123456 with the error forwarded to identificacion', () => {
    const result = parse(CC, '123456')
    expect(result.success).toBe(false)
    if (!result.success) {
      const idIssue = result.issues.find(
        (i) => i.path?.some((p) => (p as { key?: unknown }).key === 'identificacion')
      )
      expect(idIssue, 'an issue must target the identificacion path').toBeDefined()
    }
  })

  // SCEN-004
  it('blocks every blocklisted sentinel at the schema level', () => {
    for (const value of BLOCKLIST) {
      expect(parse(CC, value).success, `CC ${value}`).toBe(false)
      expect(parse(PP, value).success, `PP ${value}`).toBe(false)
    }
  })

  it('blocks malformed CC and passport at the schema level', () => {
    expect(parse(CC, '12ab567').success).toBe(false)
    expect(parse(PP, 'AB-1234').success).toBe(false)
  })
})

// SCEN-007 — the reservation schemas the brand forms actually bind to inherit the
// same hardening, with no per-brand code.
describe('Reservation schemas inherit identification hardening', () => {
  const reservationBase = { ...validBase, vehiculo: 'C' }

  it('ReservationFormValidationSchema passes a valid CC and blocks a sentinel', () => {
    expect(
      v.safeParse(ReservationFormValidationSchema, {
        ...reservationBase, tipoIdentificacion: CC, identificacion: '1020304050',
      }).success
    ).toBe(true)
    expect(
      v.safeParse(ReservationFormValidationSchema, {
        ...reservationBase, tipoIdentificacion: CC, identificacion: '123456',
      }).success
    ).toBe(false)
  })

  // Passport hardening previously asserted through the with-flight schema; the
  // flight branch is gone (SCEN-322-X07), so pin it on the surviving schema.
  it('ReservationFormValidationSchema passes a valid passport and blocks a sentinel', () => {
    expect(
      v.safeParse(ReservationFormValidationSchema, {
        ...reservationBase, tipoIdentificacion: PP, identificacion: 'a13676498',
      }).success
    ).toBe(true)
    expect(
      v.safeParse(ReservationFormValidationSchema, {
        ...reservationBase, tipoIdentificacion: PP, identificacion: '000000',
      }).success
    ).toBe(false)
  })
})
