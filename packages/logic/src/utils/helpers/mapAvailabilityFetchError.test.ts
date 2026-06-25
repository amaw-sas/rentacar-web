/**
 * SCEN-002 of
 * docs/specs/alquilame-dogfood-minors/scenarios/alquilame-dogfood-minors.scenarios.md
 *
 * Dogfood ISSUE-003: the availability error toast leaked a raw technical string
 * (`[POST] "http://…": fetch failed`) because the Nitro 500 envelope
 * `{ error: true, message: "…" }` passed the loose `'error' in data` gate and
 * was forwarded as if it were a structured Localiza error. The mapping must only
 * forward genuine string-coded Localiza errors and downgrade everything else to
 * a friendly server_error.
 */
import { describe, it, expect } from 'vitest'
import { mapAvailabilityFetchError } from './mapAvailabilityFetchError'

describe('mapAvailabilityFetchError', () => {
  it('forwards a genuine string-coded Localiza error verbatim', () => {
    const e = {
      data: { error: 'no_available_categories_error', message: 'No hay autos' },
    }
    const result = mapAvailabilityFetchError(e)
    expect(result.error).toBe('no_available_categories_error')
    expect(result.message).toBe('No hay autos')
  })

  it('downgrades the Nitro {error:true} envelope to a friendly server_error', () => {
    const e = {
      data: {
        error: true,
        url: 'http://localhost:4002/api/reservations/availability',
        statusCode: 500,
        message:
          '[POST] "http://localhost:3000/api/reservations/availability": <no response> fetch failed',
      },
    }
    const result = mapAvailabilityFetchError(e)
    expect(result.error).toBe('server_error')
    expect(result.message).not.toMatch(/fetch failed|http:\/\/|\[POST\]/i)
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('downgrades an error with no data (network failure) to server_error', () => {
    const result = mapAvailabilityFetchError(new Error('Failed to fetch'))
    expect(result.error).toBe('server_error')
    expect(result.message).not.toMatch(/fetch failed|http:\/\//i)
  })

  it('downgrades a blank/non-string error code to server_error', () => {
    expect(mapAvailabilityFetchError({ data: { error: '' } }).error).toBe('server_error')
    expect(mapAvailabilityFetchError({ data: { error: 123 } }).error).toBe('server_error')
  })
})
