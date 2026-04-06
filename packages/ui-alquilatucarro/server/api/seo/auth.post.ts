export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { password } = body

  // Obtener password de variable de entorno
  const config = useRuntimeConfig()
  const seoPassword = config.seoPassword || process.env.SEO_PASSWORD

  if (!seoPassword) {
    throw createError({
      statusCode: 500,
      message: 'SEO_PASSWORD no configurado en el servidor'
    })
  }

  if (password !== seoPassword) {
    throw createError({
      statusCode: 401,
      message: 'Contraseña incorrecta'
    })
  }

  // Establecer cookie de sesión (expira en 7 días)
  // httpOnly: false para que useCookie() pueda leerla en el cliente
  setCookie(event, 'seo-auth', 'authenticated', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/'
  })

  return { success: true }
})
