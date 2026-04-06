export default defineNuxtRouteMiddleware((to) => {
  // Solo aplicar a rutas /seo/* excepto login
  if (!to.path.startsWith('/seo') || to.path === '/seo/login') {
    return
  }

  // Verificar cookie de sesión
  const authCookie = useCookie('seo-auth')

  if (!authCookie.value) {
    // Redirigir a login guardando la ruta original
    return navigateTo(`/seo/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
