import { describe, expect, it } from 'vitest'
import { normalizeReservationCode } from '../reservationCode'

describe('normalizeReservationCode', () => {
  it.each(['AV78', 'ABC-12345', 'abc123', '123e4567-e89b-12d3-a456-426614174000'])(
    'accepts a booking-compatible code: %s',
    (code) => {
      expect(normalizeReservationCode(code)).toBe(code)
    },
  )

  it.each([undefined, null, ['AV78'], 'ABC', ' ABC123', 'ABC_123', 'ABC/123', 'A'.repeat(65)])(
    'rejects a malformed route value: %j',
    (value) => {
      expect(normalizeReservationCode(value)).toBeNull()
    },
  )
})
