import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { extraDriverDocumentError } from '../userInformationForm'
import { ReservationFormValidationSchema } from '../reservationForm'

// Scenarios: docs/specs/issue-396-conductor-adicional/scenarios/conductor-adicional-datos.scenarios.md
//
// Localiza needs the extra driver's name and ID document to authorise them. The
// reservation payload only ever carried the boolean add-on flag, so the customer
// service team chased the data by phone. These tests pin the frontend contract:
// both fields required when — and only when — the add-on is contracted, document
// alphanumeric 6–15 (accepts cédula and passport), sentinel blocklist shared with
// the titular holder's rule.

const DOCUMENT_FORMAT_MSG = 'El documento debe tener entre 6 y 15 caracteres (letras y números)'
const DOCUMENT_SENTINEL_MSG =
  'Escribe la identificación real del conductor adicional, no un valor de prueba'
const NAME_REQUIRED_MSG = 'Escribe el nombre del conductor adicional'
const DOCUMENT_REQUIRED_MSG = 'Escribe la cédula o documento del conductor adicional'

// A reservation that validates today, before any extra-driver field exists.
const validReservation = {
  vehiculo: 'CDAR',
  nombreCompleto: 'Juan',
  apellidos: 'Pérez',
  tipoIdentificacion: 'Cedula Ciudadania',
  identificacion: '1020304050',
  telefono: '+573001234567',
  email: 'juan@example.com',
  politicaPrivacidad: true,
}

function parse(overrides: Record<string, unknown> = {}) {
  return v.safeParse(ReservationFormValidationSchema, { ...validReservation, ...overrides })
}

function issueFor(result: ReturnType<typeof parse>, key: string) {
  return result.issues?.find((issue) => issue.path?.[0]?.key === key)
}

describe('extraDriverDocumentError — SCEN-396-03, SCEN-396-04', () => {
  it('accepts a Colombian cédula', () => {
    expect(extraDriverDocumentError('1020304050')).toBeNull()
  })

  it('accepts an alphanumeric passport', () => {
    expect(extraDriverDocumentError('AB123456')).toBeNull()
  })

  it('tolerates surrounding whitespace', () => {
    expect(extraDriverDocumentError('  1020304050  ')).toBeNull()
  })

  it('returns null for empty input — presence is the cross-field rule\'s job', () => {
    expect(extraDriverDocumentError('')).toBeNull()
    expect(extraDriverDocumentError('   ')).toBeNull()
    expect(extraDriverDocumentError(null)).toBeNull()
    expect(extraDriverDocumentError(undefined)).toBeNull()
  })

  it('rejects the sentinel 123456 with the real-identification message', () => {
    expect(extraDriverDocumentError('123456')).toBe(DOCUMENT_SENTINEL_MSG)
  })

  it('rejects every sentinel the titular holder rule rejects', () => {
    const sentinels = [
      '123456', '1234567', '12345678', '123456789', '1234567890',
      '000000', '0000000', '00000000',
      '111111',
      '999999', '9999999', '99999999', '999999999', '9999999999',
    ]
    for (const sentinel of sentinels) {
      expect(extraDriverDocumentError(sentinel)).toBe(DOCUMENT_SENTINEL_MSG)
    }
  })

  it('rejects a document shorter than 6 characters', () => {
    expect(extraDriverDocumentError('12345')).toBe(DOCUMENT_FORMAT_MSG)
  })

  it('rejects a document longer than 15 characters', () => {
    expect(extraDriverDocumentError('ABCDEFGHIJKLMNOP')).toBe(DOCUMENT_FORMAT_MSG)
  })

  it('rejects punctuation and spaces inside the document', () => {
    expect(extraDriverDocumentError('10.203.040')).toBe(DOCUMENT_FORMAT_MSG)
    expect(extraDriverDocumentError('AB 123456')).toBe(DOCUMENT_FORMAT_MSG)
  })
})

