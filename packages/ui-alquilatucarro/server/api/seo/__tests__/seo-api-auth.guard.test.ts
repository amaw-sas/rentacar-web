import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Structural guards for issue 322 PR4 SEO API protection.
 * Holdout: docs/specs/issue-322-pr4-security/scenarios/seo-auth-headers.scenarios.md
 */
const middleware = readFileSync(
  fileURLToPath(new URL('../../../middleware/seo-api-auth.ts', import.meta.url)),
  'utf8',
)
const authPost = readFileSync(
  fileURLToPath(new URL('../auth.post.ts', import.meta.url)),
  'utf8',
)
const authorize = readFileSync(
  fileURLToPath(new URL('../../auth/gsc/authorize.get.ts', import.meta.url)),
  'utf8',
)
const callback = readFileSync(
  fileURLToPath(new URL('../../auth/gsc/callback.get.ts', import.meta.url)),
  'utf8',
)

describe('SCEN-322-S01 — /api/seo/* guarded', () => {
  it('seo-api-auth middleware requires SEO auth on /api/seo and GSC authorize', () => {
    expect(middleware).toMatch(/requireSeoAuth/)
    expect(middleware).toMatch(/\/api\/seo\//)
    expect(middleware).toMatch(/\/api\/auth\/gsc\//)
  })

  it('does not leave login path protected against itself', () => {
    expect(middleware).toMatch(/\/api\/seo\/auth/)
  })
})

describe('SCEN-322-S02 — session cookie is signed, not authenticated literal', () => {
  it('auth.post uses setSeoSessionCookie / createSeoSessionToken path', () => {
    expect(authPost).toMatch(/setSeoSessionCookie/)
    expect(authPost).not.toMatch(/['"]authenticated['"]/)
  })
})

describe('SCEN-322-S03 — GSC OAuth state + session', () => {
  it('authorize requires SEO auth and emits state', () => {
    expect(authorize).toMatch(/requireSeoAuth/)
    expect(authorize).toMatch(/state/)
    expect(authorize).toMatch(/setGscOAuthStateCookie|createOAuthState/)
  })

  it('callback validates state before saveGscTokens', () => {
    expect(callback).toMatch(/consumeGscOAuthState/)
    const stateIdx = callback.indexOf('consumeGscOAuthState')
    const saveIdx = callback.indexOf('await saveGscTokens')
    expect(stateIdx).toBeGreaterThan(-1)
    expect(saveIdx).toBeGreaterThan(stateIdx)
  })
})
