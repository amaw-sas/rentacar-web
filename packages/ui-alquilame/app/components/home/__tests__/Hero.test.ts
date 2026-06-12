/**
 * F3 step03 — Home hero: engine out, CTA in (issue #112, SCEN-F3-02).
 *
 * Static-source assertions encoding the observable hero contract (full
 * runtime/visual check deferred to the F3 preview verification):
 *   - Pure-marketing home: the inline search engine (<SelectBranch> + the
 *     "¿En qué ciudad…?" prompt) is GONE — search centralizes at /reservas.
 *   - Primary CTA: the hero mounts a "Reservar ahora" <NuxtLink to="/reservas">
 *     (SPA navigation), styled like "Ver Precios" (white button on red).
 *   - Preserved: "Ver Precios" (#fleet), the CONTACT WhatsApp button bound to
 *     franchise.whatsapp, the brand red gradient + tokens, HeroHeadline, the
 *     headline/ImagesFamily, and useAppConfig().
 *   - Gradient guard (F0 lesson): the hero MUST use the v4 `bg-linear-to-*`
 *     utility built from the hero-from/hero-to @theme tokens, NEVER the broken v3
 *     gradient alias (which renders background-image:none with custom tokens,
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

describe('F3 step03 — Hero.vue engine-out, CTA-in', () => {
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
    // The engine prompt label is gone. The marketing subcopy ("…eligiendo tu
    // ciudad.") is intentionally KEPT, so a bare /ciudad/i would over-match — we
    // assert the absence of the interrogative prompt specifically.
    expect(hero).not.toMatch(/¿En qué ciudad/i)
    expect(hero).not.toMatch(/recoger tu carro\?/i)
  })

  it('adds the primary CTA "Reservar ahora" as <NuxtLink to="/reservas"> (SPA)', () => {
    // SPA navigation (NuxtLink), not a plain <a href> to /reservas.
    expect(hero).toMatch(/<NuxtLink\b[^>]*\bto="\/reservas"/)
    expect(hero).toMatch(/Reservar ahora/)
  })

  it('adopts the .heading-hero utility (Plus Jakarta) for the headline', () => {
    expect(hero).toMatch(/heading-hero/)
  })

  it('reserves image space with aspect-ratio (CLS)', () => {
    expect(hero).toMatch(/aspect-\[/)
  })

  it('shows the "4.9 reviews" trust badge by reusing <HeroHeadline>', () => {
    expect(hero).toMatch(/<HeroHeadline\b/)
  })

  it('has the "Ver Precios" CTA anchoring to #fleet (engine-adjacent, no WhatsApp-to-reserve)', () => {
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

  it('reads franchise from useAppConfig (not a hardcoded brand contact)', () => {
    expect(hero).toMatch(/useAppConfig\(\)/)
  })
})

describe('F1 step01 — index.vue mounts the restyled hero', () => {
  const index = read('app/pages/index.vue')

  it('mounts <HomeHero /> instead of the legacy inline UPageHero hero', () => {
    expect(index).toMatch(/<HomeHero\b/)
    expect(index).not.toContain('<UPageHero')
  })

  it('no longer wires SelectBranch inline in the hero body (moved into Hero.vue)', () => {
    // The other inline SelectBranch instances live in the category modals, which
    // this step leaves untouched; the hero-body selector is gone from the page.
    expect(index).not.toContain('<HeroHeadline')
    expect(index).not.toContain('<HeroTitle')
    expect(index).not.toContain('<HeroDescription')
  })

  it('introduces no broken v3 gradient alias on the page', () => {
    expect(index).not.toMatch(BROKEN_V3_GRADIENT)
  })
})
