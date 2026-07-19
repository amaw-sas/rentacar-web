import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

async function hasOxcParserBinding() {
  try {
    const require = createRequire(import.meta.url)
    const requireFromNuxt = createRequire(require.resolve('nuxt/package.json'))
    const oxcParserPath = requireFromNuxt.resolve('oxc-parser')
    await import(pathToFileURL(oxcParserPath).href)
    return true
  } catch {
    return false
  }
}

const shouldRunHttpTest = process.env.CI === 'true' || await hasOxcParserBinding()

if (!shouldRunHttpTest) {
  describe.skip('reservation confirmation HTTP semantics', () => {
    it('requires the local oxc parser binding (CI always enforces this suite)', () => {})
  })
} else {
  const { fetch, setup } = await import('@nuxt/test-utils/e2e')
  const fixtureRoot = fileURLToPath(
    new URL('./fixtures/reservation-confirmation', import.meta.url),
  )

  describe('reservation confirmation HTTP semantics', async () => {
    await setup({
      rootDir: fixtureRoot,
      browser: false,
      setupTimeout: 120_000,
    })

    it('returns 200 and the confirmation UI only for an authoritative match', async () => {
      const response = await fetch('/reservado/FOUND123')
      const body = await response.text()

      expect(response.status).toBe(200)
      expect(body).toContain('data-reservation-state="confirmed"')
      expect(body).toContain('Tu reserva está confirmada')
      expect(body).not.toContain('data-reservation-state="unavailable"')
    })

    it('returns fatal 404 for an authoritative miss', async () => {
      const response = await fetch('/reservado/MISSING123')
      const body = await response.text()

      expect(response.status).toBe(404)
      expect(body).not.toContain('data-reservation-state="confirmed"')
      expect(body).not.toContain('Tu reserva está confirmada')
    })

    it('returns temporary 503 with retry metadata and neutral noindex content', async () => {
      const response = await fetch('/reservado/UNKNOWN123')
      const body = await response.text()

      expect(response.status).toBe(503)
      expect(response.headers.get('retry-after')).toBe('300')
      expect(body).toContain('data-reservation-state="unavailable"')
      expect(body).toContain('Estamos verificando tu reserva')
      expect(body).toContain('Intenta en unos minutos.')
      expect(body).toContain('noindex, nofollow')
      expect(body).not.toContain('data-reservation-state="confirmed"')
      expect(body).not.toContain('Tu reserva está confirmada')
    })
  })
}
