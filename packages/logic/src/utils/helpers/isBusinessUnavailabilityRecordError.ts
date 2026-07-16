import type { FetchError } from 'ofetch'

/**
 * Decide whether a failed POST /record should send the user to
 * `/sindisponibilidad` (true business "no stock") vs stay on the form with a
 * technical toast (5xx, network, timeout, 429, unknown).
 *
 * Issue 322 PR2 — SCEN-322-E01 / E02.
 */
export function isBusinessUnavailabilityRecordError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false

  const err = e as FetchError & { statusCode?: number }
  const data = err.data
  if (!data || typeof data !== 'object') {
    // 409/410 alone are not enough — admin may use them for non-stock conflicts.
    // Without a structured body, treat as technical (stay on form).
    return false
  }

  const body = data as Record<string, unknown>
  // Only explicit codes — not free-text `message` (avoids false "no stock").
  const candidates = [body.error, body.reservationStatus, body.status]
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue
    const n = raw.toLowerCase().trim().replace(/\s+/g, '_')
    if (
      n === 'sin_disponibilidad' ||
      n === 'sindisponibilidad' ||
      n === 'no_available' ||
      n === 'no_available_categories_error'
    ) {
      return true
    }
  }

  return false
}
