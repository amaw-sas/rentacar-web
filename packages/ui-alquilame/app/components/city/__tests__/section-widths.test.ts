/**
 * Container-width rhythm on a city landing.
 *
 * The page used to walk five different widths — 1280 → 896 → 1280 → 1024 →
 * 1152 → 896 → 768 → 896 → 768 → 1280 — so scrolling felt like the content kept
 * changing its mind. The rule is now two widths, chosen by what a section
 * CONTAINS, not by taste:
 *
 *   max-w-7xl (1280px) — anything with cards, a grid or images. Wide is free
 *                        here: the eye tracks card edges, not line ends.
 *   max-w-3xl  (768px) — running prose meant to be read start to finish.
 *                        Capped on purpose: 1280px of body copy is ~150
 *                        characters per line, well past the 60–75 that reads
 *                        comfortably, and readers give up mid-paragraph.
 *
 * Scoped to alquilame. Other franchises own their own city components.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const CITY = join(__dirname, '..')
const read = (f: string) => readFileSync(join(CITY, f), 'utf-8')

const SEO = read('SeoContent.vue')
const DELIVERY = read('DeliveryPoints.vue')
const FAQ = read('Faq.vue')

/** Width of the container that immediately follows a section id. */
function widthAfter(src: string, id: string): string | null {
  const at = src.indexOf(`id="${id}"`)
  if (at < 0) return null
  const m = src.slice(at, at + 600).match(/max-w-(\w+)\s+mx-auto/)
  return m ? m[1]! : null
}

// Sections whose content is cards/grids → full width.
const GRID_SECTIONS: ReadonlyArray<[string, string]> = [
  ['ventajas', 'SEO'],
  ['destinos', 'SEO'],
  ['consejos-conduccion', 'SEO'],
  ['ciudades-cercanas', 'SEO'],
  ['mejor-temporada', 'SEO'],  // now text+image, full width
  ['puntos-entrega', 'DELIVERY'],
]

// Sections that are running prose → capped for readability.
// (#introduccion is prose ONLY without a diorama; its own test below covers the
// conditional grid width, so it is not in this blanket list.)
const PROSE_SECTIONS: ReadonlyArray<[string, string]> = [
  ['faqs', 'FAQ'],
]

const sources: Record<string, string> = { SEO, DELIVERY, FAQ }

describe('city sections — grids run full width', () => {
  for (const [id, file] of GRID_SECTIONS) {
    it(`#${id} uses max-w-7xl`, () => {
      expect(widthAfter(sources[file]!, id), `#${id} container not found`).toBe('7xl')
    })
  }
})

describe('city sections — prose stays readable', () => {
  for (const [id, file] of PROSE_SECTIONS) {
    it(`#${id} stays at max-w-3xl`, () => {
      expect(widthAfter(sources[file]!, id), `#${id} container not found`).toBe('3xl')
    })
  }
})

describe('#introduccion — width is content-driven (prose vs diorama grid)', () => {
  const seg = SEO.slice(SEO.indexOf('id="introduccion"'), SEO.indexOf('id="introduccion"') + 900)

  it('stays capped at max-w-3xl when the city has no diorama', () => {
    expect(seg).toMatch(/max-w-3xl/)
  })

  it('expands to the 7xl 2-col grid when a diorama is present', () => {
    expect(seg).toMatch(/dioramaSrc/)
    expect(seg).toMatch(/max-w-7xl grid/)
    expect(seg).toMatch(/lg:grid-cols-/)
  })
})

describe('city sections — only the two sanctioned widths exist', () => {
  it('no 4xl/5xl/6xl containers remain in the city SEO block', () => {
    for (const w of ['4xl', '5xl', '6xl']) {
      expect(SEO, `max-w-${w} should be gone`).not.toMatch(
        new RegExp(`max-w-${w}\\s+mx-auto`),
      )
    }
  })
})

/**
 * Delivery points layout:
 *   GIVEN a city with several branches (Bogotá has 5)
 *   WHEN  the section renders on desktop
 *   THEN  the branch cards sit two per row, not stacked one under another.
 * Stacked, each card spanned the full 1280px container, which made the section
 * read far wider than every other card block on the page.
 */
describe('city delivery points — branches in two columns', () => {
  const DELIVERY_SRC = read('DeliveryPoints.vue')

  it('lays the branch cards out as a two-column grid on desktop', () => {
    const at = DELIVERY_SRC.indexOf('v-for="branch in cityBranches"')
    expect(at, 'branch loop not found').toBeGreaterThan(-1)
    const container = DELIVERY_SRC.slice(Math.max(0, at - 300), at)
    expect(container).toMatch(/grid/)
    expect(container).toMatch(/md:grid-cols-2|sm:grid-cols-2/)
  })

  it('no longer stacks them in a single flex column', () => {
    const at = DELIVERY_SRC.indexOf('v-for="branch in cityBranches"')
    const container = DELIVERY_SRC.slice(Math.max(0, at - 300), at)
    expect(container).not.toMatch(/flex flex-col gap-4/)
  })
})

/**
 * Card size rhythm across the SEO card sections.
 *
 * Every section already sits at 1280px, but the CARDS inside ranged from 308px
 * (ciudades-cercanas, 4-up) to 1280px (consejos, stacked) — a 4× spread that
 * made some blocks feel much wider than others despite equal containers.
 * Ventajas and Destinos ran 2-up (628px cards); consejos was a stacked column.
 * All three move to a 3-up grid (~411px), matching Nuestra Flota, so cards land
 * in one size band instead of three.
 */
describe('city SEO cards — three per row, so card sizes stop jumping', () => {
  const cols = (id: string): string => {
    const at = SEO.indexOf(`id="${id}"`)
    const seg = SEO.slice(at, at + 900)
    const m = seg.match(/(?:lg:)?grid-cols-(\d)/g) ?? []
    return m.join(' ')
  }

  it('ventajas is a three-column grid', () => {
    expect(cols('ventajas')).toMatch(/grid-cols-3/)
  })

  it('destinos is a three-column grid', () => {
    expect(cols('destinos')).toMatch(/grid-cols-3/)
  })

  it('consejos-conduccion is a three-column grid, not a stacked column', () => {
    const at = SEO.indexOf('id="consejos-conduccion"')
    const seg = SEO.slice(at, at + 900)
    expect(seg).toMatch(/grid-cols-3/)
    expect(seg).not.toMatch(/<div class="space-y-5">\s*<div\s+v-for="tip/)
  })
})
