import { normalizeReservationCode } from '@rentacar-main/logic/utils'
import { useSupabaseAdminClient } from '../../../utils/supabase'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const RATE_LIMIT_MAX_IPS = 10_000

interface RateLimitEntry {
  count: number
  resetAt: number
}

const requestsByIp = new Map<string, RateLimitEntry>()

function getClientIp(event: Parameters<typeof getRequestIP>[0]): string {
  return (
    getRequestIP(event, { xForwardedFor: true }) ||
    getRequestIP(event) ||
    'unknown'
  )
}

function pruneRateLimitEntries(now: number) {
  for (const [ip, entry] of requestsByIp) {
    if (entry.resetAt <= now) requestsByIp.delete(ip)
  }

  if (requestsByIp.size >= RATE_LIMIT_MAX_IPS) {
    const oldestIp = requestsByIp.keys().next().value
    if (typeof oldestIp === 'string') requestsByIp.delete(oldestIp)
  }
}

function consumeRateLimit(ip: string, now = Date.now()) {
  const current = requestsByIp.get(ip)

  if (!current || current.resetAt <= now) {
    pruneRateLimitEntries(now)
    const entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    requestsByIp.set(ip, entry)
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, ...entry }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, ...current }
  }

  current.count += 1
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    ...current,
  }
}

function enforceRateLimit(event: Parameters<typeof getRequestIP>[0]) {
  const now = Date.now()
  const result = consumeRateLimit(getClientIp(event), now)

  setResponseHeader(event, 'X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
  setResponseHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  setResponseHeader(event, 'X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1_000)))

  if (!result.allowed) {
    setResponseHeader(
      event,
      'Retry-After',
      Math.max(1, Math.ceil((result.resetAt - now) / 1_000)),
    )
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }
}

function logLookupFailure(error: unknown) {
  const errorName = error instanceof Error ? error.name : 'SupabaseError'
  const errorCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined

  console.error('[reservation-exists] Supabase lookup unavailable.', {
    errorName,
    errorCode,
  })
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  // Best-effort, per-instance protection. Serverless instances do not share
  // this map, so opaque reservation codes remain the primary anti-enumeration
  // control; the residual risk is documented on the PR.
  enforceRateLimit(event)

  const reserveCode = normalizeReservationCode(getRouterParam(event, 'reserveCode'))
  if (!reserveCode) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Reserva no encontrada',
    })
  }

  const franchise = useRuntimeConfig(event).public?.rentacarFranchise
  if (typeof franchise !== 'string' || franchise.length === 0) {
    throw createError({
      statusCode: 503,
      statusMessage: 'No fue posible validar la reserva',
    })
  }

  try {
    const supabase = useSupabaseAdminClient()
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('reservation_code', reserveCode)
      .eq('franchise', franchise)
      .maybeSingle()

    if (error) throw error

    return { exists: data !== null }
  } catch (error) {
    // Avoid logging the thrown object because a network error can contain the
    // filtered request URL, including the bearer-like reservation code.
    logLookupFailure(error)
    throw createError({
      statusCode: 503,
      statusMessage: 'No fue posible validar la reserva',
    })
  }
})
