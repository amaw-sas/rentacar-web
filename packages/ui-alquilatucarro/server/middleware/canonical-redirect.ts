/**
 * Server middleware: Redirect www → non-www (canonical domain)
 *
 * SEO rationale: Google Search Console shows traffic split between
 * www.alquilatucarro.com and alquilatucarro.com. This consolidates
 * all traffic to the canonical non-www domain with a 301 redirect.
 */
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })

  // Only redirect if host starts with www
  if (host?.startsWith('www.')) {
    const canonicalHost = host.replace(/^www\./, '')
    const url = getRequestURL(event)
    const canonicalUrl = `https://${canonicalHost}${url.pathname}${url.search}`

    // 301 permanent redirect for SEO
    return sendRedirect(event, canonicalUrl, 301)
  }
})
