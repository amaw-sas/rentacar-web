import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

/**
 * SCEN-322-S04 — security headers present in all 3 brand nuxt configs.
 */
const packagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const

const REQUIRED = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Content-Security-Policy',
  'Strict-Transport-Security',
]

describe('SCEN-322-S04 — security headers on 3 brands', () => {
  for (const brand of BRANDS) {
    it(`${brand} declares baseline security headers on /**`, () => {
      const src = readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf8')
      expect(src).toMatch(/['"]\/\*\*['"]\s*:\s*\{[\s\S]*?headers\s*:/)
      for (const h of REQUIRED) {
        expect(src, `${brand} missing ${h}`).toContain(h)
      }
      expect(src).toMatch(/frame-ancestors\s+'self'/)
    })
  }
})
