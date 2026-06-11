/**
 * F1 step07b — Partners "Empresas Aliadas" (issue #112).
 *
 * Static-source assertions encoding the observable partners contract (full
 * runtime/visual check deferred to the F1 preview verification):
 *   - SCEN-F1-03 (Empresas Aliadas): the section presents the ally names as
 *     STYLED TEXT inside a CSS marquee.
 *   - TEXT ONLY: the design ships no logo assets, so the section must NOT use any
 *     <img> tag or logo asset — allies are plain text spans.
 *   - The ally names are a local list driven via v-for (each ally appears once in
 *     the real copy; the duplicate copy that makes the loop seamless is
 *     aria-hidden so assistive tech announces each ally once).
 *   - Gradient guard (F0 lesson): the section + edge fades MUST use the v4
 *     `bg-linear-to-*` utility, NEVER the broken v3 `bg-gradient-to-*` alias.
 *   - Typography adopts the `font-heading` utility (Plus Jakarta), as the design.
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

const ALLIES = ['Localiza', 'Avis', 'Alquicarros', 'Alquilatucarro'] as const

describe('F1 step07b — Partners.vue', () => {
  const partners = read('app/components/home/Partners.vue')

  it('renders a CSS marquee (track + keyframes + animation)', () => {
    expect(partners).toMatch(/class="marquee\b/)
    expect(partners).toMatch(/marquee-track/)
    expect(partners).toMatch(/@keyframes\s+partners-marquee/)
    expect(partners).toMatch(/animation:\s*partners-marquee/)
  })

  it('declares the allies as a local TEXT list and iterates it with v-for', () => {
    expect(partners).toMatch(/v-for="ally in allies"/)
    for (const ally of ALLIES) {
      expect(partners).toContain(`'${ally}'`)
    }
  })

  it('presents the ally names as styled text spans (font-heading)', () => {
    expect(partners).toMatch(/<span[^>]*font-heading[^>]*>\s*\{\{\s*ally\s*\}\}/)
  })

  it('is TEXT ONLY — no <img> tag and no image asset reference anywhere', () => {
    // The design ships no ally logos; allies are text. Guard the rendered markup
    // (no <img>, no <NuxtImg>) and forbid any image-asset file reference. The word
    // "logo" may legitimately appear in explanatory comments (documenting the
    // text-only decision), so it is intentionally NOT asserted against here.
    expect(partners).not.toMatch(/<img\b/i)
    expect(partners).not.toMatch(/<NuxtImg\b/i)
    expect(partners).not.toMatch(/\.(?:png|jpe?g|svg|webp|avif|gif)\b/i)
  })

  it('renders the brand gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(partners).toMatch(/bg-linear-to-[a-z]/)
    expect(partners).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('respects prefers-reduced-motion (disables the marquee animation)', () => {
    expect(partners).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('hides the seamless-loop duplicate copy from assistive tech', () => {
    expect(partners).toMatch(/aria-hidden="true"/)
  })
})
