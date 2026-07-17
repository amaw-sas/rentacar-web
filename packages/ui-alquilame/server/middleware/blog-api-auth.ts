/**
 * Blog API Security Middleware
 *
 * Protection layers:
 * 1. API key authentication (X-Api-Key header)
 * 2. Rate limiting (100 requests/hour per IP, backed by Supabase RPC)
 *
 * Only applies to /api/blog/* endpoints (except public read endpoints).
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '../utils/logger'

// Rate limit constants
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 100

/**
 * Extract client IP from request
 * Only trusts x-forwarded-for when behind trusted proxy (Firebase/GCP)
 */
function getClientIp(event: any): string {
  // Vercel (and most edge hosts) set x-forwarded-for; without it, rate limits
  // collapse to a single shared socket IP (issue 322 SCEN-322-S05). Prefer H3's
  // trusted XFF parsing — same pattern as reservations proxies.
  let ip =
    getRequestIP(event, { xForwardedFor: true }) ||
    getRequestIP(event) ||
    event.node?.req?.socket?.remoteAddress ||
    'unknown'

  // Normalize IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.slice(7)
  }

  // Normalize IPv6 loopback to IPv4 (::1 → 127.0.0.1)
  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  return ip
}

/**
 * Validate API key using constant-time comparison
 * Prevents byte-by-byte and length timing attacks via HMAC normalization
 */
function isApiKeyValid(apiKey: string | undefined, expectedKey: string): boolean {
  if (!apiKey) return false
  // HMAC normalizes both inputs to fixed-length digest — eliminates length timing attack
  const hmacKey = Buffer.alloc(32, 0)
  const a = createHmac('sha256', hmacKey).update(apiKey).digest()
  const b = createHmac('sha256', hmacKey).update(expectedKey).digest()
  return timingSafeEqual(a, b)
}

/**
 * Main middleware handler
 */
export default defineEventHandler(async (event) => {
  // Only apply to /api/blog/* endpoints
  if (!event.path.startsWith('/api/blog/')) {
    return
  }

  // Skip public endpoints
  const publicPaths = ['/api/blog/posts']
  const isDynamicPostRead = event.path.startsWith('/api/blog/post/') && event.method === 'GET'
  if (publicPaths.includes(event.path) || isDynamicPostRead) {
    return
  }

  // Get runtime config
  const config = useRuntimeConfig()

  // Validate configuration — only API key required (no IP whitelist)
  if (!config.blogApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Blog API not configured properly'
    })
  }

  // Extract client IP (for rate limiting and logging)
  const clientIp = getClientIp(event)

  // 1. API Key validation
  const apiKey = event.node.req.headers['x-api-key'] as string | undefined
  if (!isApiKeyValid(apiKey, config.blogApiKey)) {
    logger.error('blog-api-auth', new Error('Invalid API key'), {
      ip: clientIp,
      path: event.path,
      reason: 'Invalid API key'
    })

    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Invalid API key'
    })
  }

  // 2. Rate limiting (Supabase RPC, fail-open on errors)
  const rateLimitResult = await checkBlogRateLimit(
    clientIp,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS
  )

  // Set headers BEFORE checking if allowed (ensure headers on ALL responses)
  event.node.res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
  event.node.res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  event.node.res.setHeader('X-RateLimit-Reset', rateLimitResult.resetAt.toString())

  if (!rateLimitResult.allowed) {
    logger.error('blog-api-auth-rate-limit', new Error('Rate limit exceeded'), {
      ip: clientIp,
      limit: RATE_LIMIT_MAX_REQUESTS
    })

    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }

  // Log successful authentication
  logger.info('blog-api-auth', {
    ip: clientIp,
    path: event.path,
    remaining: rateLimitResult.remaining
  })
})
