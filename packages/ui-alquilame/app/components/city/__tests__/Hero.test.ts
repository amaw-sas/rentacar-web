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
 *     utility from the hero-from/hero-to @theme tokens with
 *     [--ctx-text-primary:#fff] (so .heading-* renders white on red), NEVER the
 *     broken v3 `bg-gradient-to-*` alias.
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

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

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
  it('renders the brand red gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(hero).toMatch(/bg-linear-to-[a-z]/)
    expect(hero).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('uses the hero-from / hero-to brand gradient tokens', () => {
    expect(hero).toMatch(/from-hero-from\s+to-hero-to/)
  })

  it('sets [--ctx-text-primary:#fff] so .heading-* headings render white on red', () => {
    expect(hero).toMatch(/\[--ctx-text-primary:#fff\]/)
  })

  it('adopts the .heading-hero utility (Plus Jakarta) for the headline', () => {
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

describe('Hero redesign — richer landing (vehicle card + trust chips + depth)', () => {
  // The landing hero used to be a lone CTA floating on flat red ("escueto").
  // The redesign mirrors the home hero's visual-card language: a vehicle photo
  // card beside the text, trust chips in the text column, and soft glow blobs
  // for depth — all WITHOUT touching the preserved invariants asserted above.
  it('renders a vehicle-photo visual card in the landing branch (fills the column)', () => {
    expect(LANDING_BRANCH).toMatch(/<NuxtImg\b/)
    expect(LANDING_BRANCH).toMatch(/\/images\/vehicles\//)
    // aspect-ratio box reserves the image footprint → no CLS (no fixed Date).
    expect(LANDING_BRANCH).toMatch(/aspect-\[\d+\/\d+\]/)
  })

  // SCEN-CLS-01: the aspect-[16/10] utility alone does NOT reserve the box before
  // paint — its rule lives in Nuxt's JS-injected stylesheet, not the inlined
  // critical CSS, and the <NuxtImg> is `absolute inset-0` (out of flow, zero
  // height contribution). Pre-CSS the card collapses to height 0, then jumps to
  // its 16:10 height when the late CSS lands → the whole hero grid shoves down
  // (measured CLS 0.839, Lighthouse mobile). An INLINE aspect-ratio on the card
  // container reserves the box in the SSR HTML regardless of stylesheet timing.
  // See docs/specs/city-hero-cls.
  it('reserves the image card with an inline aspect-ratio so it survives pre-CSS (CLS fix)', () => {
    expect(LANDING_BRANCH).toMatch(/style="[^"]*aspect-ratio:\s*16\s*\/\s*10/)
  })

  it('gives the vehicle image an alt bound to the city name (SEO/a11y)', () => {
    expect(LANDING_BRANCH).toMatch(/:alt="`[^`]*\$\{city\?\.name\}/)
  })

  it('prioritizes the landing hero image for LCP (eager + high fetchpriority)', () => {
    expect(LANDING_BRANCH).toMatch(/loading="eager"/)
    expect(LANDING_BRANCH).toMatch(/fetchpriority="high"/)
  })

  it('renders trust chips from a static (Date-free) list in the text column', () => {
    expect(hero).toMatch(/trustChips\s*=\s*\[/)
    expect(hero).toMatch(/v-for="chip in trustChips"/)
    expect(hero).toContain('Sin anticipos')
  })

  it('adds decorative background-glow blobs (inert, aria-hidden, non-interactive)', () => {
    expect(hero).toMatch(/blur-3xl/)
    expect(hero).toMatch(/pointer-events-none[^>]*absolute|absolute[^>]*pointer-events-none/)
  })

  it('keeps the vehicle card decorations inert (the scrim/pill add no controls)', () => {
    // Reassert the global no-controls invariant still holds after the redesign.
    expect(hero).not.toMatch(/<button\b/)
    expect(hero).not.toMatch(/<UButton\b/)
  })
})
