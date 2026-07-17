import { describe, it, expect } from 'vitest'
import { isTimeoutFetchError } from './isTimeoutFetchError'

describe('isTimeoutFetchError — SCEN-322-E04', () => {
  it('detects TimeoutError / AbortError by name', () => {
    expect(isTimeoutFetchError({ name: 'TimeoutError' })).toBe(true)
    expect(isTimeoutFetchError({ name: 'AbortError' })).toBe(true)
    expect(isTimeoutFetchError({ cause: { name: 'TimeoutError' } })).toBe(true)
  })

  it('detects timeout language in message', () => {
    expect(isTimeoutFetchError({ message: 'The operation was aborted due to timeout' })).toBe(true)
  })

  it('rejects unrelated errors', () => {
    expect(isTimeoutFetchError({ status: 500, message: 'Internal' })).toBe(false)
    expect(isTimeoutFetchError(null)).toBe(false)
  })
})
