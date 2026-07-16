/**
 * Protects /api/seo/* (except login) and GSC authorize with a signed SEO session.
 * Issue 322 SCEN-322-S01 / S03 — the panel UI cookie was client-only and APIs
 * were public; this enforces auth on the server for every data/mutation path.
 */
import { requireSeoAuth } from '../utils/seoAuth'

export default defineEventHandler((event) => {
  const path = event.path || ''

  // Public SEO endpoints (login, session probe, logout clear cookie).
  if (
    path === '/api/seo/auth' ||
    path.startsWith('/api/seo/auth/') ||
    path === '/api/seo/session' ||
    path.startsWith('/api/seo/session') ||
    path === '/api/seo/logout' ||
    path.startsWith('/api/seo/logout')
  ) {
    return
  }
  // OAuth callback must accept Google's redirect; CSRF is enforced via `state`.
  if (path.startsWith('/api/auth/gsc/callback')) {
    return
  }

  const needsSeoAuth =
    path.startsWith('/api/seo/') ||
    path.startsWith('/api/auth/gsc/')

  if (!needsSeoAuth) return

  requireSeoAuth(event)
})
