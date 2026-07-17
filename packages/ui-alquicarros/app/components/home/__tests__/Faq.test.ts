/**
 * FAQ redesign (issue #210 follow-up) — home/Faq.vue.
 *
 * Editorial 2-column restyle of the #faqs section: left rail (sticky) with
 * heading + brand-gradient WhatsApp CTA card, right column the accordion.
 * These are static-source assertions encoding the OBSERVABLE contract; the full
 * visual/runtime check is done in the browser (dev server).
 *
 * Invariants:
 *   - SCEN-1: two-column grid on desktop (lg:grid-cols-5 → col-span-2 + 3),
 *     left rail sticky.
 *   - Reskin language: brand-gradient CTA card (bg-linear-to-br + hero tokens),
 *     lucide icons, rounded-2xl accordion cards.
 *   - a11y: the WhatsApp action is token bg-whatsapp (#25D366) with black
 *     text (10.6:1, AA), not white text on orange or on the bright green.
 *   - Data/SEO untouched: accordion still sources useData().faqs; NO FAQPage
 *     schema inlined here (stays in index.vue).
 *   - Gradient guard (F0 lesson): v4 bg-linear-to-* only, never the v3 alias.
 *   - Copy unchanged: the three human strings survive verbatim.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('FAQ redesign — home/Faq.vue', () => {
  const faq = read('app/components/home/Faq.vue')

  it('lays out the section in a two-column grid (left rail + accordion)', () => {
    expect(faq).toMatch(/id="faqs"/)
    expect(faq).toMatch(/lg:grid-cols-5/)
    expect(faq).toMatch(/lg:col-span-2/)
    expect(faq).toMatch(/lg:col-span-3/)
  })

  it('makes the left intro rail sticky on desktop', () => {
    expect(faq).toMatch(/lg:sticky/)
  })

  it('renders the WhatsApp CTA as a brand-gradient card', () => {
    expect(faq).toMatch(/bg-linear-to-br\s+from-hero-from\s+to-hero-to/)
  })

  it('keeps the WhatsApp action AA-legible (token bg-whatsapp + black text)', () => {
    // Token --color-whatsapp (#25D366) + BLACK text = 10.6:1 (AA; issue #284).
    // white text on this bright green would fail (~2:1). Heading stays gray-900
    // because white on the orange gradient fails AA (theme.css caveat).
    expect(faq).toMatch(/\bbg-whatsapp\b/)
    expect(faq).toMatch(/text-black/)
    expect(faq).toMatch(/text-gray-900/)
    expect(faq).not.toMatch(/bg-\[#090\]/)
    expect(faq).toMatch(/:href="franchise\.whatsapp"/)
  })

  it('uses lucide icons for the reskin language', () => {
    expect(faq).toMatch(/i-lucide-help-circle/)
    expect(faq).toMatch(/i-lucide-message-circle/)
  })

  it('gives the accordion cards the reskin skin (rounded-2xl, bordered)', () => {
    expect(faq).toMatch(/rounded-2xl/)
    expect(faq).toMatch(/border-gray-200/)
  })

  it('still sources the accordion from useData().faqs (brand-level list)', () => {
    expect(faq).toMatch(/useData\(\)/)
    expect(faq).toMatch(/:items="faqs"/)
  })

  it('does NOT inline the FAQPage schema (stays in index.vue)', () => {
    expect(faq).not.toMatch(/FAQPage/)
    expect(faq).not.toMatch(/useSchemaOrg/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('keeps the human copy verbatim (no text changes)', () => {
    expect(faq).toContain('Preguntas Frecuentes')
    expect(faq).toContain('Todo lo que necesitas saber sobre nuestro servicio de alquiler de carros.')
    expect(faq).toContain('¿Tienes otra pregunta?')
    expect(faq).toContain('Escríbenos por WhatsApp')
  })
})
