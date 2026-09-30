import { describe, expect, it } from 'vitest'
import { cityLookupError } from '../cityLookupError'

/**
 * SCEN-005 (docs/specs/2026-09-30-hydration-stale-catalog-race): a city page
 * may only answer 404 when the catalog actually knows its cities and the slug
 * is not among them. An empty catalog on the client is a data-availability
 * failure — answering "Página no encontrada" for /bogota there is a lie that
 * production users saw (phantom 404 with a server 200).
 */
describe('cityLookupError', () => {
  it('answers nothing when the city was found', () => {
    expect(cityLookupError(true, 19)).toBeNull()
    expect(cityLookupError(true, 0)).toBeNull()
  })

  it('answers 404 for an unknown slug in a populated catalog', () => {
    const error = cityLookupError(false, 19)
    expect(error).toMatchObject({ statusCode: 404, fatal: true })
    expect(error?.statusMessage).toBe('Ciudad no encontrada')
  })

  it('never answers 404 against an empty catalog — that is a data failure', () => {
    const error = cityLookupError(false, 0)
    expect(error?.statusCode).toBe(503)
    expect(error?.fatal).toBe(true)
    expect(error?.statusMessage).toMatch(/no fue posible cargar/i)
  })
})
