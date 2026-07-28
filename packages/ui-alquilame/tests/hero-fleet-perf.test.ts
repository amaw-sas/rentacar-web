import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  effectiveNuxtImgQuality,
  findNuxtImgTag,
  parseImageQualityConfig,
} from './nuxt-image-quality'

const hero = readFileSync(
  fileURLToPath(new URL('../app/components/home/Hero.vue', import.meta.url)),
  'utf8',
)
const fleet = readFileSync(
  fileURLToPath(new URL('../app/components/home/Fleet.vue', import.meta.url)),
  'utf8',
)
const nuxtConfig = readFileSync(
  fileURLToPath(new URL('../nuxt.config.ts', import.meta.url)),
  'utf8',
)
const { defaultQuality, allowedQualities } = parseImageQualityConfig(nuxtConfig)

describe('SCEN-322-P01 — hero default paint is poster, not multi-MB autoplay', () => {
  // Redesign 2026-07: the hero is a car cutout IMAGE (webp, alpha) with a small
  // corner video. The scenario's invariant is unchanged — the first paint must
  // never trigger a multi-MB media download — but the mechanism now lives in
  // HeroVisual.vue: static poster first, muted preview only after user intent,
  // visibility AND idle (preload="metadata"), audio only on click.
  const visual = readFileSync(
    fileURLToPath(new URL('../app/components/home/HeroVisual.vue', import.meta.url)),
    'utf8',
  )

  it('first paint is static imagery with reserved dimensions (no CLS, no video)', () => {
    expect(visual).toMatch(/carro_hero\.webp/)
    expect(visual).toMatch(/hero-poster\.jpg/)
    // The poster branch renders while no video mode is active.
    expect(visual).toMatch(/v-if="!videoActive && !audioActive"/)
  })

  it('the muted preview never downloads on paint: gated + preload metadata', () => {
    expect(visual).toMatch(/v-if="videoActive && !audioActive"/)
    expect(visual).not.toMatch(/<video\s+[\s\S]*?v-show=/)
    expect(visual).toMatch(/userInteracted/)
    expect(visual).toMatch(/interactionEvents/)
    expect(visual).toMatch(/preload="metadata"/)
    // The heavy audio track only downloads on explicit click.
    expect(visual).toMatch(/preload="none"/)
  })

  it('routes the hero car through NuxtImg with responsive widths and an allowed quality', () => {
    expect(visual).toMatch(/<NuxtImg[\s\S]*?src="\/images\/carro_hero\.webp"/)
    expect(visual).toMatch(/sizes="sm:100vw lg:50vw xl:576px"/)
    const carImage = findNuxtImgTag(visual, '/images/carro_hero.webp')
    expect(carImage).toMatch(/\bdensities="x1"/)
    expect(carImage).not.toMatch(/\bformat\s*=/)
    expect(carImage).not.toMatch(/\b:?quality\s*=/)
    expect(allowedQualities).toContain(effectiveNuxtImgQuality(carImage, defaultQuality))
    expect(nuxtConfig).toMatch(/image:\s*\{[\s\S]*?provider:\s*['"]vercel['"]/)
  })

  it('the Hero shell itself embeds no <video> — media lives behind HeroVisual gates', () => {
    expect(hero).not.toMatch(/<video/)
    expect(visual).toMatch(/<video/)
  })
})

describe('SCEN-322-P02 — fleet uses NuxtImg pipeline', () => {
  it('uses NuxtImg for vehicle cards, not raw img src JPEG', () => {
    expect(fleet).toMatch(/<NuxtImg/)
    expect(fleet).not.toMatch(/<img[\s\S]*:src="card\.image"/)
  })
})
