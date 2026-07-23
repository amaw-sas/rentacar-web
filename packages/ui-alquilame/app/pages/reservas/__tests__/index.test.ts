/**
 * F3 step02 — /reservas page (issue #112, alquilame only) + SCEN-003.
 *
 * Static-source assertions encoding the observable /reservas contract (full
 * runtime/visual check deferred to the F3 preview verification):
 *   - SCEN-F3-01: /reservas renders a red brand hero with the <Searcher> engine
 *     prominent.
 *   - Gradient guard (F0/F1 lesson): the hero MUST use the v4 bg-linear-to-*
 *     utility from the hero-from/hero-to @theme tokens with
 *     [--ctx-text-primary:#fff], NEVER the broken v3 bg-gradient-to-* alias.
 *   - #109 CLS guard: the Searcher is wrapped in <ClientOnly> with a fixed-height
 *     <PlaceholdersSearcher> fallback, and no Date/today() is baked into the
 *     SSR/ISR markup.
 *   - SCEN-F3-08: /reservas does NOT inject the city Product/FAQPage schemas.
 *   - F1 trust sections (HowItWorks/Requirements/Stats/Contact) are reused.
 *
 * SCEN-003 (behavior change — search stays on /reservas): the page is no longer
 * a pure search page that navigates away. It now drives the search FROM the
 * query string (useSearchByQueryParams), renders availability results IN-PLACE
 * (#seleccion-categorias / CategorySelectionSection), gates the generic trust
 * marketing on the query presence, and emits robots:noindex,follow on a results
 * query (clean /reservas stays indexable). The "navigation to buscar-vehiculos
 * via city-derivation" framing of the old contract is intentionally replaced.
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

  it('keeps the headline token-free with Plus Jakarta and explicit hero typography', () => {
    expect(page).toMatch(
      /<h1 class="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white leading-\[1\.1\]">/,
    )
    expect(page).not.toMatch(/<h1[^>]*\bheading-hero\b/)
  })

  it('renders the quote-and-book headline', () => {
    expect(page).toMatch(/Cotiza y Reserva/)
    expect(page).not.toMatch(/Cotiza y Reserva aquí/)
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

describe('SCEN-003 — /reservas drives search from the query string', () => {
  it('calls the query-param search driver (useSearchByQueryParams), not the route-param one', () => {
    expect(page).toMatch(/useSearchByQueryParams\(\)/)
    expect(page).not.toMatch(/useSearchByRouteParams\(/)
  })

  it('mounts the results block (#seleccion-categorias → CategorySelectionSection)', () => {
    expect(page).toMatch(/id="seleccion-categorias"/)
    expect(page).toMatch(/<CategorySelectionSection\b/)
  })

  it('gates the results block on an active search (resultsActive from useStoreSearchData)', () => {
    expect(page).toMatch(/v-if="resultsActive"/)
    expect(page).toMatch(/useStoreSearchData\(\)/)
  })
})

describe('SCEN-003 — trust marketing hides on a results query (SSR-stable gate)', () => {
  // Gate on route.query.lugar_recogida (SSR-available, so no flash/CLS), mirroring
  // CityPage's mode gate. HomeContact stays rendered (CTA back to the searcher).
  it('derives a results-query flag from route.query.lugar_recogida (SSR-stable)', () => {
    expect(page).toMatch(/route\.query\.lugar_recogida/)
  })

  it('gates HomeHowItWorks / HomeRequirements / HomeStats with v-if (hidden on a results query)', () => {
    expect(page).toMatch(/<HomeHowItWorks\b[^>]*v-if=/)
    expect(page).toMatch(/<HomeRequirements\b[^>]*v-if=/)
    expect(page).toMatch(/<HomeStats\b[^>]*v-if=/)
  })

  it('keeps HomeContact unconditionally rendered (no v-if gate)', () => {
    expect(page).toMatch(/<HomeContact\b(?:(?!v-if)[^>])*reserve-anchor/)
  })
})

describe('SCEN-003 — robots noindex,follow only on a results query', () => {
  it('emits noindex, follow when a results query is present', () => {
    expect(page).toMatch(/noindex,\s*follow/)
  })

  it('makes the robots value conditional on the query presence (computed/ternary on route.query)', () => {
    // The noindex must NOT be unconditional — clean /reservas stays indexable.
    expect(page).toMatch(/hasResultsQuery\.value\s*\?\s*['"]noindex, follow['"]\s*:\s*undefined/)
  })

  it('sets a matching HTTP robots header only for the SSR results state', () => {
    expect(page).toMatch(/useResponseHeader\(['"]X-Robots-Tag['"]\)/)
    expect(page).toMatch(/import\.meta\.server\s*&&\s*hasResultsQuery\.value/)
    expect(page).toMatch(/robotsResponseHeader\.value\s*=\s*['"]noindex, follow['"]/)
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
