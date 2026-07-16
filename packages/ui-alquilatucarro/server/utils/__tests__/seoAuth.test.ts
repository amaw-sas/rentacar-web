import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  createSeoSessionToken,
  verifySeoSessionToken,
  createOAuthState,
} from '../seoAuthToken'

describe('seoAuthToken — SCEN-322-S02 signed session', () => {
  const secret = 'test-seo-password-super-secret'

  it('creates a token that is not the literal authenticated', () => {
    const token = createSeoSessionToken(secret)
    expect(token).not.toBe('authenticated')
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifies a fresh token', () => {
    const token = createSeoSessionToken(secret)
    expect(verifySeoSessionToken(token, secret)).toBe(true)
  })

  it('rejects the legacy constant value', () => {
    expect(verifySeoSessionToken('authenticated', secret)).toBe(false)
  })

  it('rejects tampered signatures', () => {
    const token = createSeoSessionToken(secret)
    const parts = token.split('.')
    parts[2] = '0'.repeat(parts[2]!.length)
    expect(verifySeoSessionToken(parts.join('.'), secret)).toBe(false)
  })

  it('rejects wrong secret', () => {
    const token = createSeoSessionToken(secret)
    expect(verifySeoSessionToken(token, 'other-secret')).toBe(false)
  })

  it('rejects expired tokens', () => {
    const exp = Math.floor(Date.now() / 1000) - 10
    const nonce = 'abc'
    const payload = `${exp}.${nonce}`
    const sig = createHmac('sha256', secret).update(`seo-session:${payload}`).digest('hex')
    expect(verifySeoSessionToken(`${payload}.${sig}`, secret)).toBe(false)
  })
})

describe('seoAuthToken — SCEN-322-S03 oauth state', () => {
  it('creates non-empty random state values', () => {
    const a = createOAuthState()
    const b = createOAuthState()
    expect(a.length).toBeGreaterThan(16)
    expect(a).not.toBe(b)
  })
})
