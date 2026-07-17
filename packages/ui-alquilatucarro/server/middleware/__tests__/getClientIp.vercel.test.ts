import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

/**
 * SCEN-322-S05 — blog rate-limit IP uses x-forwarded-for on Vercel (3 brands).
 */
const packagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const

describe('SCEN-322-S05 — getClientIp uses xForwardedFor', () => {
  for (const brand of BRANDS) {
    it(`${brand} blog-api-auth trusts X-Forwarded-For via getRequestIP`, () => {
      const src = readFileSync(
        resolve(packagesDir, brand, 'server/middleware/blog-api-auth.ts'),
        'utf8',
      )
      expect(src).toMatch(/getRequestIP\(\s*event\s*,\s*\{\s*xForwardedFor:\s*true\s*\}\s*\)/)
      // Legacy GCP-only private-range gate must be gone.
      expect(src).not.toMatch(/isBehindTrustedProxy/)
    })
  }
})
