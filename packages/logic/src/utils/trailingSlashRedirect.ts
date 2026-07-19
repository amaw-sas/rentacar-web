const CITY_SLUGS = new Set([
  'armenia',
  'barranquilla',
  'bogota',
  'bucaramanga',
  'cali',
  'cartagena',
  'cucuta',
  'floridablanca',
  'ibague',
  'manizales',
  'medellin',
  'monteria',
  'neiva',
  'palmira',
  'pereira',
  'santa-marta',
  'soledad',
  'valledupar',
  'villavicencio',
])

const SINGLE_PAGE_CONTENT_ROOTS = new Set([
  'chat',
  'politica-privacidad',
  'terminos-condiciones',
])

const ALQUILATUCARRO_CONTENT_ROOTS = new Set(['tarifas', 'tiktok'])
const NESTED_CONTENT_ROOTS = new Set(['blog', 'gana'])

export type ContentBrand = 'alquilatucarro' | 'alquilame' | 'alquicarros'

function isContentPath(pathname: string, brand: ContentBrand): boolean {
  const segments = pathname.split('/').filter(Boolean)
  const [root] = segments

  if (!root) return false
  if (segments.length === 1 && CITY_SLUGS.has(root)) return true
  if (segments.length === 1 && SINGLE_PAGE_CONTENT_ROOTS.has(root)) return true
  if (segments.length === 1 && brand === 'alquilatucarro' && ALQUILATUCARRO_CONTENT_ROOTS.has(root)) {
    return true
  }

  return NESTED_CONTENT_ROOTS.has(root)
}

/**
 * Returns the canonical slashless target for public content routes.
 *
 * Transactional surfaces are intentionally absent from the allowlist: reservation
 * and API requests must never pass through a 301 that could alter their semantics.
 */
export function getSlashlessContentRedirect(
  rawPath: string,
  method: string,
  brand: ContentBrand,
): string | undefined {
  if (method !== 'GET' && method !== 'HEAD') return

  const queryIndex = rawPath.indexOf('?')
  const pathname = queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : rawPath.slice(queryIndex)

  if (pathname === '/' || !pathname.endsWith('/')) return

  const slashlessPath = pathname.replace(/\/+$/, '')
  if (!isContentPath(slashlessPath, brand)) return

  return `${slashlessPath}${search}`
}
