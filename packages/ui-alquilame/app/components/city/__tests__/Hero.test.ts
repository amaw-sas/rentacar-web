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
// The landing branch is now the shared visual component, not a photo card plus
// a link — slice from the `<!-- landing` note to the end of that element.
const LANDING_BRANCH = (() => {
  const m = hero.match(/<!-- landing[\s\S]*?<HomeHeroVisual[\s\S]*?\/>/)
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

  it('sizes the headline with the same explicit ramp as the home hero', () => {
    // `.heading-hero` is deliberately NOT used: its @apply lg:text-7xl +
    // leading-tight silently overrode the declared size and leading, the exact
    // bug fixed on the home hero. Spelling the ramp out keeps the markup honest.
    expect(hero).not.toMatch(/heading-hero/)
    expect(hero).toMatch(/<h1[\s\S]{0,200}text-3xl sm:text-4xl lg:text-5xl xl:text-6xl/)
    expect(hero).toMatch(/font-extrabold/)
  })

  it('renders a city-targeted <h1> bound to city.name (both modes)', () => {
    expect(hero).toMatch(/<h1\b/)
    expect(hero).toMatch(/Alquiler de carros en \{\{ city\?\.name \}\}/)
  })

  it('keeps the #searcher scroll target (UnableCategoryCard / reserveAnchor CTAs) in both modes', () => {
    // The empty #searcher anchor is rendered above the mode switch, so it exists
    // in landing AND results (harmless in landing — see SCEN-F3-03 design note).
    expect(hero).toMatch(/id="searcher"/)
  })

  it('no longer carries the #41 location pin nor its hidden click action', () => {
    // Removed by request. The pin was an aria-hidden <span> inside the h1 whose
    // @click copied the search into WhatsApp — unreachable by keyboard, so its
    // loss costs no accessible functionality. Reinstate on a REAL control if the
    // operator still wants it.
    expect(hero).not.toMatch(/LocationIcon/)
    expect(hero).not.toMatch(/copySearchToWhatsapp/)
    // Still no ad-hoc controls smuggled into the headline area.
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

  it('replaces the "Reservar ahora" CTA with the home hero WhatsApp button', () => {
    // Single CTA, matching the home: WhatsApp, config-driven, new tab.
    expect(hero).not.toMatch(/Reservar ahora/)
    expect(hero).toMatch(/:href="franchise\.whatsapp"/)
    expect(hero).toMatch(/\bbg-whatsapp\b/)
    expect(hero).toMatch(/\btext-black\b/)
  })

  it('does NOT mount the Searcher engine in the landing branch (zero pickup-location engine)', () => {
    expect(LANDING_BRANCH).not.toMatch(/<Searcher\b/)
    expect(LANDING_BRANCH).not.toMatch(/<ClientOnly>/)
    expect(LANDING_BRANCH).not.toMatch(/<PlaceholdersSearcher\b/)
  })

  it('shows the WhatsApp CTA only outside results mode', () => {
    // In results mode the Searcher is the action; a second CTA would compete.
    expect(hero).toMatch(/v-if="mode !== 'results'"[\s\S]{0,400}franchise\.whatsapp/)
  })
})

describe('Hero redesign — richer landing (vehicle card + trust chips + depth)', () => {
  // The landing hero used to be a lone CTA floating on flat red ("escueto").
  // The redesign mirrors the home hero's visual-card language: a vehicle photo
  // card beside the text, trust chips in the text column, and soft glow blobs
  // for depth — all WITHOUT touching the preserved invariants asserted above.
  it('renders the SHARED hero visual (car + corner video) in the landing branch', () => {
    // The lone vehicle photo card is gone: the landing now mounts the same
    // component the home hero uses, so the two can no longer drift apart.
    expect(hero).toMatch(/<HomeHeroVisual\b/)
    expect(hero).not.toMatch(/\/images\/vehicles\//)
    expect(hero).toMatch(/:car-alt=/)
  })

  // SCEN-CLS-01: the aspect-[16/10] utility alone does NOT reserve the box before
  // paint — its rule lives in Nuxt's JS-injected stylesheet, not the inlined
  // critical CSS, and the <NuxtImg> is `absolute inset-0` (out of flow, zero
  // height contribution). Pre-CSS the card collapses to height 0, then jumps to
  // its 16:10 height when the late CSS lands → the whole hero grid shoves down
  // (measured CLS 0.839, Lighthouse mobile). An INLINE aspect-ratio on the card
  // container reserves the box in the SSR HTML regardless of stylesheet timing.
  // See docs/specs/city-hero-cls.
  it('keeps the visual CLS-safe via the shared component intrinsic dimensions', () => {
    // The car <img> carries width/height in HeroVisual.vue, which reserves its
    // box from the SSR HTML — the reason the old inline aspect-ratio existed.
    const visual = read('app/components/home/HeroVisual.vue')
    expect(visual).toMatch(/width="1199"/)
    expect(visual).toMatch(/height="678"/)
  })

  it('gives the vehicle image an alt bound to the city name (SEO/a11y)', () => {
    expect(hero).toMatch(/:car-alt="`[^`]*\$\{city\?\.name\}/)
  })

  it('prioritizes the landing hero image for LCP (eager + high fetchpriority)', () => {
    const visual = read('app/components/home/HeroVisual.vue')
    expect(visual).toMatch(/loading="eager"/)
    expect(visual).toMatch(/fetchpriority="high"/)
  })

  it('drops the trust chips — the home hero has none', () => {
    // Removed by request: the chip row sat between the subtitle and the CTA and
    // has no counterpart on the home, which the city hero now mirrors.
    expect(hero).not.toMatch(/trustChips/)
    expect(hero).not.toMatch(/v-for="chip in/)
    expect(hero).not.toContain('Hasta 60% de descuento')
  })

  it('matches the home hero spacing so the two heroes breathe the same', () => {
    // Both marked gaps in the operator screenshot: the band's top padding and
    // the text-to-visual gap. City used py-10 / gap-10, home uses py-5 / gap-3
    // on mobile — twice and three times the space respectively.
    expect(hero).toMatch(/py-5 md:py-12/)
    expect(hero).not.toMatch(/py-10 md:py-12/)
    expect(hero).toMatch(/gap-3 lg:gap-10/)
  })

  it('overlays the textured fondo-banner pattern, inert and non-interactive', () => {
    // The glow blobs gave way to the home hero's banner texture, same as index.
    expect(hero).toMatch(/fondo-banner\.webp/)
    expect(hero).toMatch(/pointer-events-none[^>]*absolute|absolute[^>]*pointer-events-none/)
    expect(hero).toMatch(/aria-hidden="true"/)
  })

  it('keeps the vehicle card decorations inert (the scrim/pill add no controls)', () => {
    // Reassert the global no-controls invariant still holds after the redesign.
    expect(hero).not.toMatch(/<button\b/)
    expect(hero).not.toMatch(/<UButton\b/)
  })
})
