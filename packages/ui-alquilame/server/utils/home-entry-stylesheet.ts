const LINK_TAG_RE = /<link\b[^>]*>/gi
const STYLESHEET_REL_RE = /\brel=(["'])stylesheet\1/i
const HREF_RE = /\bhref=(["'])([^"']+)\1/i
const HOME_ENTRY_MARKER_RE = /\bdata-home-entry-css=/i
const ENTRY_STYLESHEET_RE = /\/_nuxt\/entry\.[^/?#"']+\.css(?:[?#].*)?$/i

function appendAttributes(tag: string, attributes: string): string {
  return tag.replace(/\s*\/?>(?:\s*)$/, ` ${attributes}>`)
}

function replaceStylesheetRel(tag: string, rel: string): string {
  return tag.replace(STYLESHEET_REL_RE, (_match, quote: string) => `rel=${quote}${rel}${quote}`)
}

function asyncEntryStylesheetTags(stylesheet: string): string {
  const preload = appendAttributes(
    replaceStylesheetRel(stylesheet, 'preload'),
    'as="style" data-home-entry-css="preload"',
  )
  const asyncStylesheet = appendAttributes(
    stylesheet,
    'media="print" onload="this.onload=null;this.media=\'all\'" data-home-entry-css="async"',
  )
  const fallback = appendAttributes(stylesheet, 'data-home-entry-css="fallback"')

  return `${preload}${asyncStylesheet}<noscript>${fallback}</noscript>`
}

function rewriteEntryStylesheetLinks(headChunk: string): string {
  return headChunk.replace(LINK_TAG_RE, (tag) => {
    if (HOME_ENTRY_MARKER_RE.test(tag) || !STYLESHEET_REL_RE.test(tag)) {
      return tag
    }

    const href = tag.match(HREF_RE)?.[2]
    if (!href || !ENTRY_STYLESHEET_RE.test(href)) {
      return tag
    }

    return asyncEntryStylesheetTags(tag)
  })
}

/**
 * Defers the global entry stylesheet only for the exact home pathname.
 *
 * Nuxt's generated head is an array of HTML chunks. Keeping the route gate in
 * this pure function makes the safety contract testable without a production
 * build or environment files.
 */
export function rewriteHomeEntryStylesheets(pathname: string, head: string[]): string[] {
  if (pathname !== '/') {
    return head
  }

  return head.map(rewriteEntryStylesheetLinks)
}
