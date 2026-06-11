/**
 * F2 step02 — City Hero restyle (issue #112).
 *
 * Static-source assertions encoding the observable city-hero contract (full
 * runtime/visual check deferred to the F2 preview verification):
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

describe('F2 step02 — city/Hero.vue restyle', () => {
  const hero = read('app/components/city/Hero.vue')

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

  it('renders a city-targeted <h1> bound to city.name', () => {
    expect(hero).toMatch(/<h1[^>]*heading-hero/)
    expect(hero).toMatch(/Alquiler de carros en \{\{ city\?\.name \}\}/)
  })

  it('preserves the engine: mounts <Searcher> (same component → same data-testid)', () => {
    expect(hero).toMatch(/<Searcher\b/)
    // The Searcher's testids are the engine contract carried by the component.
    // It must be imported from the sibling Searcher.vue, not reimplemented.
    expect(hero).toMatch(/import\(['"]\.\.\/Searcher\.vue['"]\)/)
  })

  it('keeps the #searcher scroll target (UnableCategoryCard / reserveAnchor CTAs)', () => {
    expect(hero).toMatch(/id="searcher"/)
  })

  it('wraps the Searcher in <ClientOnly> with a fixed-height fallback (no hydration shift, #109)', () => {
    expect(hero).toMatch(/<ClientOnly>/)
    expect(hero).toMatch(/<PlaceholdersSearcher\b/)
    // Fixed-height wrappers reserve the engine footprint (CLS / hydration).
    expect(hero).toMatch(/h-\[\d+px\]/)
  })

  it('preserves the #41 pin as an INERT <span aria-hidden> (never a <button>)', () => {
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

  it('reserves the image/engine footprint without aspect-ratio shift (CLS-safe fixed heights)', () => {
    // City hero reserves the Searcher box via fixed heights rather than an
    // image aspect-ratio; assert the footprint is explicitly reserved.
    expect(hero).toMatch(/h-\[410px\]/)
    expect(hero).toMatch(/h-\[360px\]/)
  })
})
