const RESERVATION_CODE_PATTERN = /^[A-Za-z0-9-]{4,64}$/

/**
 * Accept only the characters used by reservation codes returned by the booking
 * API. Keeping this guard shared means malformed route params are rejected by
 * the page before a request and again at the server trust boundary.
 */
export function normalizeReservationCode(value: unknown): string | null {
  if (typeof value !== 'string' || !RESERVATION_CODE_PATTERN.test(value)) {
    return null
  }

  return value
}
