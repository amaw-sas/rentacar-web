export default defineNuxtRouteMiddleware(async (to) => {
  // Solo aplicar a rutas /seo/* excepto login
  if (!to.path.startsWith('/seo') || to.path === '/seo/login') {
    return
  }

  // Cookie is httpOnly — probe the server instead of useCookie (issue 322 PR4).
  try {
    await $fetch('/api/seo/session')
  } catch {
    return navigateTo(`/seo/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
