/**
 * HeroVisual — the car cutout + corner video, extracted so the home hero and the
 * city hero render the SAME visual instead of two copies that drift.
 *
 * Contract:
 *   - the car image is the LCP candidate: eager + high fetchpriority + intrinsic
 *     width/height so its box is reserved (no CLS);
 *   - the corner video has three states — poster (default), muted preview loop,
 *     full audio video — and the audio one is preload="none" so it downloads
 *     only after the user asks for sound;
 *   - autoplay of the muted preview is opt-OUT for reduced-motion and data-saver
 *     users and waits until the block is on screen;
 *   - both heroes consume this component; neither keeps its own copy.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const visual = read('app/components/home/HeroVisual.vue')
const homeHero = read('app/components/home/Hero.vue')
const cityHero = read('app/components/city/Hero.vue')

describe('HeroVisual.vue — shared car + corner video', () => {
  it('renders the car cutout as a reserved, eager LCP image', () => {
    expect(visual).toContain('/images/carro_hero.webp')
    expect(visual).toMatch(/loading="eager"/)
    expect(visual).toMatch(/fetchpriority="high"/)
    expect(visual).toMatch(/width="1199"/)
    expect(visual).toMatch(/height="678"/)
  })

  it('keeps the three video states, with audio behind preload="none"', () => {
    expect(visual).toContain('/videos/hero-poster.jpg')
    expect(visual).toContain('/videos/hero.mp4')
    expect(visual).toContain('/videos/hero-audio.mp4')
    expect(visual).toMatch(/preload="none"/)
    expect(visual).toMatch(/Activar sonido/)
  })

  it('gates the preview autoplay on motion, data-saver and visibility', () => {
    expect(visual).toMatch(/prefers-reduced-motion/)
    expect(visual).toMatch(/saveData/)
    expect(visual).toMatch(/IntersectionObserver/)
    expect(visual).toMatch(/onBeforeUnmount/)
  })

  it('lets the caller override the car alt text per page', () => {
    // The home says "en Colombia", a city page says "en Armenia" — same visual,
    // different accessible name.
    expect(visual).toMatch(/carAlt/)
  })
})

describe('both heroes consume the shared visual — no second copy', () => {
  for (const [label, src] of [['home', homeHero], ['city', cityHero]] as const) {
    it(`${label} hero mounts <HomeHeroVisual> and keeps no inline video markup`, () => {
      expect(src).toMatch(/<HomeHeroVisual\b/)
      expect(src).not.toContain('/videos/hero.mp4')
      expect(src).not.toContain('/videos/hero-audio.mp4')
    })
  }
})
