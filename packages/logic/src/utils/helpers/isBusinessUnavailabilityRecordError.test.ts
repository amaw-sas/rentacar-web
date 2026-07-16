import { describe, it, expect } from 'vitest'
import { isBusinessUnavailabilityRecordError } from './isBusinessUnavailabilityRecordError'

describe('isBusinessUnavailabilityRecordError — SCEN-322-E01/E02', () => {
  it('treats structured sin_disponibilidad body as business', () => {
    expect(
      isBusinessUnavailabilityRecordError({
        status: 422,
        data: { error: 'sin_disponibilidad', message: 'No hay' },
      }),
    ).toBe(true)
    expect(
      isBusinessUnavailabilityRecordError({
        status: 400,
        data: { reservationStatus: 'Sin disponibilidad' },
      }),
    ).toBe(true)
    expect(
      isBusinessUnavailabilityRecordError({
        status: 409,
        data: { error: 'sin_disponibilidad' },
      }),
    ).toBe(true)
  })

  it('does NOT treat bare 409/410 or free-text message alone as business', () => {
    expect(isBusinessUnavailabilityRecordError({ status: 409 })).toBe(false)
    expect(isBusinessUnavailabilityRecordError({ statusCode: 410 })).toBe(false)
    expect(
      isBusinessUnavailabilityRecordError({
        status: 500,
        data: { message: 'sin_disponibilidad en logs internos' },
      }),
    ).toBe(false)
  })

  it('does NOT treat 5xx / network / empty body as business', () => {
    expect(isBusinessUnavailabilityRecordError({ status: 500 })).toBe(false)
    expect(isBusinessUnavailabilityRecordError({ status: 504, data: { error: true } })).toBe(false)
    expect(isBusinessUnavailabilityRecordError({ status: 429 })).toBe(false)
    expect(isBusinessUnavailabilityRecordError(new Error('fetch failed'))).toBe(false)
    expect(isBusinessUnavailabilityRecordError(null)).toBe(false)
  })
})
