import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import * as v from 'valibot'
import {
  identificationError,
  phoneInvalidMessage,
  UserInformationFormValidationSchema,
} from '../userInformationForm'
import { loadPhoneValidator, setActivePhoneCountry } from '../phoneValidator'
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

beforeAll(async () => {
  await loadPhoneValidator()
})

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
  // `tipoLicencia` is mandatory since the license selector (SCEN-LIC-04) and
  // orthogonal to the identification hardening this suite pins.
  const reservationBase = { ...validBase, vehiculo: 'C', tipoLicencia: 'colombiana' }

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

// Scenarios: docs/specs/2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md
//
// vue-tel-input prefixes what the customer types with the flag's dial code, so a
// US number typed under the Colombian flag arrives as +57 1 817 …. The full
// metadata rejects it, and the message points the customer at the flag.
describe('UserInformationFormValidationSchema — phone validity and flag-aware messages', () => {
  const COLOMBIA_MSG = 'Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.'
  const OTHER_FLAG_MSG = 'Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.'
  const NO_PREFIX_MSG = 'Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.'
  const EMPTY_MSG = 'Escribe tu número de WhatsApp o teléfono'

  const parsePhone = (telefono: string) =>
    v.safeParse(UserInformationFormValidationSchema, {
      ...validBase,
      tipoIdentificacion: CC,
      identificacion: '1020304050',
      telefono,
    })

  const phoneMessages = (telefono: string) => {
    const result = parsePhone(telefono)
    if (result.success) return []
    return result.issues
      .filter((i) => i.path?.some((p) => (p as { key?: unknown }).key === 'telefono'))
      .map((i) => i.message)
  }

  // SCEN-001
  it('rejects a US number typed under the Colombian flag with the Colombia message', () => {
    expect(parsePhone('+57 1 817 5228026').success).toBe(false)
    expect(phoneMessages('+57 1 817 5228026')).toEqual([COLOMBIA_MSG])
  })

  // SCEN-002
  it('rejects a +57 number that is not a real Colombian line', () => {
    expect(parsePhone('+57 609 6669993').success).toBe(false)
    expect(phoneMessages('+57 609 6669993')).toEqual([COLOMBIA_MSG])
  })

  // SCEN-003
  it('accepts a real Colombian mobile', () => {
    expect(parsePhone('+57 300 1234567').success).toBe(true)
  })

  // SCEN-004
  it('accepts a real US number under the US flag', () => {
    expect(parsePhone('+1 817 522 8026').success).toBe(true)
  })

  // SCEN-009
  it('still accepts the WhatsApp-copied MX mobile with the legacy 1', () => {
    expect(parsePhone('+52 1 55 1234 5678').success).toBe(true)
  })

  // SCEN-010
  it('rejects a Colombian mobile typed under the US flag with the flag message', () => {
    expect(parsePhone('+1 300 123 4567').success).toBe(false)
    expect(phoneMessages('+1 300 123 4567')).toEqual([OTHER_FLAG_MSG])
  })

  // SCEN-014
  it('rejects a short number without a dial code with the incomplete message', () => {
    expect(parsePhone('300123').success).toBe(false)
    expect(phoneMessages('300123')).toEqual([NO_PREFIX_MSG])
  })

  it('keeps the presence message for empty or under-5-character input', () => {
    expect(phoneMessages('')).toEqual([EMPTY_MSG])
    expect(phoneMessages('1234')).toEqual([EMPTY_MSG])
  })
})

describe('phoneInvalidMessage — message chosen by the raw value', () => {
  it('picks the message from the dial code, ignoring surrounding whitespace', () => {
    expect(phoneInvalidMessage('  +57 1 817 5228026')).toBe(
      'Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.'
    )
    expect(phoneInvalidMessage('+1 300 123 4567')).toBe(
      'Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.'
    )
    expect(phoneInvalidMessage('300123')).toBe(
      'Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.'
    )
  })
})

