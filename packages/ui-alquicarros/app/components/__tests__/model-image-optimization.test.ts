import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue #48 — model-image-optimization holdout (source-string idiom).
 * Scenarios: docs/specs/2026-05-27-model-image-optimization/scenarios/model-image-optimization.scenarios.md
 *
 * Post-search, CategoryCard → Carrusel.vue renders model images from an absolute
 * external Vercel Blob URL. @nuxt/image only optimizes external hosts listed in
 * image.domains; without the entry the raw ~412KB JPEG is served. These tests
 * lock the two static guarantees behind that fix.
 */

const BLOB_HOST = '9grznib0czdjtk77.public.blob.vercel-storage.com'

const nuxtConfig = readFileSync(
  fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
  'utf8',
)
const carrusel = readFileSync(
  fileURLToPath(new URL('../Carrusel.vue', import.meta.url)),
  'utf8',
)

describe('model-image-optimization — nuxt.config image.domains (SCEN-004)', () => {
  it('declares an image.domains array', () => {
    expect(nuxtConfig).toMatch(/image:\s*\{[\s\S]*?domains:\s*\[/)
  })

  it('whitelists the shared Blob host so external model images route through the optimizer', () => {
    // domains entry, not just the comment / remotePatterns hook
    expect(nuxtConfig).toMatch(
      new RegExp(`domains:\\s*\\[[^\\]]*['"]${BLOB_HOST.replace(/\./g, '\\.')}['"]`),
    )
  })
})

describe('model-image-optimization — Carrusel.vue model image (SCEN-002/003 + SCEN-005)', () => {
  it('declares responsive sizes in @nuxt/image breakpoint shorthand, not CSS media queries', () => {
    const match = carrusel.match(/sizes="([^"]*)"/)
    expect(match?.[1]).toBeTruthy()
    const sizes = match?.[1] ?? ''
    // @nuxt/image parses its own `screenKey:value` shorthand. CSS media-query
    // syntax (`(min-width: …)`) or calc() mis-parses → srcset collapses to a
    // single 320px variant and the LCP image upscales/blurs. Lock the shorthand.
    expect(sizes).not.toMatch(/\(min-width|\(max-width|calc\(/)
    expect(sizes).toMatch(/\bmd:\d+vw\b/)
    expect(sizes).toMatch(/\blg:\d+vw\b/)
  })

  it('keeps intrinsic width/height to avoid CLS', () => {
    expect(carrusel).toMatch(/width="800"/)
    expect(carrusel).toMatch(/height="480"/)
  })

  it('eager-loads only the priority first slide, lazy otherwise (LCP)', () => {
    // the slide index must be exposed so only the first slide can be eager
    expect(carrusel).toMatch(/v-slot="\{\s*item\s*,\s*index\s*\}"/)
    // conditional loading/fetchpriority gated on the priority prop AND first slide
    expect(carrusel).toMatch(
      /:loading="\(?\s*priority\s*&&\s*index\s*===\s*0\s*\)?\s*\?\s*'eager'\s*:\s*'lazy'"/,
    )
    expect(carrusel).toMatch(
      /:fetchpriority="\(?\s*priority\s*&&\s*index\s*===\s*0\s*\)?\s*\?\s*'high'\s*:\s*'auto'"/,
    )
  })
})
