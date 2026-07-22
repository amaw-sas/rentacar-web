/**
 * Partners "Empresas Aliadas".
 *
 * Contract UPDATED to match the reference design, which now ships real ally
 * logos. The previous contract pinned a TEXT-ONLY marquee, and its stated
 * premise — "the design ships no logo assets, so allies are text" — was true
 * when written and is no longer: public/images/partners/*.svg exist in the
 * reference and are now vendored here. The section therefore becomes:
 *   - a STATIC centred row (flex-wrap), not a scrolling marquee;
 *   - four real SVG logos, rendered white over the red band via
 *     `brightness-0 invert`;
 *   - each logo carries its ally name as alt text (the names must stay
 *     announceable now that they are images, not text).
 * The brand gradient guard (v4 `bg-linear-to-*`, never the broken v3 alias) is
 * unchanged and still enforced.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

const ALLIES = ['Localiza', 'Avis', 'Alquicarros', 'Alquilatucarro'] as const

describe('Partners.vue — static row of real ally logos', () => {
  const partners = read('app/components/home/Partners.vue')

  it('is STATIC — the marquee track, keyframes and animation are gone', () => {
    expect(partners).not.toMatch(/marquee-track/)
    expect(partners).not.toMatch(/@keyframes\s+partners-marquee/)
    expect(partners).not.toMatch(/animation:\s*partners-marquee/)
  })

  it('lays the allies out as a centred wrapping row', () => {
    expect(partners).toMatch(/flex-wrap/)
    expect(partners).toMatch(/justify-center/)
  })

  it('renders each ally as a real logo image, not a text span', () => {
    expect(partners).toMatch(/<(?:img|NuxtImg)\b/i)
    expect(partners).not.toMatch(/<span[^>]*>\s*\{\{\s*ally(?:\.name)?\s*\}\}/)
  })

  it('wires the 4 vendored ally logos', () => {
    for (const ally of ALLIES) {
      expect(partners).toContain(`'${ally}'`)
    }
    for (const slug of ['localiza', 'avis', 'alquicarros', 'alquilatucarro']) {
      expect(partners).toContain(`/images/partners/${slug}.svg`)
    }
  })

  it('ships the logo assets it references', () => {
    for (const slug of ['localiza', 'avis', 'alquicarros', 'alquilatucarro']) {
      const asset = join(ROOT, 'public/images/partners', `${slug}.svg`)
      expect(existsSync(asset), `missing asset ${slug}.svg`).toBe(true)
    }
  })

  it('keeps the ally names announceable via alt text', () => {
    // Logos are images now; without alt the ally names vanish for screen readers.
    expect(partners).toMatch(/:alt="[^"]*name[^"]*"|:alt="ally\.name"/)
  })

  it('renders the logos white over the red band', () => {
    expect(partners).toMatch(/brightness-0/)
    expect(partners).toMatch(/\binvert\b/)
  })

  it('titles the section with a real <h2>, not a styled paragraph', () => {
    // The section had NO heading element at all: "Empresas Aliadas" was a small
    // uppercase <p>. Screen-reader users could not jump to the section and it
    // read as an untitled block to crawlers. The reference uses an h2 at the
    // same scale as the other section headings.
    const h2 = partners.match(/<h2[^>]*>[\s\S]*?<\/h2>/)
    expect(h2, 'partners section must have an h2').not.toBeNull()
    expect(h2![0]).toContain('Empresas Aliadas')
    expect(h2![0]).toMatch(/font-heading/)
    expect(h2![0]).toMatch(/text-3xl\s+md:text-4xl/)
    expect(h2![0]).toMatch(/font-extrabold/)
    // The old small-caps label treatment is gone.
    expect(partners).not.toMatch(/<p[^>]*uppercase[^>]*>\s*Empresas Aliadas/)
  })

  it('renders the brand gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(partners).toMatch(/bg-linear-to-[a-z]/)
    expect(partners).not.toMatch(BROKEN_V3_GRADIENT)
  })
})