// vue-tel-input only prefixes the dial code when ITS (min) metadata accepts the
// number; otherwise the raw national digits arrive. The flag shown then decides
// the message: too short for that country → incomplete; complete length but not
// a real number → the flag message (SCEN-010 as seen in the browser, SCEN-014).
describe('phoneInvalidMessage — raw digits use the flag on screen', () => {
  const CO_MSG = 'Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.'
  const OTHER_MSG = 'Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.'
  const INCOMPLETE_MSG =
    'Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.'

  afterEach(() => setActivePhoneCountry(null))

  it('US flag, a Colombian mobile typed as national digits → wrong-country message (SCEN-010)', () => {
    setActivePhoneCountry('US')
    expect(phoneInvalidMessage('300 123 4567')).toBe(OTHER_MSG)
    const result = v.safeParse(UserInformationFormValidationSchema, {
      ...validBase, tipoIdentificacion: CC, identificacion: '1020304050', telefono: '300 123 4567',
    })
    expect(result.success).toBe(false)
    const messages = (result.issues ?? [])
      .filter((i) => i.path?.some((p) => (p as { key?: unknown }).key === 'telefono'))
      .map((i) => i.message)
    expect(messages).toEqual([OTHER_MSG])
  })

  it('US flag, too few digits → incomplete message', () => {
    setActivePhoneCountry('US')
    expect(phoneInvalidMessage('817 522')).toBe(INCOMPLETE_MSG)
  })

  it('CO flag, too few digits → incomplete message (SCEN-014)', () => {
    setActivePhoneCountry('CO')
    expect(phoneInvalidMessage('300123')).toBe(INCOMPLETE_MSG)
  })

  // Review 2026-10-04: with the CO flag, a wrong digit count is almost always a
  // typo by a Colombian customer — telling them to switch flag would mislead.
  it('CO flag, too many digits → incomplete message, never "not from Colombia"', () => {
    setActivePhoneCountry('CO')
    expect(phoneInvalidMessage('30012345678901')).toBe(INCOMPLETE_MSG)
  })

  it('CO flag, a Colombian mobile with one digit missing or extra → incomplete message', () => {
    setActivePhoneCountry('CO')
    expect(phoneInvalidMessage('300 123 456')).toBe(INCOMPLETE_MSG) // 9: INVALID_LENGTH
    expect(phoneInvalidMessage('3001 2345')).toBe(INCOMPLETE_MSG) // 8: legal length, mobile-shaped
    expect(phoneInvalidMessage('300 123 45678')).toBe(INCOMPLETE_MSG) // 11: legal length, mobile-shaped
  })

  it('CO flag, ten digits that are not a Colombian number → Colombia message (US number without the 1)', () => {
    setActivePhoneCountry('CO')
    expect(phoneInvalidMessage('609 666 9993')).toBe(CO_MSG)
    expect(phoneInvalidMessage('347 123 4567')).toBe(CO_MSG)
  })

  it('no flag known → incomplete message', () => {
    expect(phoneInvalidMessage('300 123 4567')).toBe(INCOMPLETE_MSG)
  })
})

// The dial code already present (+57 typed or kept after deleting a digit) is
// judged by length first, so a Colombian who drops a digit is not sent to the
// flag list.
describe('phoneInvalidMessage — numbers with a dial code are judged by length first', () => {
  const CO_MSG = 'Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.'
  const OTHER_MSG = 'Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.'
  const INCOMPLETE_MSG =
    'Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.'

  it('+57 with a digit missing → incomplete message', () => {
    expect(phoneInvalidMessage('+57 300 123456')).toBe(INCOMPLETE_MSG)
  })

  it('+57 mobile with a digit extra → incomplete message', () => {
    expect(phoneInvalidMessage('+57 300 12345678')).toBe(INCOMPLETE_MSG)
  })

  it('+57 followed by a US number (with or without its 1) → Colombia message (SCEN-001, SCEN-002)', () => {
    expect(phoneInvalidMessage('+57 1 817 5228026')).toBe(CO_MSG)
    expect(phoneInvalidMessage('+57 609 6669993')).toBe(CO_MSG)
    expect(phoneInvalidMessage('+57 347 1234567')).toBe(CO_MSG)
  })

  it('another dial code: too short → incomplete; complete but not real → wrong-country message', () => {
    expect(phoneInvalidMessage('+1 817 522')).toBe(INCOMPLETE_MSG)
    expect(phoneInvalidMessage('+1 300 123 4567')).toBe(OTHER_MSG)
  })
})
