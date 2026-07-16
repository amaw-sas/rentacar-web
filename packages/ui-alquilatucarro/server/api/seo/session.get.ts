import { getCookie } from 'h3'
import {
  SEO_AUTH_COOKIE,
  getSeoSecret,
  verifySeoSessionToken,
} from '../../utils/seoAuth'

/**
 * Lightweight probe for the client route middleware (cookie is httpOnly).
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  let secret: string
  try {
    secret = getSeoSecret(config as { seoPassword?: string })
  } catch {
    throw createError({ statusCode: 500, message: 'SEO_PASSWORD no configurado en el servidor' })
  }

  const token = getCookie(event, SEO_AUTH_COOKIE)
  if (!verifySeoSessionToken(token, secret)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  return { authenticated: true }
})
