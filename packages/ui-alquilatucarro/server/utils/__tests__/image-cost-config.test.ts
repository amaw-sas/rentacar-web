import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// __tests__ -> server/utils -> server -> ui-alquilatucarro -> packages
const here = dirname(fileURLToPath(import.meta.url))
const packagesDir = resolve(here, '../../../..')

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const

const EXPECTED_IMAGES = {
  sizes: [320, 640, 768, 1024, 1280],
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

// vercel.json schema (https://openapi.vercel.sh/vercel.json) images object:
// required = ['sizes']; additionalProperties:false over this known key set.
const IMAGES_REQUIRED = ['sizes'] as const
const IMAGES_KNOWN_KEYS = new Set([
  'sizes', 'domains', 'remotePatterns', 'localPatterns', 'qualities',
  'minimumCacheTTL', 'formats', 'dangerouslyAllowSVG',
  'contentSecurityPolicy', 'contentDispositionType',
])

// The widths @nuxt/image requests come solely from image.screens; sizes must
// mirror them or the optimizer 404s those widths.
function screenWidths(nuxtConfigSrc: string): number[] {
  const block = nuxtConfigSrc.match(/screens:\s*\{([^}]*)\}/)?.[1] ?? ''
  return [...block.matchAll(/:\s*(\d+)/g)].map((m) => Number(m[1])).sort((a, b) => a - b)
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

    it(`${brand}/vercel.json images conforms to the official vercel.json schema`, () => {
      const json = JSON.parse(readFileSync(resolve(packagesDir, brand, 'vercel.json'), 'utf-8'))
      const images = json.images
      // schema required: every key in IMAGES_REQUIRED must be present
      for (const key of IMAGES_REQUIRED) {
        expect(images, `images missing required property '${key}'`).toHaveProperty(key)
      }
      // schema additionalProperties:false — no unknown keys
      for (const key of Object.keys(images)) {
        expect(IMAGES_KNOWN_KEYS.has(key), `unknown images key '${key}'`).toBe(true)
      }
      // sizes: non-empty number array (schema: minItems 1, items number)
      expect(Array.isArray(images.sizes)).toBe(true)
      expect(images.sizes.length).toBeGreaterThanOrEqual(1)
      expect(images.sizes.every((n: unknown) => typeof n === 'number')).toBe(true)
      // sizes must mirror the widths @nuxt/image requests (image.screens)
      const screens = screenWidths(readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf-8'))
      expect([...images.sizes].sort((a: number, b: number) => a - b)).toEqual(screens)
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
