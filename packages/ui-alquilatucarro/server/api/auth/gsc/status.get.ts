import { isGscConnected, getGscTokens } from '../../../utils/gsc'

export default defineEventHandler(async () => {
  const connected = await isGscConnected()
  const tokens = await getGscTokens()

  return {
    connected,
    expiresAt: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : null,
    createdAt: tokens?.created_at || null,
    scope: tokens?.scope || null
  }
})
