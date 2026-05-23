/**
 * Deploy resilience (SCEN-PR-1): each brand's `nitro.prerender` must widen the
 * retry window so a transient build-time blip is retried instead of hard-
 * aborting the deploy. Default `retry:3` / `retryDelay:500ms` (~1.5s window) is
 * too short for a multi-second Supabase/network blip during prerender; the
 * serial prerender + fail-loud plugin (#2) turns any such hiccup into a
 * deployment ERROR. See docs/specs/2026-05-23-prerender-retry-resilience/.
 *
 * fs-based + deterministic (matches nuxt-config-hygiene.test.ts pattern).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros'] as const
const MIN_RETRY = 5
const MIN_RETRY_DELAY_MS = 3000

function readBrandConfig(brand: string): string {
  return readFileSync(join(__dirname, '..', '..', `ui-${brand}`, 'nuxt.config.ts'), 'utf-8')
}

// The prerender block sits near `prerender:`; grab a generous window after it.
// retry/retryDelay are authored at the top of the block (before the long
// routes[] array), well within this slice.
function prerenderBlock(content: string): string {
  const idx = content.indexOf('prerender:')
  if (idx === -1) return ''
  return content.slice(idx, idx + 1500)
}

function numIn(re: RegExp, block: string): number | null {
  const m = block.match(re)
  return m ? Number(m[1]) : null
}

const RETRY_RE = /\bretry:\s*(\d+)/
const RETRY_DELAY_RE = /\bretryDelay:\s*(\d+)/

describe('nitro.prerender retry resilience (SCEN-PR-1)', () => {
  for (const brand of BRANDS) {
    it(`${brand}: prerender.retry >= ${MIN_RETRY} and retryDelay >= ${MIN_RETRY_DELAY_MS}ms`, () => {
      const block = prerenderBlock(readBrandConfig(brand))
      expect(block, `${brand} has a prerender block`).not.toBe('')
      const retry = numIn(RETRY_RE, block)
      const retryDelay = numIn(RETRY_DELAY_RE, block)
      expect(retry, `${brand} prerender.retry is set`).not.toBeNull()
      expect(retryDelay, `${brand} prerender.retryDelay is set`).not.toBeNull()
      expect(retry as number).toBeGreaterThanOrEqual(MIN_RETRY)
      expect(retryDelay as number).toBeGreaterThanOrEqual(MIN_RETRY_DELAY_MS)
    })
  }

  it('retry/retryDelay are byte-identical across all 3 brands', () => {
    const vals = BRANDS.map((b) => {
      const block = prerenderBlock(readBrandConfig(b))
      return `${numIn(RETRY_RE, block)}|${numIn(RETRY_DELAY_RE, block)}`
    })
    expect(new Set(vals).size, `per-brand values: ${vals.join('  ,  ')}`).toBe(1)
  })
})
