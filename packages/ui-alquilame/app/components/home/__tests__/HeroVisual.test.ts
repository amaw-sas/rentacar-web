/**
 * HeroVisual — the car cutout + corner video, extracted so the home hero and the
 * city hero render the SAME visual instead of two copies that drift.
 *
 * Contract:
 *   - the car image uses the Vercel image pipeline with a responsive srcset,
 *     while keeping eager + high fetchpriority + intrinsic dimensions;
 *   - the corner video has three states — poster (default), muted preview loop,
 *     full audio video — and the audio one is preload="none" so it downloads
 *     only after the user asks for sound;
 *   - autoplay of the muted preview is opt-OUT for reduced-motion and data-saver
 *     users and waits for both visibility and browser idle time;
 *   - both heroes consume this component; neither keeps its own copy.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  effectiveNuxtImgQuality,
  findNuxtImgTag,
  parseImageQualityConfig,
} from '../../../../tests/nuxt-image-quality'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const visual = read('app/components/home/HeroVisual.vue')
const homeHero = read('app/components/home/Hero.vue')
const cityHero = read('app/components/city/Hero.vue')
const { defaultQuality, allowedQualities } = parseImageQualityConfig(read('nuxt.config.ts'))

describe('HeroVisual.vue — shared car + corner video', () => {
  it('renders the car cutout as a responsive, reserved, eager LCP image', () => {
    expect(visual).toMatch(/<NuxtImg\b/)
    expect(visual).not.toMatch(/<img[\s\S]*?carro_hero\.webp/)
    expect(visual).toContain('/images/carro_hero.webp')
    expect(visual).toMatch(/loading="eager"/)
    expect(visual).toMatch(/fetchpriority="high"/)
    expect(visual).toMatch(/width="1199"/)
    expect(visual).toMatch(/height="678"/)
    expect(visual).toMatch(/sizes="sm:100vw lg:50vw xl:576px"/)
    const carImage = findNuxtImgTag(visual, '/images/carro_hero.webp')
    expect(carImage).toMatch(/\bdensities="x1"/)
    expect(carImage).not.toMatch(/\bformat\s*=/)
    expect(carImage).not.toMatch(/\b:?quality\s*=/)
    expect(allowedQualities).toContain(effectiveNuxtImgQuality(carImage, defaultQuality))
  })

  it('keeps the three video states, with audio behind preload="none"', () => {
    expect(visual).toContain('/videos/hero-poster.jpg')
    expect(visual).toContain('/videos/hero.mp4')
    expect(visual).toContain('/videos/hero-audio.mp4')
    expect(visual).toMatch(/preload="none"/)
    expect(visual).toMatch(/Activar sonido/)
  })

  it('conditionally creates both video elements instead of merely hiding their sources', () => {
    expect(visual).toMatch(/<video\s+[\s\S]*?v-if="videoActive && !audioActive"/)
    expect(visual).toMatch(/<video\s+[\s\S]*?v-if="audioActive"/)
    expect(visual).not.toMatch(/<video\s+[\s\S]*?v-show=/)
  })

  it('autoplays after visibility and idle, while respecting motion and data-saver preferences', () => {
    expect(visual).toMatch(/prefers-reduced-motion/)
    expect(visual).toMatch(/saveData/)
    expect(visual).toMatch(/IntersectionObserver/)
    expect(visual).toMatch(/requestIdleCallback/)
    expect(visual).toMatch(/timeout: 2500/)
    expect(visual).not.toMatch(/userInteracted|interactionEvents/)
    expect(visual).not.toMatch(/window\.addEventListener/)
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
