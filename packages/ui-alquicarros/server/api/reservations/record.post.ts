import { defineEventHandler, readBody, createError } from 'h3'

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

  return await $fetch(`${adminUrl}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body,
  })
})
