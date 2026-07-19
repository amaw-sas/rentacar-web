import { describe, expect, it } from 'vitest'
import { getSlashlessContentRedirect } from '../trailingSlashRedirect'

describe('getSlashlessContentRedirect', () => {
  it.each([
    ['/bogota/', '/bogota'],
    ['/bogota/?utm_source=gsc', '/bogota?utm_source=gsc'],
    ['/blog/', '/blog'],
    ['/blog/como-alquilar-un-carro/', '/blog/como-alquilar-un-carro'],
    ['/gana/', '/gana'],
    ['/gana/terminos-condiciones/', '/gana/terminos-condiciones'],
    ['/politica-privacidad/', '/politica-privacidad'],
  ])('redirects GET content route %s to %s', (path, expected) => {
    expect(getSlashlessContentRedirect(path, 'GET', 'alquilatucarro')).toBe(expected)
  })

  it('also canonicalizes content routes for HEAD requests', () => {
    expect(getSlashlessContentRedirect('/bogota/', 'HEAD', 'alquilatucarro')).toBe('/bogota')
  })

  it.each(['/tarifas/', '/tiktok/'])('redirects primary-brand-only content route %s', (path) => {
    expect(getSlashlessContentRedirect(path, 'GET', 'alquilatucarro')).toBe(path.slice(0, -1))
  })

  it.each(['alquilame', 'alquicarros'] as const)(
    'does not redirect missing primary-brand-only pages on %s',
    (brand) => {
      expect(getSlashlessContentRedirect('/tarifas/', 'GET', brand)).toBeUndefined()
      expect(getSlashlessContentRedirect('/tiktok/', 'GET', brand)).toBeUndefined()
    },
  )

  it.each(['alquilatucarro', 'alquilame', 'alquicarros'] as const)(
    'redirects shared content on %s',
    (brand) => {
      expect(getSlashlessContentRedirect('/bogota/', 'GET', brand)).toBe('/bogota')
      expect(getSlashlessContentRedirect('/blog/articulo/', 'GET', brand)).toBe('/blog/articulo')
    },
  )

  it.each([
    '/reservas/',
    '/reservas/?lugar_recogida=bogota-aeropuerto',
    '/reservas/lugar-recogida/bogota-aeropuerto/',
    '/api/reservations/availability/',
    '/_nuxt/app.js/',
    '/reservado/ABC123/',
    '/bogota/buscar-vehiculos/lugar-recogida/aabot/',
    '/ciudad-inexistente/',
  ])('does not redirect non-content route %s', (path) => {
    expect(getSlashlessContentRedirect(path, 'GET', 'alquilatucarro')).toBeUndefined()
  })

  it('does not redirect request methods whose semantics a 301 could change', () => {
    expect(getSlashlessContentRedirect('/bogota/', 'POST', 'alquilatucarro')).toBeUndefined()
  })

  it('ignores the root and already canonical content URLs', () => {
    expect(getSlashlessContentRedirect('/', 'GET', 'alquilatucarro')).toBeUndefined()
    expect(getSlashlessContentRedirect('/bogota', 'GET', 'alquilatucarro')).toBeUndefined()
  })
})