describe('SCEN-396-07: without the add-on nothing changes', () => {
  it('validates when the three new fields are absent', () => {
    expect(parse().success).toBe(true)
  })

  // The trap this suite exists for: the store refs start at `null`, and
  // `v.optional` only neutralises `undefined`. With `v.optional` here, EVERY
  // reservation in EVERY brand would stop validating.
  it('validates when the three new fields are null', () => {
    const result = parse({
      conductorAdicional: null,
      conductorAdicionalNombre: null,
      conductorAdicionalIdentificacion: null,
    })
    expect(result.success).toBe(true)
  })

  it('validates when the add-on is explicitly false and the fields are empty', () => {
    expect(
      parse({
        conductorAdicional: false,
        conductorAdicionalNombre: '',
        conductorAdicionalIdentificacion: '',
      }).success,
    ).toBe(true)
  })

  it('ignores leftover extra-driver data when the add-on is not contracted', () => {
    expect(
      parse({
        conductorAdicional: false,
        conductorAdicionalNombre: 'Ana Pérez',
        conductorAdicionalIdentificacion: '123456',
      }).success,
    ).toBe(true)
  })
})

describe('SCEN-396-02: the name is required once the add-on is contracted', () => {
  const withAddOn = {
    conductorAdicional: true,
    conductorAdicionalIdentificacion: '1020304050',
  }

  it('blocks on an empty name, pointing at the name field', () => {
    const result = parse({ ...withAddOn, conductorAdicionalNombre: '' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalNombre')?.message).toBe(NAME_REQUIRED_MSG)
  })

  it('blocks on a whitespace-only name', () => {
    const result = parse({ ...withAddOn, conductorAdicionalNombre: '   ' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalNombre')?.message).toBe(NAME_REQUIRED_MSG)
  })

  it('blocks on a null name', () => {
    const result = parse({ ...withAddOn, conductorAdicionalNombre: null })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalNombre')?.message).toBe(NAME_REQUIRED_MSG)
  })

  it('accepts a filled name', () => {
    expect(parse({ ...withAddOn, conductorAdicionalNombre: 'Ana Pérez' }).success).toBe(true)
  })
})

describe('SCEN-396-03 / SCEN-396-04: the document rule through the schema', () => {
  const withAddOn = {
    conductorAdicional: true,
    conductorAdicionalNombre: 'Ana Pérez',
  }

  it('blocks on an empty document, pointing at the document field', () => {
    const result = parse({ ...withAddOn, conductorAdicionalIdentificacion: '' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalIdentificacion')?.message).toBe(
      DOCUMENT_REQUIRED_MSG,
    )
  })

  it('blocks on a null document', () => {
    const result = parse({ ...withAddOn, conductorAdicionalIdentificacion: null })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalIdentificacion')?.message).toBe(
      DOCUMENT_REQUIRED_MSG,
    )
  })

  it('blocks the sentinel with the sentinel message, not the format one', () => {
    const result = parse({ ...withAddOn, conductorAdicionalIdentificacion: '123456' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalIdentificacion')?.message).toBe(
      DOCUMENT_SENTINEL_MSG,
    )
  })

  it('blocks a malformed document with the format message', () => {
    const result = parse({ ...withAddOn, conductorAdicionalIdentificacion: '12345' })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'conductorAdicionalIdentificacion')?.message).toBe(
      DOCUMENT_FORMAT_MSG,
    )
  })

  it('accepts a passport — the add-on has no document-type selector', () => {
    expect(parse({ ...withAddOn, conductorAdicionalIdentificacion: 'AB123456' }).success).toBe(
      true,
    )
  })

  it('accepts a cédula', () => {
    expect(parse({ ...withAddOn, conductorAdicionalIdentificacion: '1020304050' }).success).toBe(
      true,
    )
  })
})

describe('the extra-driver rules do not shadow the titular holder rules', () => {
  it('still rejects a sentinel in the holder identificacion', () => {
    const result = parse({
      identificacion: '123456',
      conductorAdicional: true,
      conductorAdicionalNombre: 'Ana Pérez',
      conductorAdicionalIdentificacion: '1020304050',
    })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'identificacion')?.message).toBe(
      'Escribe tu identificación real, no un valor de prueba',
    )
  })

  it('reports both the holder and the extra driver when both are wrong', () => {
    const result = parse({
      identificacion: '123456',
      conductorAdicional: true,
      conductorAdicionalNombre: '',
      conductorAdicionalIdentificacion: '',
    })
    expect(result.success).toBe(false)
    expect(issueFor(result, 'identificacion')).toBeDefined()
    expect(issueFor(result, 'conductorAdicionalNombre')).toBeDefined()
    expect(issueFor(result, 'conductorAdicionalIdentificacion')).toBeDefined()
  })
})
