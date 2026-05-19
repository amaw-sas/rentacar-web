import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// __tests__ -> server/utils -> server -> ui-alquilatucarro -> packages
const here = dirname(fileURLToPath(import.meta.url))
const packagesDir = resolve(here, '../../../..')

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const

const EXPECTED_IMAGES = {
  minimumCacheTTL: 2678400,
  qualities: [80],
  formats: ['image/webp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$',
    },
  ],
}

describe('SCEN-005: each brand vercel.json declares the images allowlist', () => {
  for (const brand of BRANDS) {
    it(`${brand}/vercel.json images deep-equals the approved allowlist`, () => {
      const path = resolve(packagesDir, brand, 'vercel.json')
      const json = JSON.parse(readFileSync(path, 'utf-8'))
      expect(json.images).toEqual(EXPECTED_IMAGES)
    })

    it(`${brand} hostname regex matches a blob host and rejects evil.com`, () => {
      const path = resolve(packagesDir, brand, 'vercel.json')
      const json = JSON.parse(readFileSync(path, 'utf-8'))
      const re = new RegExp(json.images.remotePatterns[0].hostname)
      expect(re.test('abc123.public.blob.vercel-storage.com')).toBe(true)
      expect(re.test('evil.com')).toBe(false)
    })
  }
})

describe('SCEN-006: each brand nuxt.config restricts the Vercel optimizer to webp', () => {
  for (const brand of BRANDS) {
    it(`${brand}/nuxt.config.ts declares image.vercel.formats webp-only`, () => {
      const path = resolve(packagesDir, brand, 'nuxt.config.ts')
      const src = readFileSync(path, 'utf-8')
      expect(src).toMatch(/vercel:\s*\{\s*formats:\s*\[\s*['"]image\/webp['"]\s*\]\s*\}/)
    })
  }
})
