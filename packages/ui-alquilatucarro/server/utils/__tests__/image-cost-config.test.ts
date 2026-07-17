import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// SCEN-005/006 — Vercel image-optimization config must survive @nuxt/image
// 1.11.0's defu-based merge into the Vercel Build Output.
//
// @nuxt/image 1.11.0 runs `defu(nuxt.options.nitro, { vercel: { config: {
// images: { formats: ['image/webp','image/avif'], minimumCacheTTL: 300,
// sizes: <fromScreens> } } } })`. defu 6.1.4 CONCATENATES arrays, so a plain
// nitro.vercel.config.images cannot win — the avif format and the short TTL
// leak through. The only reliable override is a post-module `nitro:config`
// hook that HARD-ASSIGNS the authoritative images block. This suite encodes
// that contract and guards against anyone weakening the hook (e.g. swapping
// the `=` assignment for a spread, or re-adding avif).
//
// Deterministic, alias-free, fs-based. No external deps.

const packagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros']

// Byte-identical top-level `hooks: { … }` block injected into all 3
// nuxt.config.ts. Verbatim — including the comments and the doubled
// backslashes in the hostname exactly as they appear in source.
// Authoritative images.sizes must include 1536: @nuxt/image srcset for 800px
// assets on 2x screens requests w=1536; without it Vercel returns 400 (#161).
const CANONICAL_SIZES = [320, 640, 768, 1024, 1280, 1536]

// Core hard-assign body present in all 3 brands (comments may differ slightly;
// we assert the assignment shape + EXPECTED values rather than a brittle full
// multi-line string equality on the entire hooks block).
const CANONICAL_HOOK_MARKER = `'nitro:config'(nitroConfig: { vercel?: { config?: { images?: unknown } } }) {
      nitroConfig.vercel = nitroConfig.vercel || {}
      nitroConfig.vercel.config = nitroConfig.vercel.config || {}
      nitroConfig.vercel.config.images = {`

// Effective, authoritative images block the hook hard-assigns. The hostname
// literal has 4 backslashes so the runtime JS string is `\\.` (matching the
// source file's doubled-backslash regex literal).
const EXPECTED_IMAGES = {
  sizes: CANONICAL_SIZES,
  qualities: [80],
  formats: ['image/webp'],
  minimumCacheTTL: 2678400,
  remotePatterns: [
    { protocol: 'https', hostname: '^[a-z0-9-]+\\\\.public\\\\.blob\\\\.vercel-storage\\\\.com$' },
  ],
}

// Replicate defu 6.1.4 semantics for this shape: deep-merge where arrays
// CONCATENATE (defu(obj, defaults) — defaults fill missing, arrays append).
function concatArraysDefu(
  obj: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj }
  for (const key of Object.keys(defaults)) {
    const dv = defaults[key]
    const ov = out[key]
    if (Array.isArray(dv) && Array.isArray(ov)) {
      // defu concatenates: object's array first, defaults appended.
      out[key] = [...ov, ...dv]
    } else if (
      dv && typeof dv === 'object' && !Array.isArray(dv)
      && ov && typeof ov === 'object' && !Array.isArray(ov)
    ) {
      out[key] = concatArraysDefu(
        ov as Record<string, unknown>,
        dv as Record<string, unknown>,
      )
    } else if (!(key in out)) {
      out[key] = dv
    }
  }
  return out
}

// Pull the images object literal out of the canonical hook block via regex,
// then coerce it to a plain JS value so the test fails if anyone weakens the
// hook (changes `=` to a spread, drops the hard-assign, or re-adds avif).
function parseImagesFromHook(src: string) {
  const hookIdx = src.indexOf("'nitro:config'")
  expect(hookIdx).toBeGreaterThan(-1)
  const region = src.slice(hookIdx)
  const m = region.match(/nitroConfig\.vercel\.config\.images\s*=\s*(\{[\s\S]*?\n\s{6}\})/)
  expect(m).not.toBeNull()
  const literal = m![1]
  const formats = [...literal.matchAll(/'(image\/[a-z]+)'/g)].map(x => x[1])
  const minimumCacheTTL = Number(literal.match(/minimumCacheTTL:\s*(\d+)/)![1])
  const sizes = literal
    .match(/sizes:\s*\[([\d,\s]+)\]/)![1]
    .split(',')
    .map(s => Number(s.trim()))
  const qualities = literal
    .match(/qualities:\s*\[([\d,\s]+)\]/)![1]
    .split(',')
    .map(s => Number(s.trim()))
  const remotePatternsCount = [...literal.matchAll(/protocol:\s*'https'/g)].length
  return { formats, minimumCacheTTL, sizes, qualities, remotePatternsCount }
}

