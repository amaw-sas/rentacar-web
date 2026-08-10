import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { canBootNitro } from '../../logic/tests/nitro-test-capability'
import { startEmptySupabaseStub } from '../../logic/tests/empty-supabase-stub'

const nitroAvailable = await canBootNitro()
const supabaseStub = nitroAvailable ? await startEmptySupabaseStub() : undefined

afterAll(async () => supabaseStub?.close())

if (!nitroAvailable) {
  console.warn(
    '[seo-index-signals.http] skipped locally: @oxc-parser/binding-darwin-arm64 is unavailable',
  )
}

describe.skipIf(!nitroAvailable)('alquilatucarro Nitro index signals', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    browser: false,
    nuxtConfig: {
      sourcemap: { client: false, server: false },
      vite: { build: { sourcemap: false } },
      nitro: {
        sourcemap: false,
        prerender: { routes: [], crawlLinks: false, failOnError: false },
      },
      runtimeConfig: {
        supabaseUrl: supabaseStub?.url,
        supabaseAnonKey: 'nitro-http-test',
      },
      site: { indexable: true },
    },
    setupTimeout: 300_000,
    serverStartTimeout: 120_000,
    teardownTimeout: 60_000,
  })

  it('returns the final 301 from /bogota/ to /bogota', async () => {
    const response = await fetch('/bogota/', { redirect: 'manual' })

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('/bogota')
  })

  it('generates a sitemap with the /gana legal pages and without noindex routes', async () => {
    const response = await fetch('/sitemap.xml')
    const xml = await response.text()
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    expect(response.status).toBe(200)
    expect(locations).toContain('https://alquilatucarro.com/gana/terminos-condiciones')
    expect(locations).toContain('https://alquilatucarro.com/gana/politicas-privacidad')

    expect(
      locations.some((location) => /^\/(?:chat|tiktok)(?:\/|$)/.test(new URL(location).pathname)),
    ).toBe(false)
  })

  it('emits Content-Signal preferences in robots.txt (isitagentready bot-aware)', async () => {
    const response = await fetch('/robots.txt')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toMatch(/Content-Signal:\s*.*search=yes/i)
    expect(body).toMatch(/Content-Signal:\s*.*ai-input=yes/i)
    expect(body).toMatch(/Content-Signal:\s*.*ai-train=yes/i)
  })

  it('emits agent discovery Link headers on the homepage', async () => {
    const response = await fetch('/')
    const link = response.headers.get('link') ?? ''

    expect(response.status).toBe(200)
    expect(link).toMatch(/<\/llms\.txt>/i)
    expect(link).toMatch(/rel=["']?describedby["']?/i)
    expect(link).toMatch(/<\/sitemap\.xml>/i)
    expect(link).toMatch(/rel=["']?sitemap["']?/i)
    expect(link).toMatch(/<\/robots\.txt>/i)
    expect(link).toMatch(/rel=["']?robots["']?/i)
    expect(link).toMatch(/api-catalog/i)
  })

  it('resolves agent discovery Link targets with GET and HEAD (200)', async () => {
    // nuxt-llms only registered GET; we ship llms.txt.head so HEAD is 200 too.
    for (const path of ['/llms.txt', '/sitemap.xml', '/robots.txt'] as const) {
      const head = await fetch(path, { method: 'HEAD' })
      const get = await fetch(path)

      expect(head.status, `HEAD ${path}`).toBe(200)
      expect(get.status, `GET ${path}`).toBe(200)
    }

    const llmsHead = await fetch('/llms.txt', { method: 'HEAD' })
    const llmsGet = await fetch('/llms.txt')
    const llmsType = llmsGet.headers.get('content-type') ?? ''

    expect(llmsType).toMatch(/text\/plain/i)
    // HEAD should advertise the same media type agents expect from describedby.
    expect(llmsHead.headers.get('content-type') ?? '').toMatch(/text\/plain/i)
    // HEAD must not return a body (fetch still exposes headers only).
    expect(await llmsHead.text()).toBe('')
    expect((await llmsGet.text()).length).toBeGreaterThan(0)
  })

  it('keeps agent discovery Link header on routes with more-specific routeRules', async () => {
    // Nitro defu-merges /** headers into more specific rules. Avoid city landings
    // here: without rentacar-data they 404 ("Ciudad no encontrada") in this stub.
    // /gana = prerendered content page; /chat = noindex + extra x-robots-tag headers.
    for (const path of ['/gana', '/chat'] as const) {
      const response = await fetch(path)
      const link = response.headers.get('link') ?? ''

      expect(response.status, path).toBe(200)
      expect(link, path).toMatch(/<\/llms\.txt>/i)
      expect(link, path).toMatch(/<\/sitemap\.xml>/i)
      expect(link, path).toMatch(/<\/robots\.txt>/i)
    }
  })

  it('negotiates markdown for agents on the homepage (Accept: text/markdown)', async () => {
    const response = await fetch('/', {
      headers: { Accept: 'text/markdown' },
    })
    const body = await response.text()
    const type = response.headers.get('content-type') ?? ''

    expect(response.status).toBe(200)
    expect(type).toMatch(/text\/markdown/i)
    expect(body).toMatch(/^#\s+/m)
    expect(response.headers.get('x-markdown-tokens')).toMatch(/^\d+$/)
    // Default HTML still available without Accept override
    const html = await fetch('/')
    expect(html.headers.get('content-type') ?? '').toMatch(/text\/html/i)
  })

  it('serves RFC 9727 api-catalog and OpenAPI for public read APIs', async () => {
    const catalog = await fetch('/.well-known/api-catalog', {
      headers: { Accept: 'application/linkset+json, application/json' },
    })
    const catalogBody = await catalog.json()
    const catalogType = catalog.headers.get('content-type') ?? ''

    expect(catalog.status).toBe(200)
    expect(catalogType).toMatch(/linkset\+json|application\/json/i)
    expect(Array.isArray(catalogBody.linkset)).toBe(true)
    expect(catalogBody.linkset.length).toBeGreaterThan(0)
    expect(JSON.stringify(catalogBody)).toMatch(/rentacar-data|openapi/i)

    const openapi = await fetch('/openapi.json')
    const spec = await openapi.json()
    expect(openapi.status).toBe(200)
    expect(spec.openapi).toMatch(/^3\./)
    expect(spec.paths['/api/rentacar-data']).toBeTruthy()
  })

  it('publishes agent skills discovery index with digests', async () => {
    const index = await fetch('/.well-known/agent-skills/index.json')
    const body = await index.json()

    expect(index.status).toBe(200)
    expect(body.$schema).toContain('agentskills.io/discovery')
    expect(Array.isArray(body.skills)).toBe(true)
    expect(body.skills.length).toBeGreaterThanOrEqual(1)

    for (const skill of body.skills) {
      expect(skill.name).toBeTruthy()
      expect(skill.type).toBe('skill-md')
      expect(skill.digest).toMatch(/^sha256:[a-f0-9]{64}$/)
      const skillRes = await fetch(skill.url)
      expect(skillRes.status, skill.url).toBe(200)
      const text = await skillRes.text()
      expect(text.length).toBeGreaterThan(50)
    }
  })
})

