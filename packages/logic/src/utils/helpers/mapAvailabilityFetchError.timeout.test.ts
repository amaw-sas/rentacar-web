import { describe, it, expect } from 'vitest'
import { mapAvailabilityFetchError } from './mapAvailabilityFetchError'

describe('mapAvailabilityFetchError — timeout → connection_timeout (SCEN-322-E04)', () => {
  it('maps TimeoutError to connection_timeout', () => {
    const mapped = mapAvailabilityFetchError({ name: 'TimeoutError', message: 'timeout' })
    expect(mapped.error).toBe('connection_timeout')
  })

  it('still maps structured Localiza codes', () => {
    const mapped = mapAvailabilityFetchError({
      data: { error: 'no_available_categories_error', message: 'x' },
    })
    expect(mapped.error).toBe('no_available_categories_error')
  })
})