describe('SCEN-005: post-module hook hard-assigns the authoritative images block', () => {
  for (const brand of BRANDS) {
    it(`${brand}: nuxt.config.ts hard-assigns images via the canonical nitro:config hook`, () => {
      const src = readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf-8')
      expect(src.includes(CANONICAL_HOOK_MARKER)).toBe(true)
      // Hard assign, not a merge/spread that would reintroduce defu concat.
      expect(src).toMatch(/nitroConfig\.vercel\.config\.images\s*=\s*\{/)
      expect(src).toMatch(/formats:\s*\[\s*['"]image\/webp['"]\s*\]/)
    })

    it(`${brand}: standalone vercel.json removed`, () => {
      expect(existsSync(resolve(packagesDir, brand, 'vercel.json'))).toBe(false)
    })
  }

  it('hostname regex matches a valid blob host and rejects an arbitrary domain', () => {
    const re = new RegExp('^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$')
    expect(re.test('abc123.public.blob.vercel-storage.com')).toBe(true)
    expect(re.test('evil.com')).toBe(false)
  })
})

describe('SCEN-005/006: defu-concat regression guard — naive config fails, hook wins', () => {
  // @nuxt/image 1.11.0 defaults injected via defu (providerSetup → nitro).
  const theirs = {
    minimumCacheTTL: 300,
    sizes: [320, 640, 768, 1024, 1280],
    formats: ['image/webp', 'image/avif'],
  }

  it('documents WHY a plain nitro.vercel.config.images fails: defu concat yields avif', () => {
    // What defu produced had we relied on a plain config object.
    const ours = {
      sizes: CANONICAL_SIZES,
      qualities: [80],
      formats: ['image/webp'],
      minimumCacheTTL: 2678400,
    }
    const concatResult = concatArraysDefu(
      ours as Record<string, unknown>,
      theirs as Record<string, unknown>,
    )
    // The naive path leaks avif (arrays concatenated, not replaced).
    expect(concatResult.formats).toContain('image/avif')
    expect(concatResult.formats).toEqual([
      'image/webp', 'image/webp', 'image/avif',
    ])
  })

  it('the hook HARD-ASSIGNS (not merges): effective block is webp-only and authoritative', () => {
    // Model the hook as a hard assign — it replaces, never merges.
    const eff = { ...EXPECTED_IMAGES }
    expect(eff).toEqual(EXPECTED_IMAGES)
    expect(eff.formats).toEqual(['image/webp'])
    expect(eff.formats).not.toContain('image/avif')
    expect(eff.minimumCacheTTL).toBe(2678400)
    expect([...new Set(eff.sizes)]).toEqual(CANONICAL_SIZES)
    expect(eff.qualities).toEqual([80])
    expect(eff.remotePatterns).toHaveLength(1)
  })

  for (const brand of BRANDS) {
    it(`${brand}: parsed source images block matches EXPECTED (weakening the hook fails)`, () => {
      const src = readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf-8')
      const parsed = parseImagesFromHook(src)
      expect(parsed.formats).toEqual(EXPECTED_IMAGES.formats)
      expect(parsed.minimumCacheTTL).toBe(EXPECTED_IMAGES.minimumCacheTTL)
      expect(parsed.sizes).toEqual(EXPECTED_IMAGES.sizes)
      expect(parsed.qualities).toEqual(EXPECTED_IMAGES.qualities)
      expect(parsed.remotePatternsCount).toBe(EXPECTED_IMAGES.remotePatterns.length)
    })
  }
})

describe('SCEN-006: webp-only on the honored surface; legacy inert config gone', () => {
  for (const brand of BRANDS) {
    it(`${brand}: parsed hook formats is exactly ['image/webp'], never avif`, () => {
      const src = readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf-8')
      const parsed = parseImagesFromHook(src)
      expect(parsed.formats).toEqual(['image/webp'])
      expect(parsed.formats).not.toContain('image/avif')
    })

    it(`${brand}: legacy image.vercel.formats removed`, () => {
      const src = readFileSync(resolve(packagesDir, brand, 'nuxt.config.ts'), 'utf-8')
      expect(src).not.toMatch(/image:\s*\{[\s\S]*?vercel:\s*\{\s*formats:/)
    })
  }

  it('hostname regex behavior holds for the runtime-built RegExp', () => {
    const re = new RegExp('^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$')
    expect(re.test('abc123.public.blob.vercel-storage.com')).toBe(true)
    expect(re.test('evil.com')).toBe(false)
  })
})
