/**
 * Blog cache guard — shared by the 3 brands (issue #322, SCEN-322-N03).
 *
 * Blog post pages are SSR'd from Supabase at runtime with `isr: 3600`
 * (routeRules `/blog/**`). When a post resolves to null — unknown slug or a
 * cold-start fetch failure — the page renders "Artículo no encontrado" and
 * sets HTTP 404 (see app/pages/blog/[...slug].vue; /api/blog/post/[slug]
 * 404s the same way). Caching that response for 1h makes a valid post
 * unreachable on every direct URL access until the cache expires.
 *
 * This plugin marks those responses `private, no-cache` so the CDN never
 * holds them, while valid (2xx) posts keep the ISR policy from routeRules.
 *
 * It lives in the logic layer's server/ dir on purpose: Nuxt merges a
 * layer's server/ into every consumer via `extends` (same mechanism that
 * already serves packages/logic/server/api/rentacar-data.get.ts for the 3
 * brands), so the guard cannot drift per brand again. It replaces the
 * alquilatucarro-only server/middleware/blog-cache-control.ts, which
 * no-cached ALL post pages (valid ones included) because request-phase
 * middleware cannot see how the post resolved — a response-phase hook can.
 */

/** Paths whose error responses must never be CDN-cached. */
export function isGuardedBlogPath(path: string): boolean {
  return /^\/blog\/.+/.test(path) || /^\/api\/blog\/post\/.+/.test(path)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (!isGuardedBlogPath(event.path)) return
    if (getResponseStatus(event) < 400) return
    setResponseHeader(event, 'Cache-Control', 'private, no-cache')
  })
})
