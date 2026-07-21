/**
 * SCEN-WA1 — hero shows WhatsApp next to "Ver Precios" on every breakpoint.
 *
 * Operator request (revised): WhatsApp is NO LONGER hidden on desktop. It sits in
 * the hero CTA row beside "Ver Precios" at all sizes, and the desktop header's
 * WhatsApp circle is removed (see layouts/default.vue) so there is a single
 * WhatsApp affordance on desktop. Two-viewport rendering verified in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HERO = readFileSync(join(__dirname, '..', 'app/components/home/Hero.vue'), 'utf-8')
const LAYOUT = readFileSync(join(__dirname, '..', 'app/layouts/default.vue'), 'utf-8')

describe('SCEN-WA1: hero WhatsApp CTA sits beside Ver Precios (all breakpoints)', () => {
  it('the WhatsApp anchor is NOT desktop-hidden', () => {
    const anchor = HERO.match(/<a[^>]*aria-label="Contáctanos por WhatsApp"[\s\S]*?<\/a>/)
    expect(anchor, 'hero WhatsApp anchor not found').not.toBeNull()
    expect(anchor![0]).not.toMatch(/\blg:hidden\b/)
  })

  it('keeps "Ver Precios" in the same CTA row', () => {
    expect(HERO).toMatch(/href="#fleet"/)
    expect(HERO).toMatch(/Ver Precios/)
    expect(HERO).toMatch(/aria-label="Contáctanos por WhatsApp"/)
  })
})

describe('SCEN-WA2: the desktop header no longer carries a WhatsApp circle', () => {
  it('removes the header "Contactar por WhatsApp" affordance', () => {
    expect(LAYOUT).not.toMatch(/aria-label="Contactar por WhatsApp"/)
  })
})
