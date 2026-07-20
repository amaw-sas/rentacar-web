/**
 * Home hero — golden parity (astro-alquilame #hero, issue #112 F3).
 *
 * Static-source assertions encoding the observable hero contract (full visual
 * check deferred to the F3 preview / screenshot-diff verification):
 *   - Pure-marketing home: the inline search engine (<SelectBranch> + the
 *     "¿En qué ciudad…?" prompt) is GONE — search centralizes at /reservas.
 *   - CTA row matches the golden EXACTLY: "Ver Precios" (#fleet) + a CONTACT
 *     WhatsApp button bound to franchise.whatsapp. The golden has NO extra
 *     "Reservar ahora" CTA and NO <HeroHeadline> trust badge — both removed.
 *   - Visual column is the golden looping <video> (autoplay/muted/loop/
 *     playsinline + poster="/videos/hero-poster.jpg", webm + mp4 sources)
 *     inside an aspect-[16/9] card (reserves space → no CLS).
 *   - Headline uses the brand heading font (font-heading, Plus Jakarta).
 *   - Gradient guard (F0 lesson): the hero MUST use the v4 `bg-linear-to-*`
 *     utility built from the hero-from/hero-to @theme tokens, NEVER the broken
 *     v3 gradient alias (which renders background-image:none with custom tokens,
 *     leaving the hero transparent).
 *   - index.vue mounts <HomeHero /> in place of the legacy inline UPageHero.
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

describe('Home hero — golden parity', () => {
  const hero = read('app/components/home/Hero.vue')

  it('renders the brand red gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(hero).toMatch(/bg-linear-to-[a-z]/)
    expect(hero).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('uses the hero-from / hero-to brand gradient tokens', () => {
    expect(hero).toMatch(/from-hero-from\s+to-hero-to/)
  })

  it('removes the inline engine: the hero NO longer mounts <SelectBranch>', () => {
    expect(hero).not.toMatch(/<SelectBranch\b/)
  })

  it('drops the "¿En qué ciudad deseas recoger tu carro?" selector prompt label', () => {
    expect(hero).not.toMatch(/¿En qué ciudad/i)
    expect(hero).not.toMatch(/recoger tu carro\?/i)
  })

  it('has NO extra "Reservar ahora" CTA (golden CTA row is Ver Precios + WhatsApp only)', () => {
    expect(hero).not.toMatch(/Reservar ahora/)
    expect(hero).not.toMatch(/to="\/reservas"/)
  })

  it('has NO <HeroHeadline> trust badge (not present in the golden hero)', () => {
    expect(hero).not.toMatch(/<HeroHeadline\b/)
  })

  it('uses the brand heading font (font-heading) for the headline', () => {
    expect(hero).toMatch(/<h1[^>]*\bfont-heading\b/)
    expect(hero).toContain('Alquiler de Carros en Colombia al Mejor Precio')
  })

  it('reserves visual space with an aspect-ratio card (CLS)', () => {
    expect(hero).toMatch(/aspect-\[/)
  })

  // SCEN-CLS-04: the aspect-[16/9] utility rule is NOT in Nuxt's inlined critical
  // CSS (it ships in the JS-injected stylesheet), and the <video> carries no
  // width/height attrs, so pre-CSS the card falls back to the 300×150 video
  // default and shifts when the real ratio applies (home CLS 0.129). An INLINE
  // aspect-ratio reserves the 16:9 box in the SSR HTML regardless of stylesheet
  // timing. See docs/specs/city-hero-cls.
  it('reserves the video card with an inline aspect-ratio (survives pre-CSS — CLS)', () => {
    expect(hero).toMatch(/style="[^"]*aspect-ratio:\s*16\s*\/\s*9/)
  })

  it('defaults to poster image; defers video (mp4) off the critical path (issue 322 P01)', () => {
    // First paint: NuxtImg poster, not multi-MB autoplay sources.
    expect(hero).toMatch(/NuxtImg/)
    expect(hero).toMatch(/hero-poster\.jpg/)
    expect(hero).toMatch(/v-if="!videoActive && !audioActive"/)
    // Deferred muted-preview branch (activated after idle/visible).
    expect(hero).toMatch(/<video\b/)
    expect(hero).toMatch(/autoplay/)
    expect(hero).toMatch(/\bmuted\b/)
    expect(hero).toMatch(/\bloop\b/)
    expect(hero).toMatch(/\bplaysinline\b/)
    expect(hero).toMatch(/hero\.mp4/)
    expect(hero).not.toMatch(/hero\.webm/)
  })

  // SCEN-SND: muted preview loops for free; a user click loads the full video
  // WITH audio (preload="none" → no cost until intent), the only way browsers
  // allow audible playback. Audible playback itself is verified in the browser.
  it('adds a click-to-enable-sound flow backed by a preload=none audio video', () => {
    // The audio master is a SEPARATE, deferred asset — never on the critical path.
    expect(hero).toMatch(/hero-audio\.mp4/)
    expect(hero).toMatch(/preload="none"/)
    // A real button (a11y label) toggles sound on; wired to enableSound.
    expect(hero).toMatch(/@click="enableSound"/)
    expect(hero).toMatch(/aria-label="[^"]*sonido[^"]*"/i)
    // State + handler exist in the script.
    expect(hero).toMatch(/audioActive/)
    expect(hero).toMatch(/function enableSound|const enableSound/)
  })

  it('has the "Ver Precios" CTA anchoring to #fleet (no WhatsApp-to-reserve)', () => {
    expect(hero).toMatch(/href="#fleet"/)
    expect(hero).toMatch(/Ver Precios/)
  })

  it('keeps a CONTACT WhatsApp CTA bound to franchise.whatsapp, never a hardcoded number', () => {
    // The contact button must consume the config URL as-is (already https://wa.me/…),
    // open in a new tab, and never inline a raw phone/wa.me number.
    expect(hero).toMatch(/:href="franchise\.whatsapp"/)
    expect(hero).toMatch(/target="_blank"/)
    expect(hero).not.toMatch(/wa\.me\/\d/)
    expect(hero).not.toMatch(/href="https:\/\/wa\.me/)
  })

  it('uses the shared bg-whatsapp token with black text (WCAG AA; issue #284)', () => {
    expect(hero).toMatch(/\bbg-whatsapp\b/)
    expect(hero).toMatch(/\btext-black\b/)
    expect(hero).not.toMatch(/bg-\[#090\]/)
  })

  it('reads franchise from useAppConfig (not a hardcoded brand contact)', () => {
    expect(hero).toMatch(/useAppConfig\(\)/)
  })
})

describe('index.vue mounts the restyled hero', () => {
  const index = read('app/pages/index.vue')

  it('mounts <HomeHero /> instead of the legacy inline UPageHero hero', () => {
    expect(index).toMatch(/<HomeHero\b/)
    expect(index).not.toContain('<UPageHero')
  })

  it('no longer wires SelectBranch / Hero* inline in the hero body (moved into Hero.vue)', () => {
    expect(index).not.toContain('<HeroHeadline')
    expect(index).not.toContain('<HeroTitle')
    expect(index).not.toContain('<HeroDescription')
  })

  it('introduces no broken v3 gradient alias on the page', () => {
    expect(index).not.toMatch(BROKEN_V3_GRADIENT)
  })
})
