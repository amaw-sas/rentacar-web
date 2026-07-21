/**
 * SCEN-WA1 — hero WhatsApp button is hidden on desktop (alquicarros mirror).
 *
 * Operator request: remove the green WhatsApp button from the hero CTA row on
 * DESKTOP only. On mobile it stays. Header WhatsApp + chat FAB unaffected.
 *
 * `lg` is the desktop breakpoint (header uses `hidden lg:flex`); the hero
 * WhatsApp anchor carries `lg:hidden` (visible < lg, hidden >= lg). The
 * two-viewport rendering is verified in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HERO = join(__dirname, '..', 'app/components/home/Hero.vue')

describe('SCEN-WA1: hero WhatsApp CTA is desktop-hidden (alquicarros)', () => {
  const src = readFileSync(HERO, 'utf-8')

  it('the WhatsApp anchor carries lg:hidden', () => {
    const anchor = src.match(/<a[^>]*aria-label="Contáctanos por WhatsApp"[\s\S]*?<\/a>/)
    expect(anchor, 'hero WhatsApp anchor not found').not.toBeNull()
    expect(anchor![0]).toMatch(/\blg:hidden\b/)
  })

  it('the "Ver Precios" anchor stays visible at all breakpoints (no lg:hidden)', () => {
    const verPrecios = src.match(/<a[^>]*href="#fleet"[\s\S]*?<\/a>/)
    expect(verPrecios, 'Ver Precios anchor not found').not.toBeNull()
    expect(verPrecios![0]).not.toMatch(/\blg:hidden\b/)
  })
})
