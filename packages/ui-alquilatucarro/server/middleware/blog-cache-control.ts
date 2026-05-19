/**
 * Blog Cache-Control Middleware
 *
 * Blog post pages are SSR'd from Vercel Blob at runtime. Caching them in
 * the CDN is dangerous: a cold-start failure rendering "Artículo no encontrado"
 * gets cached for 1h, making valid posts inaccessible on every direct URL access.
 *
 * This overrides the default `public, max-age=3600` set by routeRules `/**`
 * for dynamic blog post routes.
 */
export default defineEventHandler((event) => {
  const path = event.path

  // Individual post pages and their API endpoints — dynamic SSR from Vercel Blob
  if (
    /^\/blog\/.+/.test(path) ||
    /^\/api\/blog\/post\/.+/.test(path)
  ) {
    setResponseHeader(event, 'Cache-Control', 'private, no-cache')
  }
})
