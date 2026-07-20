/**
 * SCEN-GR1 — /reservas searcher goes green (operator request).
 *
 * The "Buscar vehículos" CTA and the date/hour badges ("N días", extra-hours)
 * must use the brand WhatsApp green (#25D366 = bg-whatsapp), matching the header
 * WhatsApp button, instead of brand red. Green CTAs use text-black per the theme
 * note (white on #25D366 fails WCAG AA). Visual result verified in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const base = (p: string) => join(__dirname, '..', p)
const SEARCHER = readFileSync(base('app/components/Searcher.vue'), 'utf-8')
const DRAWER = readFileSync(base('app/components/SearcherSelectDrawer.vue'), 'utf-8')
const CSS = readFileSync(base('app/assets/css/rentacar-main/base.css'), 'utf-8')

describe('SCEN-GR1: search button is WhatsApp green, not red', () => {
  it('.search-button uses bg-whatsapp (not bg-red-600)', () => {
    const rule = CSS.match(/\.search-button\s*\{[^}]*\}/)
    expect(rule, '.search-button rule not found').not.toBeNull()
    expect(rule![0]).toMatch(/bg-whatsapp/)
    expect(rule![0]).not.toMatch(/bg-red-600/)
  })
})

describe('SCEN-GR2: date/hour chips are WhatsApp green, not red', () => {
  it('Searcher badges use bg-whatsapp and no longer bg-red-600', () => {
    expect(SEARCHER).toMatch(/bg-whatsapp/)
    expect(SEARCHER).not.toMatch(/bg-red-600/)
  })

  it('the mobile drawer badge uses bg-whatsapp, not bg-red-600', () => {
    expect(DRAWER).toMatch(/bg-whatsapp/)
    expect(DRAWER).not.toMatch(/bg-red-600/)
  })
})
