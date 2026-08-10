import {
  buildMarkdownForPath,
  estimateMarkdownTokens,
} from '../utils/markdownForAgents'

/**
 * Markdown for Agents — when Accept includes text/markdown, return a markdown
 * body instead of HTML for known content paths (home, llms-linked pages, blog).
 * @see https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 * @see isitagentready contentAccessibility.markdownNegotiation
 */
export default defineEventHandler((event) => {
  const method = event.method
  if (method !== 'GET' && method !== 'HEAD') return

  const accept = getRequestHeader(event, 'accept') || ''
  if (!/\btext\/markdown\b/i.test(accept)) return

  const url = getRequestURL(event)
  const path = url.pathname

  // Never hijack APIs, assets, or discovery documents that already have types.
  if (
    path.startsWith('/api') ||
    path.startsWith('/_') ||
    path.startsWith('/.well-known') ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path === '/llms.txt' ||
    path === '/llms-full.txt' ||
    path === '/rss.xml' ||
    path === '/openapi.json' ||
    path === '/auth.md' ||
    /\.\w{1,8}$/.test(path)
  ) {
    return
  }

  const llms = useRuntimeConfig(event).llms as {
    title?: string
    description?: string
    sections?: Array<{
      title?: string
      description?: string
      links?: Array<{ title?: string; href?: string; description?: string }>
    }>
    notes?: string[]
    domain?: string
  }

  const markdown = buildMarkdownForPath(llms || {}, path)
  if (!markdown) return

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Vary', 'Accept')
  setHeader(event, 'x-markdown-tokens', String(estimateMarkdownTokens(markdown)))
  setResponseStatus(event, 200)

  if (method === 'HEAD') {
    return ''
  }
  return markdown
})
