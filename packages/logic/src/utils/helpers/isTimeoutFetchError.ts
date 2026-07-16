/**
 * Detect ofetch/Abort timeouts so callers can map them to `connection_timeout`
 * instead of a raw technical envelope.
 *
 * Issue 322 PR2 — SCEN-322-E04 / E05.
 */
export function isTimeoutFetchError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as {
    name?: string
    message?: string
    cause?: { name?: string; message?: string }
  }
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return true
  if (err.cause?.name === 'TimeoutError' || err.cause?.name === 'AbortError') return true
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`
  return /timeout|aborted|abort/i.test(msg)
}
