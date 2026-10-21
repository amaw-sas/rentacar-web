import { createIpWindowLimiter } from '../../utils/ipWindowLimiter'
import { useSupabaseAdminClient } from '../../utils/supabase'

const MAX_CODE_LENGTH = 60

// Own instance: calls here never consume the reservations/exists budget.
const limiter = createIpWindowLimiter({ windowMs: 60_000, max: 30, maxIps: 10_000 })

// Behind Cloudflare the socket/X-Forwarded-For IP is a shared edge server;
// cf-connecting-ip is the real visitor.
function getClientIp(event: Parameters<typeof getRequestIP>[0]): string {
  const cf = getRequestHeader(event, 'cf-connecting-ip')?.trim()
  if (cf) return cf
  return (
    getRequestIP(event, { xForwardedFor: true }) ||
    getRequestIP(event) ||
    'unknown'
  )
}

function notFound() {
  return createError({ statusCode: 404, statusMessage: 'Asesor no encontrado' })
}

function normalizeCode(raw: string | undefined): string | null {
  if (!raw) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const code = decoded.trim().toLowerCase()
  if (!code || code.length > MAX_CODE_LENGTH) return null
  if (/[\s/?#]/.test(code)) return null
  if (code.endsWith('-bot')) return null
  return code
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const now = Date.now()
  const result = limiter.consume(getClientIp(event), now)
  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil((result.resetAt - now) / 1_000)))
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const code = normalizeCode(getRouterParam(event, 'code'))
  if (!code) throw notFound()

  let data: { code: string; name: string } | null
  try {
    // Service role: anon has no SELECT grant on referrals (dropped in production).
    // The select is limited to code,name so nothing else ever leaves the server.
    const supabase = useSupabaseAdminClient()
    const res = await supabase
      .from('referrals')
      .select('code,name')
      .eq('code', code)
      .eq('status', 'active')
      .eq('type', 'salesperson')
      .maybeSingle()
    if (res.error) throw res.error
    data = res.data
  } catch (error) {
    console.error('[asesor] referral lookup unavailable.', {
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined,
    })
    throw createError({ statusCode: 502, statusMessage: 'No fue posible verificar el asesor' })
  }

  if (!data) throw notFound()
  return { code: data.code, name: data.name }
})
