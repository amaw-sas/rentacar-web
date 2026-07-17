import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Pure token helpers (no h3) — easy to unit-test without Nitro auto-imports.
 * Issue 322 PR4.
 */

export function createSeoSessionToken(secret: string, maxAgeSec = 60 * 60 * 24 * 7): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec
  const nonce = randomBytes(16).toString('hex')
  const payload = `${exp}.${nonce}`
  const sig = createHmac('sha256', secret).update(`seo-session:${payload}`).digest('hex')
  return `${payload}.${sig}`
}

export function verifySeoSessionToken(
  token: string | undefined | null,
  secret: string,
): boolean {
  if (!token || !secret) return false
  // Reject the legacy constant value immediately.
  if (token === 'authenticated') return false

  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expStr, nonce, sig] = parts
  if (!expStr || !nonce || !sig) return false
  if (!/^\d+$/.test(expStr) || !/^[a-f0-9]+$/i.test(nonce) || !/^[a-f0-9]+$/i.test(sig)) {
    return false
  }

  const payload = `${expStr}.${nonce}`
  const expected = createHmac('sha256', secret)
    .update(`seo-session:${payload}`)
    .digest('hex')

  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  } catch {
    return false
  }

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
  return true
}

export function createOAuthState(): string {
  return randomBytes(24).toString('hex')
}
