import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros'] as const

interface EdgeRoute {
  src: string
  methods: string[]
  headers: { Location: string }
  status: number
}

function readBrandFile(brand: string, relativePath: string): string {
  return readFileSync(join(__dirname, '..', '..', `ui-${brand}`, relativePath), 'utf-8')
}

function sitemapConfig(config: string): string {
  const start = config.indexOf('\n  sitemap: {')
  const end = config.indexOf('\n  robots:', start)
  return config.slice(start, end)
}

describe('brand index signals', () => {
  for (const brand of BRANDS) {
    it(`${brand}: submits /gana and excludes noindex chat from its sitemap`, () => {
      const sitemap = sitemapConfig(readBrandFile(brand, 'nuxt.config.ts'))

      expect(sitemap).toContain("{ loc: '/gana', changefreq: 'monthly', priority: 0.7 }")
      expect(sitemap).toMatch(/exclude: \[[^\]]*'\/chat'/)
    })

    it(`${brand}: sends noindex headers on non-indexable public pages`, () => {
      const config = readBrandFile(brand, 'nuxt.config.ts')

      for (const route of ['/chat', '/pendiente', '/sindisponibilidad', '/reservado/**']) {
        expect(config).toContain(
          `'${route}': { robots: 'noindex, nofollow', headers: { 'x-robots-tag': 'noindex, nofollow' } }`,
        )
      }
    })

    it(`${brand}: installs the scoped trailing-slash middleware`, () => {
      const middleware = readBrandFile(brand, 'server/middleware/trailing-slash.ts')

      expect(middleware).toContain('getSlashlessContentRedirect')
      expect(middleware).toContain(`event.method, '${brand}'`)
      expect(middleware).toContain('sendRedirect(event, target, 301)')
    })

    it(`${brand}: enforces the content redirects as 301s at the Vercel edge`, () => {
      const config = JSON.parse(readBrandFile(brand, 'vercel.json')) as {
        routes: EdgeRoute[]
      }
      const [contentRedirect] = config.routes

      expect(contentRedirect).toMatchObject({
        methods: ['GET', 'HEAD'],
        headers: { Location: '/$1' },
        status: 301,
      })
      expect(contentRedirect.src).toContain('bogota')
      expect(contentRedirect.src).toContain('blog(?:/.*)?')
      expect(contentRedirect.src).toContain('gana(?:/.*)?')
      expect(contentRedirect.src).not.toMatch(/reservas|api|_nuxt/)

      const edgePattern = new RegExp(contentRedirect.src)
      for (const path of ['/bogota/', '/blog/', '/blog/como-alquilar/', '/gana/', '/gana/legal/']) {
        expect(edgePattern.test(path)).toBe(true)
      }
      for (const path of [
        '/bogota',
        '/reservas/',
        '/api/reservations/',
        '/_nuxt/app.js/',
        '/reservado/ABC123/',
        '/bogota/buscar-vehiculos/',
      ]) {
        expect(edgePattern.test(path)).toBe(false)
      }

      if (brand === 'alquilatucarro') {
        expect(contentRedirect.src).toMatch(/tarifas|tiktok/)
      } else {
        expect(contentRedirect.src).not.toMatch(/tarifas|tiktok/)
      }
    })
  }

  it('alquilatucarro excludes /tiktok and sends its noindex header', () => {
    const config = readBrandFile('alquilatucarro', 'nuxt.config.ts')
    const sitemap = sitemapConfig(config)

    expect(sitemap).toMatch(/exclude: \[[^\]]*'\/tiktok'/)
    expect(config).toContain(
      "'/tiktok': { robots: 'noindex, nofollow', headers: { 'x-robots-tag': 'noindex, nofollow' } }",
    )

    const edgeConfig = JSON.parse(readBrandFile('alquilatucarro', 'vercel.json')) as {
      routes: EdgeRoute[]
    }
    expect(edgeConfig.routes[0].src).toContain('tarifas')
    expect(edgeConfig.routes[0].src).toContain('tiktok')
  })
})
