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
    return await $fetch(`${adminUrl}/api/reservations/availability`, {
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
