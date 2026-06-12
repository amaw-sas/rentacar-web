/**
 * F3 step02 — /reservas page (issue #112, alquilame only).
 *
 * Static-source assertions encoding the observable /reservas contract (full
 * runtime/visual check deferred to the F3 preview verification):
 *   - SCEN-F3-01: /reservas renders a red brand hero with the <Searcher> engine
 *     prominent, preserved untouched (same component → same data-testid, same
 *     navigation to buscar-vehiculos via the step01 city-derivation).
 *   - Gradient guard (F0/F1 lesson): the hero MUST use the v4 bg-linear-to-*
 *     utility from the hero-from/hero-to @theme tokens with
 *     [--ctx-text-primary:#fff] (so .heading-* renders white on red), NEVER the
 *     broken v3 bg-gradient-to-* alias.
 *   - #109 CLS guard: the Searcher is wrapped in <ClientOnly> with a fixed-height
 *     <PlaceholdersSearcher> fallback, and no Date/today() is baked into the
 *     SSR/ISR markup.
 *   - SCEN-F3-08: /reservas does NOT inject the city Product/FAQPage schemas.
 *   - F1 trust sections (HowItWorks/Requirements/Stats/Contact) are reused.
 *
 * This file asserts the page SOURCE (same style as city/__tests__/Hero.test.ts).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

const page = read('app/pages/reservas/index.vue')

describe('F3 — /reservas page hero + gradient', () => {
  it('renders the brand red gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(page).toMatch(/bg-linear-to-[a-z]/)
    expect(page).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('uses the hero-from / hero-to brand gradient tokens', () => {
    expect(page).toMatch(/from-hero-from\s+to-hero-to/)
  })

  it('sets [--ctx-text-primary:#fff] so .heading-* headings render white on red', () => {
    expect(page).toMatch(/\[--ctx-text-primary:#fff\]/)
  })

  it('adopts the .heading-hero utility (Plus Jakarta) for the headline h1', () => {
    expect(page).toMatch(/<h1[^>]*heading-hero/)
  })

  it('renders a search-focused headline', () => {
    expect(page).toMatch(/Reserva tu carro/)
  })
})

describe('F3 — /reservas Searcher engine + #109 CLS guard', () => {
  it('mounts the <Searcher> engine (same component → same data-testid)', () => {
    expect(page).toMatch(/<Searcher\b/)
  })

  it('imports the engine from the shared Searcher.vue component, not reimplemented', () => {
    expect(page).toMatch(/import\(['"][^'"]*components\/Searcher\.vue['"]\)/)
  })

  it('wraps the Searcher in <ClientOnly> with a fixed-height fallback (no hydration shift, #109)', () => {
    expect(page).toMatch(/<ClientOnly>/)
    expect(page).toMatch(/<PlaceholdersSearcher\b/)
    // Fixed-height wrappers reserve the engine footprint (CLS / hydration).
    expect(page).toMatch(/h-\[\d+px\]/)
  })

  it('reserves the engine footprint with explicit fixed heights (desktop + mobile)', () => {
    expect(page).toMatch(/h-\[410px\]/)
    expect(page).toMatch(/h-\[360px\]/)
  })

  it('does NOT bake Date/today() into the SSR/ISR markup (#109)', () => {
    expect(page).not.toMatch(/new Date\b/)
    expect(page).not.toMatch(/\btoday\(/)
  })

  it('keeps an in-page #hero anchor for the HomeContact reserve CTA', () => {
    expect(page).toMatch(/id="hero"/)
    expect(page).toMatch(/reserve-anchor="#hero"/)
  })
})

describe('F3 — /reservas reuses the F1 trust sections', () => {
  it('mounts HomeHowItWorks', () => {
    expect(page).toMatch(/<HomeHowItWorks\b/)
  })
  it('mounts HomeRequirements', () => {
    expect(page).toMatch(/<HomeRequirements\b/)
  })
  it('mounts HomeStats', () => {
    expect(page).toMatch(/<HomeStats\b/)
  })
  it('mounts HomeContact', () => {
    expect(page).toMatch(/<HomeContact\b/)
  })
})

describe('F3 — /reservas SEO without city schema (SCEN-F3-08)', () => {
  it('sets its own SEO (useBaseSEO + useSeoMeta + canonical)', () => {
    expect(page).toMatch(/useBaseSEO\(\)/)
    expect(page).toMatch(/useSeoMeta\(/)
    expect(page).toMatch(/rel:\s*['"]canonical['"]/)
  })

  it('does NOT emit the city Product/FAQPage schemas', () => {
    expect(page).not.toMatch(/useCityProductSchema/)
    expect(page).not.toMatch(/useCityFAQSchema/)
    expect(page).not.toMatch(/['"]FAQPage['"]/)
    expect(page).not.toMatch(/['"]Product['"]/)
  })
})
