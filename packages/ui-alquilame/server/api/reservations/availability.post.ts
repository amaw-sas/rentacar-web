import { defineEventHandler, readBody, createError, setResponseStatus, getRequestIP } from 'h3'
import { extractStructuredError } from '@rentacar-main/logic/utils'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminUrl = config.rentacarAdminUrl
  const apiKey = config.rentacarAdminApiKey

  if (!adminUrl || !apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NUXT_RENTACAR_ADMIN_URL or NUXT_RENTACAR_ADMIN_API_KEY',
    })
  }

  const body = await readBody(event)

  // Fix B: forward the end-user's real IP so the dashboard rate-limits per
  // operator. Vercel overwrites x-forwarded-for with this funnel's shared NAT
  // egress IP, masking every operator behind one IP. Omit when unavailable.
  const clientIp = getRequestIP(event, { xForwardedFor: true })

  try {
    // Explicit generic: this is an EXTERNAL URL (admin backend), not an internal
    // route — typing it stops Nuxt from matching the string against the internal
    // route union (which overflows TS recursion: TS2321 "excessive stack depth").
    return await $fetch<unknown>(`${adminUrl}/api/reservations/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(clientIp ? { 'x-real-client-ip': clientIp } : {}),
      },
      body,
    })
  } catch (e) {
    const forward = extractStructuredError(e)
    if (forward) {
      setResponseStatus(event, forward.status, forward.statusText)
      return forward.body
    }
    throw e
  }
})
