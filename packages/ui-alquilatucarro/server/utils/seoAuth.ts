import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { createError, getCookie, setCookie, deleteCookie } from 'h3'
import {
  createSeoSessionToken,
  verifySeoSessionToken,
  createOAuthState,
} from './seoAuthToken'

export {
  createSeoSessionToken,
  verifySeoSessionToken,
  createOAuthState,
} from './seoAuthToken'

/** Cookie name for the SEO panel session (issue 322 PR4). */
export const SEO_AUTH_COOKIE = 'seo-auth'

/** Cookie name for GSC OAuth CSRF state. */
export const GSC_OAUTH_STATE_COOKIE = 'gsc-oauth-state'

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days
const STATE_MAX_AGE_SEC = 60 * 10 // 10 minutes

export function getSeoSecret(config: { seoPassword?: string }): string {
  // NUXT_SEO_PASSWORD / runtimeConfig.seoPassword, with env fallback for local.
  const secret = String(
    config.seoPassword || process.env.SEO_PASSWORD || process.env.NUXT_SEO_PASSWORD || '',
  ).trim()
  if (!secret) {
    throw createError({
      statusCode: 500,
      message: 'SEO_PASSWORD no configurado en el servidor',
    })
  }
  return secret
}

export function setSeoSessionCookie(event: H3Event, secret: string): void {
  const token = createSeoSessionToken(secret, SESSION_MAX_AGE_SEC)
  setCookie(event, SEO_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SEC,
    path: '/',
  })
}

export function clearSeoSessionCookie(event: H3Event): void {
  deleteCookie(event, SEO_AUTH_COOKIE, { path: '/' })
}

/** Throws 401 if the request lacks a valid SEO session. */
export function requireSeoAuth(event: H3Event): void {
  const config = useRuntimeConfig(event)
  const secret = getSeoSecret(config as { seoPassword?: string })
  const token = getCookie(event, SEO_AUTH_COOKIE)
  if (!verifySeoSessionToken(token, secret)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: SEO session required',
    })
  }
}

export function setGscOAuthStateCookie(event: H3Event, state: string): void {
  setCookie(event, GSC_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE_SEC,
    path: '/',
  })
}

export function consumeGscOAuthState(event: H3Event, presented: string | undefined): boolean {
  const expected = getCookie(event, GSC_OAUTH_STATE_COOKIE)
  deleteCookie(event, GSC_OAUTH_STATE_COOKIE, { path: '/' })
  if (!expected || !presented) return false
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(presented)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export { SESSION_MAX_AGE_SEC }
