import {
  defineEventHandler,
  readBody,
  createError,
  setResponseStatus,
  getRequestIP,
  getRequestHeader,
} from 'h3'
import { extractStructuredError, RECORD_FETCH_TIMEOUT_MS } from '@rentacar-main/logic/utils'

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

  // The 3 brand sites sit behind Cloudflare, which stamps `cf-ipcountry` with
  // the visitor's country (same rationale as /api/visitor-country: Vercel's
  // x-vercel-ip-country reflects Cloudflare's egress, not the visitor).
  // "XX" = Cloudflare "unknown"; omit the header when unknown or absent.
  const rawCountry = (getRequestHeader(event, 'cf-ipcountry') ?? '').trim().toUpperCase()
  const clientCountry = /^[A-Z]{2}$/.test(rawCountry) && rawCountry !== 'XX' ? rawCountry : null

  try {
    // Explicit generic: EXTERNAL URL (admin backend), not an internal route —
    // typing it stops Nuxt matching the string against the internal route union
    // (which overflows TS recursion: TS2321 "excessive stack depth").
    return await $fetch<unknown>(`${adminUrl}/api/reservations`, {
      method: 'POST',
      timeout: RECORD_FETCH_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(clientIp ? { 'x-real-client-ip': clientIp } : {}),
        ...(clientCountry ? { 'x-real-client-country': clientCountry } : {}),
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
