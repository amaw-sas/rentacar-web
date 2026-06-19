import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue #75 — category-carousel-image-aspect holdout (source-string idiom).
 * Scenarios: docs/specs/2026-05-28-category-carousel-image-aspect/scenarios/category-carousel-image-aspect.scenarios.md
 *
 * Model photos arrive with varying intrinsic aspect ratios. With only `w-full`
 * the <img> inherits each file's natural ratio (the UA `aspect-ratio: auto 800/480`
 * is just a pre-load fallback, and Tailwind Preflight forces `img { height:auto }`),
 * so card image heights diverge and the carousel pagination dots (`bottom-5`,
 * absolute to the viewport) land at different offsets. A fixed `aspect-[5/3]`
 * (= the declared 800x480) box plus `object-cover` makes every slide the same
 * height regardless of the source. SCEN-005.
 */

const carrusel = readFileSync(
  fileURLToPath(new URL('../Carrusel.vue', import.meta.url)),
  'utf8',
)

const imgTag = carrusel.match(/<NuxtImg[\s\S]*?\/>/)?.[0] ?? ''
const imgClass = imgTag.match(/class="([^"]*)"/)?.[1] ?? ''

describe('category-carousel-image-aspect — Carrusel.vue model image box (SCEN-005, #75)', () => {
  it('renders one NuxtImg slide that carries a class attribute', () => {
    expect(imgTag).toMatch(/<NuxtImg/)
    expect(imgClass.length).toBeGreaterThan(0)
  })

  it('pins a fixed aspect-ratio box so every slide is the same height', () => {
    // Explicit ratio overrides the UA `aspect-ratio: auto 800/480` that otherwise
    // adopts each image's intrinsic ratio -> divergent heights (the bug).
    expect(imgClass).toMatch(/aspect-\[5\/3\]/)
  })

  it('crops overflow with object-cover instead of distorting or letterboxing', () => {
    expect(imgClass).toContain('object-cover')
  })

  it('keeps the image full-width inside the carousel viewport', () => {
    expect(imgClass).toContain('w-full')
  })

  it('matches the declared intrinsic 800x480 (= 5/3) so a correct photo is not cropped (SCEN-004)', () => {
    expect(imgTag).toMatch(/width="800"/)
    expect(imgTag).toMatch(/height="480"/)
  })
})

/**
 * clic-foto-abre-reserva holdout (source-string idiom).
 * Scenarios: docs/specs/clic-foto-abre-reserva/scenarios/clic-foto-abre-reserva.scenarios.md
 *
 * The slide wrapper becomes an actionable affordance that opens the reservation
 * flow (emits `select` → parent `goNextStep`). A tap must open; a swipe used to
 * navigate slides must not; and it must be operable by keyboard. These are
 * static source guards on Carrusel.vue (the regression sentinel, SCEN-005).
 */

// The interactive wrapper is the <div> that carries the click handler.
const wrapperTag = carrusel.match(/<div[^>]*@click="onImageClick"[^>]*>/)?.[0] ?? ''
const scriptBlock = carrusel.match(/<script[\s\S]*?<\/script>/)?.[0] ?? ''

describe('clic-foto-abre-reserva — Carrusel.vue tap/keyboard opens reservation (SCEN-001..005)', () => {
  it('declares `select` as an emit so the parent can wire it to goNextStep (SCEN-001)', () => {
    expect(scriptBlock).toMatch(/defineEmits<\{\s*select:/)
  })

  it('opens on a tap within threshold by emitting select from the click handler (SCEN-001)', () => {
    const handler = scriptBlock.match(/function onImageClick[\s\S]*?\n}/)?.[0] ?? ''
    expect(handler).toMatch(/emit\(['"]select['"]\)/)
  })

  it('treats movement beyond the swipe threshold as a swipe and does not open (SCEN-002)', () => {
    const handler = scriptBlock.match(/function onImageClick[\s\S]*?\n}/)?.[0] ?? ''
    // dx/dy measured against the recorded pointerdown, early-return past threshold.
    expect(handler).toMatch(/dx > SWIPE_THRESHOLD_PX \|\| dy > SWIPE_THRESHOLD_PX/)
    expect(handler).toMatch(/return/)
    expect(scriptBlock).toMatch(/const SWIPE_THRESHOLD_PX = 10/)
  })

  it('exposes the image wrapper as a focusable button with an accessible name (SCEN-003)', () => {
    expect(wrapperTag).toMatch(/role="button"/)
    expect(wrapperTag).toMatch(/tabindex="0"/)
    expect(wrapperTag).toMatch(/:aria-label="`Reservar \$\{item\.nombre\}`"/)
  })

  it('opens on Enter and Space so it is operable without a pointer (SCEN-003)', () => {
    expect(wrapperTag).toMatch(/@keydown\.enter\.prevent="onActivate"/)
    expect(wrapperTag).toMatch(/@keydown\.space\.prevent="onActivate"/)
    const handler = scriptBlock.match(/function onActivate[\s\S]*?\n}/)?.[0] ?? ''
    expect(handler).toMatch(/emit\(['"]select['"]\)/)
  })

  it('clears the recorded position on pointercancel so a swipe leaves no stale state (SCEN-004)', () => {
    expect(wrapperTag).toMatch(/@pointercancel="onPointerCancel"/)
    const handler = scriptBlock.match(/function onPointerCancel[\s\S]*?\n}/)?.[0] ?? ''
    expect(handler).toMatch(/pointerStart = null/)
  })

  it('does not open on a click that has no recorded pointerdown of its own (SCEN-004)', () => {
    const handler = scriptBlock.match(/function onImageClick[\s\S]*?\n}/)?.[0] ?? ''
    // Untrusted click (synthetic / pointerdown captured): early-return before any emit.
    expect(handler).toMatch(/if \(!start\) return/)
    // The guard must precede the emit (no unconditional emit path).
    expect(handler.indexOf('if (!start) return')).toBeLessThan(handler.indexOf("emit('select')"))
  })
})
