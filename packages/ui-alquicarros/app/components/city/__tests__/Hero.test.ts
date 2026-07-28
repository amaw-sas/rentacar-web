/**
 * F2 step02 + F3 step04 — City Hero restyle & `mode` (issue #112).
 *
 * Static-source assertions encoding the observable city-hero contract (full
 * runtime/visual check deferred to the F3 preview verification):
 *   - SCEN-F2-01: the hero renders the brand red gradient and a city-targeted
 *     <h1>, with the Searcher engine preserved (same data-testid via the same
 *     <Searcher> component, same navigation to buscar-vehiculos) and the
 *     #searcher scroll target intact.
 *   - SCEN-F2-06: the #41 pin stays an INERT <span aria-hidden> (never a
 *     <button>), and no Date/today() is baked into the SSR/ISR markup (#109).
 *   - Gradient guard (F0/F1 lesson): the hero MUST use the v4 `bg-linear-to-*`
 *     utility from the hero-from/hero-to @theme tokens, NEVER the broken v3
 *     `bg-gradient-to-*` alias. Since issue #364 the section declares
 *     `.context-brand` (dark text on the orange) instead of forcing white.
 *
 * NOTE: this file began as a copy of the alquilame suite and its prose still
 * described a RED gradient and Plus Jakarta. alquicarros is orange and uses
 * Montserrat; the descriptions were corrected in #364 while replacing the
 * contrast guard. The assertions themselves were always brand-agnostic.
 *   - SCEN-F3-03 (city landing sin engine inline): F3 made the hero `mode`-aware.
 *     In `mode="results"` the engine + #109 guard are preserved IDENTICAL to F2
 *     (they live under the `v-if="mode === 'results'"` branch and stay in the
 *     source). In `mode="landing"` there is NO <Searcher> (zero pickup-location
 *     engine) — instead a "Reservar ahora" CTA navigates (SPA) to /reservas;
 *     the city h1, the #41 pin, and the empty #searcher anchor are conserved.
 *
 * This file asserts the component SOURCE: both branches are present in Hero.vue,
 * switched by the `mode` prop. The results-branch assertions therefore still
 * hold (the engine source is there), and the landing-branch assertions verify
 * the new CTA + the absence of the engine markup inside the v-else branch.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

const hero = read('app/components/city/Hero.vue')

// The engine column is gated behind `v-if="mode === 'results'"`; the CTA column
// is the `v-else`. We slice the source into the two branches so the landing
// assertions can prove the engine markup is absent from the landing branch (not
// merely absent from the file) and vice-versa.
const RESULTS_BRANCH = (() => {
  const m = hero.match(/v-if="mode === 'results'"[\s\S]*?(?=<!-- landing)/)
  return m ? m[0] : ''
})()
const LANDING_BRANCH = (() => {
  const m = hero.match(/<!-- landing[\s\S]*?<NuxtLink[\s\S]*?<\/NuxtLink>[\s\S]*?<\/div>/)
  return m ? m[0] : ''
})()

describe('F2/F3 — city/Hero.vue restyle (shared, both modes)', () => {
  it('renders the brand orange gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(hero).toMatch(/bg-linear-to-[a-z]/)
    expect(hero).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('uses the hero-from / hero-to brand gradient tokens', () => {
    expect(hero).toMatch(/from-hero-from\s+to-hero-to/)
  })

  // Issue #364. This assertion used to REQUIRE [--ctx-text-primary:#fff], which
  // is how a WCAG failure ended up frozen as an invariant: white on #ff9500
  // measures 2.20:1 against a 3:1 floor for large text. The inline override also
  // told the type system this was a dark surface, which it is not — that is
  // where the white came from in the first place.
  //
  // It is replaced, not deleted: the hero still needs a declared text context,
  // it is just the right one now.
  it('declares .context-brand so .heading-* resolves to --color-on-brand', () => {
    expect(hero).toMatch(/class="context-brand/)
    expect(hero).not.toMatch(/\[--ctx-text-primary:#fff\]/)
  })

  it('adopts the .heading-hero utility (Montserrat) for the headline', () => {
    expect(hero).toMatch(/heading-hero/)
  })

  it('renders a city-targeted <h1> bound to city.name (both modes)', () => {
    expect(hero).toMatch(/<h1[^>]*heading-hero/)
    expect(hero).toMatch(/Alquiler de carros en \{\{ city\?\.name \}\}/)
  })

  it('keeps the #searcher scroll target (UnableCategoryCard / reserveAnchor CTAs) in both modes', () => {
    // The empty #searcher anchor is rendered above the mode switch, so it exists
    // in landing AND results (harmless in landing — see SCEN-F3-03 design note).
    expect(hero).toMatch(/id="searcher"/)
  })

  it('preserves the #41 pin as an INERT <span aria-hidden> (never a <button>) in both modes', () => {
    // The copy-to-WhatsApp pin must stay a non-focusable, aria-hidden span that
    // carries the @click handler within the SAME opening tag (no `>` between
    // aria-hidden and @click). [^>] spans newlines, so multiline attrs are ok.
    expect(hero).toMatch(/<span[^>]*aria-hidden="true"[^>]*@click="copySearchToWhatsapp"[^>]*>/)
    expect(hero).toMatch(/copySearchToWhatsapp/)
    // No <button> may be reintroduced for the secret operator action.
    expect(hero).not.toMatch(/<button\b/)
    expect(hero).not.toMatch(/<UButton\b/)
  })

  it('does NOT bake Date/today() into the SSR/ISR markup (#109)', () => {
    expect(hero).not.toMatch(/new Date\b/)
    expect(hero).not.toMatch(/\btoday\(/)
  })

  it('declares a `mode` prop (landing | results) defaulting to results (fail-safe)', () => {
    expect(hero).toMatch(/mode\?:\s*'landing'\s*\|\s*'results'/)
    expect(hero).toMatch(/\{\s*mode:\s*'results'\s*\}/)
  })

  it('switches the engine column on mode via v-if="mode === \'results\'" / v-else', () => {
    expect(hero).toMatch(/v-if="mode === 'results'"/)
    expect(hero).toMatch(/v-else/)
  })
})

describe('F3 — mode="results" preserves the engine (identical to F2)', () => {
  it('slices a non-empty results branch from the source', () => {
    expect(RESULTS_BRANCH.length).toBeGreaterThan(0)
  })

  it('mounts <Searcher> (same component → same data-testid) under the results branch', () => {
    expect(RESULTS_BRANCH).toMatch(/<Searcher\b/)
  })

  it('imports the engine from the sibling Searcher.vue, not reimplemented', () => {
    // The async import is shared script-level, so assert it on the whole source.
    expect(hero).toMatch(/import\(['"]\.\.\/Searcher\.vue['"]\)/)
  })

  it('wraps the Searcher in <ClientOnly> with a fixed-height fallback (no hydration shift, #109)', () => {
    expect(RESULTS_BRANCH).toMatch(/<ClientOnly>/)
    expect(RESULTS_BRANCH).toMatch(/<PlaceholdersSearcher\b/)
    // Fixed-height wrappers reserve the engine footprint (CLS / hydration).
    expect(RESULTS_BRANCH).toMatch(/h-\[\d+px\]/)
  })

  it('reserves the engine footprint without aspect-ratio shift (CLS-safe fixed heights)', () => {
    // City hero reserves the Searcher box via fixed heights rather than an
    // image aspect-ratio; assert the footprint is explicitly reserved.
    expect(RESULTS_BRANCH).toMatch(/h-\[410px\]/)
    expect(RESULTS_BRANCH).toMatch(/h-\[360px\]/)
  })
})

describe('F3 — mode="landing" drops the engine for a /reservas CTA (SCEN-F3-03)', () => {
  it('slices a non-empty landing branch from the source', () => {
    expect(LANDING_BRANCH.length).toBeGreaterThan(0)
  })

  it('renders a "Reservar ahora" CTA navigating (SPA) to /reservas', () => {
    expect(LANDING_BRANCH).toMatch(/<NuxtLink\b[^>]*to="\/reservas"/)
    expect(LANDING_BRANCH).toMatch(/Reservar ahora/)
  })

  it('does NOT mount the Searcher engine in the landing branch (zero pickup-location engine)', () => {
    expect(LANDING_BRANCH).not.toMatch(/<Searcher\b/)
    expect(LANDING_BRANCH).not.toMatch(/<ClientOnly>/)
    expect(LANDING_BRANCH).not.toMatch(/<PlaceholdersSearcher\b/)
  })

  it('uses a plain SPA <NuxtLink> for the CTA, not a raw <a href> page reload', () => {
    expect(LANDING_BRANCH).not.toMatch(/<a\b/)
  })
})
