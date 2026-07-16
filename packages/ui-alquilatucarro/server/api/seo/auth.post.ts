import {
  getSeoSecret,
  setSeoSessionCookie,
} from '../../utils/seoAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { password } = body

  const config = useRuntimeConfig()
  const seoPassword = getSeoSecret(config as { seoPassword?: string })

  // Constant-time-ish compare via HMAC digest length equality is not needed for
  // operator password here; reject wrong password without leaking config.
  if (password !== seoPassword) {
    throw createError({
      statusCode: 401,
      message: 'Contraseña incorrecta',
    })
  }

  // Signed, httpOnly session — not a fixed constant string (SCEN-322-S02).
  setSeoSessionCookie(event, seoPassword)

  return { success: true }
})
