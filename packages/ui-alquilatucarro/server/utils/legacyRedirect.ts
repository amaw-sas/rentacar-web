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

const OLD_MANIZALES_GUIDE = '/blog/alquiler-de-carros-en-manizales-guia-2026'

/** Return a canonical target for the exact legacy paths reported by GSC. */
export function getLegacyRedirectTarget(rawPath: string, method: string): string | undefined {
  if (method !== 'GET' && method !== 'HEAD') return

  const queryIndex = rawPath.indexOf('?')
  const encodedPathname = queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : rawPath.slice(queryIndex)

  let pathname: string
  try {
    pathname = decodeURI(encodedPathname).normalize('NFC')
  } catch {
    return
  }

  if (pathname === '/ibagué') return `/ibague${search}`
  if (pathname === OLD_MANIZALES_GUIDE) return `/blog${search}`

  const citySearchMatch = pathname.match(/^\/([^/]+)\/buscar-vehiculos$/)
  const city = citySearchMatch?.[1]
  if (!city || !CITY_SLUGS.has(city)) return

  return `/${city}${search}`
}
