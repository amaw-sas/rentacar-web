/**
 * What a city route should throw when its slug lookup fails.
 *
 * 404 requires a POPULATED catalog: only then does "not among the cities" mean
 * the URL is wrong. With an empty catalog the same lookup failure means the
 * data has not arrived (or a refresh raced the read), and answering
 * "Página no encontrada" for a valid URL is the phantom-404 users and crawlers
 * saw in production (2026-09-30). That state answers 503 instead: honest,
 * retryable, and never de-indexes a real page.
 */
export interface CityLookupError {
  statusCode: 404 | 503
  statusMessage: string
  fatal: true
}

export function cityLookupError(cityFound: boolean, knownCityCount: number): CityLookupError | null {
  if (cityFound) return null
  if (knownCityCount > 0) {
    return { statusCode: 404, statusMessage: 'Ciudad no encontrada', fatal: true }
  }
  return {
    statusCode: 503,
    statusMessage: 'No fue posible cargar las ciudades disponibles',
    fatal: true,
  }
}
