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
})
