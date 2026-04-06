const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly'
]

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  const clientId = String(config.gscClientId || '').trim()
  const redirectUri = String(config.gscRedirectUri || '').trim() || `${getRequestURL(event).origin}/api/auth/gsc/callback`

  if (!clientId) {
    throw createError({
      statusCode: 500,
      message: 'GSC_CLIENT_ID no configurado en variables de entorno'
    })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return sendRedirect(event, authUrl)
})
