/**
 * Build markdown representations for Markdown-for-Agents content negotiation
 * (Accept: text/markdown). Prefer runtimeConfig.llms so content stays in sync
 * with /llms.txt (nuxt-llms).
 */

type LlmsLink = { title?: string; href?: string; description?: string }
type LlmsSection = { title?: string; description?: string; links?: LlmsLink[] }
type LlmsConfig = {
  title?: string
  description?: string
  sections?: LlmsSection[]
  notes?: string[]
  domain?: string
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function linkPath(href: string | undefined): string | null {
  if (!href) return null
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return normalizePath(new URL(href).pathname)
    }
    return normalizePath(href.startsWith('/') ? href : `/${href}`)
  } catch {
    return null
  }
}

/** Full-site overview — same structure as nuxt-llms GET /llms.txt. */
export function buildLlmsDocumentMarkdown(llms: LlmsConfig): string {
  const document: string[] = [`# ${llms.title || 'Documentation'}`]
  if (llms.description) {
    document.push(`> ${llms.description}`)
  }
  for (const section of llms.sections || []) {
    document.push(`## ${section.title}`)
    if (section.description) {
      document.push(section.description)
    }
    const links =
      section.links
        ?.map((link) =>
          link.description
            ? `- [${link.title}](${link.href}): ${link.description}`
            : `- [${link.title}](${link.href})`,
        )
        .join('\n') || ''
    if (links) document.push(links)
  }
  if (llms.notes?.length) {
    document.push('## Notes', llms.notes.map((n) => `- ${n}`).join('\n'))
  }
  return document.join('\n\n')
}

/**
 * Markdown for a request path, or null if we have no machine-readable page
 * and should fall through to HTML.
 */
export function buildMarkdownForPath(llms: LlmsConfig, pathname: string): string | null {
  const path = normalizePath(pathname)

  if (path === '/') {
    return buildLlmsDocumentMarkdown(llms)
  }

  for (const section of llms.sections || []) {
    for (const link of section.links || []) {
      if (linkPath(link.href) === path) {
        const lines = [`# ${link.title || path}`]
        if (link.description) lines.push('', link.description)
        if (link.href) lines.push('', `[Abrir página](${link.href})`)
        if (llms.domain) {
          lines.push('', `[Inicio](${llms.domain}/)`, `[llms.txt](${llms.domain}/llms.txt)`)
        }
        return lines.join('\n')
      }
    }
  }

  if (path === '/blog') {
    const domain = llms.domain || 'https://alquilatucarro.com'
    return [
      '# Blog de viajes — Alquilatucarro',
      '',
      'Guías de viaje por Colombia: requisitos de alquiler, pico y placa, rutas y tips.',
      '',
      `- [Blog](${domain}/blog)`,
      `- [Reserva de carros](${domain}/)`,
      `- [llms.txt](${domain}/llms.txt)`,
    ].join('\n')
  }

  return null
}

/** Rough token estimate for x-markdown-tokens (chars/4). */
export function estimateMarkdownTokens(markdown: string): number {
  return Math.max(1, Math.ceil(markdown.length / 4))
}
