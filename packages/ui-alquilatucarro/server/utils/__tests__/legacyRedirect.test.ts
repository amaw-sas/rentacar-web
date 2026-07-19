import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLegacyRedirectTarget } from '../legacyRedirect'

const CITIES = [
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
]

describe('getLegacyRedirectTarget', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(['/ibagué', '/ibagu%C3%A9', '/ibagu%c3%a9'])(
    'canonicalizes the accented Ibagué path %s',
    (path) => {
      expect(getLegacyRedirectTarget(path, 'GET')).toBe('/ibague')
    },
  )

  it.each(CITIES)('redirects the bare %s search route to its city landing', (city) => {
    expect(getLegacyRedirectTarget(`/${city}/buscar-vehiculos`, 'GET')).toBe(`/${city}`)
  })

  it('falls back to the blog index because no current Manizales guide exists', () => {
    expect(
      getLegacyRedirectTarget('/blog/alquiler-de-carros-en-manizales-guia-2026', 'GET'),
    ).toBe('/blog')
  })

  it('preserves query strings on the canonical target', () => {
    expect(getLegacyRedirectTarget('/bogota/buscar-vehiculos?utm_source=gsc', 'GET')).toBe(
      '/bogota?utm_source=gsc',
    )
  })

  it('supports HEAD without redirecting methods whose semantics a 301 could change', () => {
    expect(getLegacyRedirectTarget('/ibagu%C3%A9', 'HEAD')).toBe('/ibague')
    expect(getLegacyRedirectTarget('/ibagu%C3%A9', 'POST')).toBeUndefined()
  })

  it.each([
    '/bogota',
    '/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto',
    '/ciudad-inexistente/buscar-vehiculos',
    '/blog/eje-cafetero-en-carro-guia-completa',
    '/ibague',
  ])('leaves non-legacy route %s alone', (path) => {
    expect(getLegacyRedirectTarget(path, 'GET')).toBeUndefined()
  })

  it('wires the helper to a permanent server redirect', async () => {
    const sendRedirect = vi.fn(() => 'redirected')
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('sendRedirect', sendRedirect)

    const { default: middleware } = await import('../../middleware/legacy-redirects')
    const result = await middleware({ path: '/ibagu%C3%A9', method: 'GET' } as never)

    expect(sendRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/ibagu%C3%A9', method: 'GET' }),
      '/ibague',
      301,
    )
    expect(result).toBe('redirected')
  })
})
