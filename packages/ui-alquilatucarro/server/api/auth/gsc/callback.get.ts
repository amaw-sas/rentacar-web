import { saveGscTokens } from '../../../utils/gsc'
import { consumeGscOAuthState } from '../../../utils/seoAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const code = query.code as string
  const error = query.error as string
  const state = query.state as string | undefined

  if (error) {
    return sendRedirect(event, '/seo/herramientas?error=' + encodeURIComponent(error))
  }

  // CSRF: state must match the httpOnly cookie set at authorize (SCEN-322-S03).
  if (!consumeGscOAuthState(event, state)) {
    return sendRedirect(event, '/seo/herramientas?error=invalid_state')
  }

  if (!code) {
    return sendRedirect(event, '/seo/herramientas?error=no_code')
  }

  const clientId = String(config.gscClientId || '').trim()
  const clientSecret = String(config.gscClientSecret || '').trim()
  const redirectUri =
    String(config.gscRedirectUri || '').trim() ||
    `${getRequestURL(event).origin}/api/auth/gsc/callback`

  if (!clientId || !clientSecret) {
    return sendRedirect(event, '/seo/herramientas?error=missing_credentials')
  }

  try {
    const tokenResponse = await $fetch<{
      access_token: string
      refresh_token?: string
      expires_in: number
      token_type: string
      scope: string
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      },
    })

    const tokenData = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      created_at: new Date().toISOString(),
    }

    await saveGscTokens(tokenData)

    return sendRedirect(event, '/seo/herramientas?success=gsc_connected')
  } catch (err: any) {
    console.error('GSC OAuth error:', err)
    return sendRedirect(
      event,
      '/seo/herramientas?error=' + encodeURIComponent(err.message || 'token_exchange_failed'),
    )
  }
})
