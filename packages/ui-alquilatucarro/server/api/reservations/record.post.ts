import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
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

  try {
    // Explicit generic: EXTERNAL URL (admin backend), not an internal route —
    // typing it stops Nuxt matching the string against the internal route union
    // (which overflows TS recursion: TS2321 "excessive stack depth").
    return await $fetch<unknown>(`${adminUrl}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
