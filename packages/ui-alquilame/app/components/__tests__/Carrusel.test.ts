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
 * clic-foto-abre-reserva — sentinela de fuente (regresión SCEN-005).
 * Scenarios: docs/specs/clic-foto-abre-reserva/scenarios/clic-foto-abre-reserva.scenarios.md
 *
 * El COMPORTAMIENTO (tap/teclado emiten `select`) se prueba montando el
 * componente en Carrusel.behavior.test.ts, y el swipe-no-abre + flujo completo
 * en e2e/clic-foto-abre-reserva.spec.ts. Aquí solo se fija que la foto siga
 * siendo un botón accesible cableado a `onActivate` y que NO regrese el
 * pointer-tracking que rompía el tap (Embla emite `pointercancel` en un tap
 * normal y la guarda anterior dejaba el `click` sin emitir).
 */
const wrapperTag = carrusel.match(/<div[^>]*@click="onActivate"[^>]*>/)?.[0] ?? ''
const scriptBlock = carrusel.match(/<script[\s\S]*?<\/script>/)?.[0] ?? ''

describe('clic-foto-abre-reserva — Carrusel.vue source sentinel (SCEN-005)', () => {
  it('declares `select` as an emit so the parent can wire it to goNextStep', () => {
    expect(scriptBlock).toMatch(/defineEmits<\{\s*select:/)
  })

  it('wires the photo wrapper to onActivate on click, Enter and Space', () => {
    expect(wrapperTag).toMatch(/@click="onActivate"/)
    expect(wrapperTag).toMatch(/@keydown\.enter\.prevent="onActivate"/)
    expect(wrapperTag).toMatch(/@keydown\.space\.prevent="onActivate"/)
    const handler = scriptBlock.match(/function onActivate[\s\S]*?\n}/)?.[0] ?? ''
    expect(handler).toMatch(/emit\(['"]select['"]\)/)
  })

  it('exposes the wrapper as a focusable button with an accessible name', () => {
    expect(wrapperTag).toMatch(/role="button"/)
    expect(wrapperTag).toMatch(/tabindex="0"/)
    expect(wrapperTag).toMatch(/:aria-label="`Reservar \$\{item\.nombre\}`"/)
  })

  it('does NOT reintroduce the pointer-tracking that broke the tap (regression)', () => {
    expect(carrusel).not.toMatch(/@pointercancel/)
    expect(carrusel).not.toMatch(/onImageClick/)
    expect(carrusel).not.toMatch(/SWIPE_THRESHOLD_PX/)
  })
})
