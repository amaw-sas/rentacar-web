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

describe.skipIf(!nitroAvailable)('alquilame Nitro reservation index signals', async () => {
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

  it('keeps clean /reservas indexable over HTTP', async () => {
    const response = await fetch('/reservas')
    const header = response.headers.get('x-robots-tag')

    expect(response.status).toBe(200)
    expect(header).toContain('index, follow')
    expect(header).not.toContain('noindex')
  })

  it('marks query-driven /reservas results noindex,follow over HTTP', async () => {
    const response = await fetch('/reservas?lugar_recogida=bogota-aeropuerto')

    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow')
  })
})
