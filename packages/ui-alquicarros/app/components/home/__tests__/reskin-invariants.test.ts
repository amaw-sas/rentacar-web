/**
 * Alquicarros reskin — global invariants for the ported home (issue: alquilame
 * home → alquicarros, re-skinned to NARANJA).
 *
 * These guard the cross-cutting rules of the port:
 *   - NO "Alquilame" literal anywhere in home/* , the layout, or index.vue
 *     (brand name is config-driven).
 *   - NO red literals (the alquilame source's red hexes / red-N Tailwind classes
 *     must all be mapped to the orange `brand` scale).
 *   - Reviews omitted: the file is not ported, the home does not mount it, and no
 *     AggregateRating / promo schema is emitted (no fabricated Google data).
 *   - The 11 sections are assembled in index.vue in the design order, sans Reviews.
 *   - The FAB (ChatWidget) is mounted exactly once, via the layout.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros
const HOME = join(ROOT, 'app/components/home')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const homeFiles = readdirSync(HOME).filter((f) => f.endsWith('.vue'))
const index = read('app/pages/index.vue')
const layout = read('app/layouts/default.vue')

// The forbidden red hex literals from the alquilame source.
const RED_HEX = /#cc022b|#cb032c|#a00425|#93070b|#7a001a|#c71a16|#e53a1f|#ff294d|#ff7a45/i
// Tailwind red-palette utility classes (must be remapped to the brand scale).
const RED_CLASS = /\b(bg|text|border|from|to|via|ring|shadow|fill)-red-\d/
// The broken v3 gradient alias (assembled so this file never trips the grep).
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('reskin — no Alquilame literal, no red literals', () => {
  const surfaces = [
    ...homeFiles.map((f) => ['home/' + f, readFileSync(join(HOME, f), 'utf-8')] as const),
    ['index.vue', index] as const,
    ['default.vue', layout] as const,
  ]

  for (const [name, src] of surfaces) {
    it(`${name}: no "Alquilame" literal`, () => {
      expect(src).not.toMatch(/Alquilame/i)
    })
    it(`${name}: no red hex literal`, () => {
      expect(src).not.toMatch(RED_HEX)
    })
    it(`${name}: no red-N Tailwind class`, () => {
      expect(src).not.toMatch(RED_CLASS)
    })
    it(`${name}: no broken v3 bg-gradient-to- alias`, () => {
      expect(src).not.toMatch(BROKEN_V3_GRADIENT)
    })
  }
})

describe('reskin — Reviews omitted, no AggregateRating', () => {
  it('Reviews.vue is NOT ported into home/*', () => {
    expect(existsSync(join(HOME, 'Reviews.vue'))).toBe(false)
  })

  it('index.vue does NOT mount <HomeReviews />', () => {
    expect(index).not.toMatch(/<HomeReviews\b/)
  })

  it('index.vue does NOT emit AggregateRating / promo schemas (no fabricated data)', () => {
    expect(index).not.toMatch(/useHomeAggregateRating/)
    expect(index).not.toMatch(/usePromoVideoSchema/)
    expect(index).not.toMatch(/useEarlyBookingPromotion/)
  })

  it('the footer drops the hardcoded Google rating badge', () => {
    // No fabricated "5,0 / N reseñas" Google badge in the layout chrome.
    expect(layout).not.toMatch(/reseñas en Google/i)
    expect(layout).not.toMatch(/\b5,0\b/)
  })
})

describe('reskin — hero uses a clean static image, not the alquilame video', () => {
  const hero = readFileSync(join(HOME, 'Hero.vue'), 'utf-8')

  // The alquilame hero <video> footage has the "alquílame.co" watermark burned
  // into the pixels — it cannot be reused on alquicarros (other-brand leak).
  it('Hero.vue does not reference the alquilame hero video', () => {
    expect(hero).not.toMatch(/\/videos\/hero/)
    expect(hero).not.toMatch(/<video\b/)
  })

  it('the watermarked video assets are not shipped under public/videos', () => {
    const videosDir = join(ROOT, 'public/videos')
    for (const f of ['hero.webm', 'hero.mp4', 'hero-poster.jpg']) {
      expect(existsSync(join(videosDir, f))).toBe(false)
    }
  })

  it('Hero.vue renders a static image from the neutral vehicle set', () => {
    expect(hero).toMatch(/\/images\/vehicles\//)
  })
})

describe('reskin — index.vue assembles the 11 sections in order (sans Reviews)', () => {
  const expectedOrder = [
    'HomeAnnouncementBar',
    'HomeHero',
    'HomeFleet',
    'HomeHowItWorks',
    'HomeValueProps',
    'HomeCities',
    'HomeStats',
    'HomeRequirements',
    'HomeFaq',
    'HomeContact',
    'HomePartners',
  ]

  it('mounts every expected section', () => {
    for (const tag of expectedOrder) {
      expect(index, `index.vue should mount <${tag} />`).toMatch(new RegExp(`<${tag}\\b`))
    }
  })

  it('mounts them in the design order', () => {
    const positions = expectedOrder.map((tag) => index.indexOf(`<${tag}`))
    const sorted = [...positions].sort((a, b) => a - b)
    expect(positions).toEqual(sorted)
    // none missing
    expect(positions.every((p) => p >= 0)).toBe(true)
  })

  it('keeps the brand-config-driven SEO (useBaseSEO + FAQPage schema)', () => {
    expect(index).toMatch(/useBaseSEO\(\)/)
    expect(index).toMatch(/useHomeBreadcrumb\(\)/)
    expect(index).toMatch(/useSchemaOrg/)
    expect(index).toMatch(/FAQPage/)
    // og copy is config-driven (franchise.*), never a hardcoded brand title.
    expect(index).toMatch(/ogTitle:\s*franchise\.title/)
  })
})

describe('reskin — single FAB via the layout', () => {
  it('mounts the FAB (ChatWidget) exactly once, in the layout', () => {
    expect(layout).toMatch(/<LazyChatWidget\b|<ChatWidget\b/)
    for (const f of homeFiles) {
      const src = readFileSync(join(HOME, f), 'utf-8')
      expect(src, `${f} must not mount a second FAB`).not.toMatch(/<(Lazy)?ChatWidget\b/)
    }
    expect(index).not.toMatch(/<(Lazy)?ChatWidget\b/)
  })
})

describe('reskin — brand orange tokens are used', () => {
  it('at least one home section uses a brand-* token (orange scale)', () => {
    const anyBrand = homeFiles.some((f) =>
      /\b(bg|text|from|to|border|ring|shadow)-(brand|hero-from|hero-to|footer-from|footer-to)/.test(
        readFileSync(join(HOME, f), 'utf-8'),
      ),
    )
    expect(anyBrand).toBe(true)
  })
})
