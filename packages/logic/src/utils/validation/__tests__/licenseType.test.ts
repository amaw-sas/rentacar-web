import { describe, it, expect, beforeAll } from 'vitest'
import * as v from 'valibot'
import { ReservationFormValidationSchema } from '../reservationForm'
import { DRIVER_LICENSE_OPTIONS, driverLicenseNotice } from '../../driverLicense'
import { loadPhoneValidator } from '../phoneValidator'

// Scenarios: docs/specs/2026-10-03-selector-licencia/scenarios/selector-licencia.scenarios.md
//
// The pickup document depends on the driver's LICENSE, not on the document the
// customer registered with: foreign license → passport or cédula de extranjería;
// Colombian license → cédula colombiana. The question is mandatory (no default)
// and UI-only — it never reaches the reservation payload.

const REQUIRED_MSG = 'Selecciona el tipo de licencia de conducción'

const validReservation = {
  vehiculo: 'CDAR',
  nombreCompleto: 'Juan',
  apellidos: 'Pérez',
  tipoIdentificacion: 'Cedula Ciudadania',
  identificacion: '1020304050',
  telefono: '+573001234567',
  email: 'juan@example.com',
  politicaPrivacidad: true,
  tipoLicencia: 'colombiana',
}

function parse(overrides: Record<string, unknown> = {}) {
  return v.safeParse(ReservationFormValidationSchema, { ...validReservation, ...overrides })
}

function issueFor(result: ReturnType<typeof parse>, key: string) {
  return result.issues?.find((issue) => issue.path?.[0]?.key === key)
}

beforeAll(async () => {
  await loadPhoneValidator()
})

describe('SCEN-LIC-04 — submit is blocked while the question is unanswered', () => {
  it('rejects a reservation without the field, pointing at tipoLicencia', () => {
    const { tipoLicencia: _omitted, ...rest } = validReservation
    const result = v.safeParse(ReservationFormValidationSchema, rest)
    expect(result.success).toBe(false)
    expect(issueFor(result, 'tipoLicencia')?.message).toBe(REQUIRED_MSG)
  })

  it('rejects the store\'s initial null with the same message', () => {
    const result = parse({ tipoLicencia: null })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'tipoLicencia')?.message).toBe(REQUIRED_MSG)
  })

  it('rejects a value outside the two options', () => {
    const result = parse({ tipoLicencia: 'gringa' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'tipoLicencia')?.message).toBe(REQUIRED_MSG)
  })
})

describe('SCEN-LIC-06 — registration document stays decoupled from the license', () => {
  const combos = [
    { tipoIdentificacion: 'Cedula Ciudadania', identificacion: '1020304050', tipoLicencia: 'colombiana' },
    { tipoIdentificacion: 'Cedula Ciudadania', identificacion: '1020304050', tipoLicencia: 'extranjera' },
    { tipoIdentificacion: 'Pasaporte', identificacion: 'AB123456', tipoLicencia: 'colombiana' },
    { tipoIdentificacion: 'Pasaporte', identificacion: 'AB123456', tipoLicencia: 'extranjera' },
  ] as const

  it.each(combos)('accepts %j', (combo) => {
    expect(parse({ ...combo }).success).toBe(true)
  })

  it('still applies the identification format rule independently', () => {
    const result = parse({ tipoIdentificacion: 'Cedula Ciudadania', identificacion: 'ABC', tipoLicencia: 'extranjera' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'identificacion')).toBeDefined()
    expect(issueFor(result, 'tipoLicencia')).toBeUndefined()
  })
})

describe('SCEN-LIC-02 / SCEN-LIC-03 — the notice catalog is the single source', () => {
  it('offers exactly the two options, Colombiana first', () => {
    expect(DRIVER_LICENSE_OPTIONS.map((o) => o.value)).toEqual(['colombiana', 'extranjera'])
    expect(DRIVER_LICENSE_OPTIONS.map((o) => o.label)).toEqual(['Colombiana', 'Extranjera'])
  })

  it('returns the Colombian-license notice verbatim', () => {
    expect(driverLicenseNotice('colombiana')).toBe(
      'Al recoger el carro deberás presentar tu cédula colombiana. No se acepta pasaporte ni cédula de extranjería si presentas una licencia de conducción colombiana.',
    )
  })

  it('returns the foreign-license notice verbatim', () => {
    expect(driverLicenseNotice('extranjera')).toBe(
      'Al recoger el carro deberás presentar tu pasaporte o cédula de extranjería. No se acepta la cédula colombiana si presentas una licencia de conducción extranjera.',
    )
  })

  it('returns null while unanswered — SCEN-LIC-01, the notice must not exist', () => {
    expect(driverLicenseNotice(null)).toBeNull()
    expect(driverLicenseNotice(undefined)).toBeNull()
  })
})
