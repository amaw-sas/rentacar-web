/**
 * FAQ redesign (issue #210 follow-up) — city/Faq.vue.
 *
 * Editorial 2-column restyle of the city #faqs section, mirroring home/Faq.vue
 * but KEEPING the city-specific data + city-targeted heading. Static-source
 * assertions encoding the OBSERVABLE contract; full visual/runtime check in the
 * browser (dev server).
 *
 * New layout invariants (SCEN-1): two-column grid, sticky left rail, brand
 * gradient CTA, AA WhatsApp pill, lucide icons, rounded-2xl cards.
 *
 * Preserved invariants (must NOT regress — also guarded by faq-testimonios.test.ts):
 *   - accordion sources useCityFAQs(props.city.name), NOT useData().faqs.
 *   - heading keeps a .heading-* utility + the city name (city-targeted SEO).
 *   - FAQPage schema NOT inlined (stays in useCityPageSEO).
 *   - v4 bg-linear-to-* gradient, never the v3 alias.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('FAQ redesign — city/Faq.vue', () => {
  const faq = read('app/components/city/Faq.vue')

  it('lays out the section in a two-column grid (left rail + accordion)', () => {
    expect(faq).toMatch(/id="faqs"/)
    expect(faq).toMatch(/lg:grid-cols-5/)
    expect(faq).toMatch(/lg:col-span-2/)
    expect(faq).toMatch(/lg:col-span-3/)
  })

  it('makes the left intro rail sticky on desktop', () => {
    expect(faq).toMatch(/lg:sticky/)
  })

  it('renders the WhatsApp CTA as a brand-gradient card with an AA green pill (black text)', () => {
    // Token --color-whatsapp (#25D366) + BLACK text = 10.6:1 (AA; issue #284).
    // white text on this bright green would fail (~2:1). Heading stays gray-900
    // because white on the orange gradient fails AA (theme.css caveat).
    expect(faq).toMatch(/bg-linear-to-br\s+from-hero-from\s+to-hero-to/)
    expect(faq).toMatch(/\bbg-whatsapp\b/)
    expect(faq).toMatch(/text-black/)
    expect(faq).toMatch(/text-gray-900/)
    expect(faq).not.toMatch(/bg-\[#090\]/)
    expect(faq).toMatch(/:href="franchise\.whatsapp"/)
  })

  it('uses lucide icons + rounded-2xl accordion cards (reskin language)', () => {
    expect(faq).toMatch(/i-lucide-help-circle/)
    expect(faq).toMatch(/i-lucide-message-circle/)
    expect(faq).toMatch(/rounded-2xl/)
    expect(faq).toMatch(/border-gray-200/)
  })

  // --- Preserved data/SEO invariants (mirror of faq-testimonios.test.ts) ---

  it('sources the accordion from useCityFAQs(city.name) — city-specific', () => {
    expect(faq).toMatch(/useCityFAQs\(\s*props\.city\.name\s*\)/)
    expect(faq).toMatch(/:items="cityFAQs"/)
  })

  it('does NOT fall back to the brand-level useData().faqs (would regress city SEO)', () => {
    expect(faq).not.toMatch(/useData\(\)/)
  })

  it('keeps a .heading-* utility + the city name in the heading (city-targeted)', () => {
    expect(faq).toMatch(/heading-(section|card|hero)/)
    expect(faq).toMatch(/city\?\.name/)
  })

  it('does NOT inline the FAQPage schema (stays in useCityPageSEO)', () => {
    expect(faq).not.toMatch(/FAQPage/)
    expect(faq).not.toMatch(/useSchemaOrg/)
    expect(faq).not.toMatch(/defineQuestion/)
  })

  it('renders the gradient via the v4 bg-linear-to-* utility, not the v3 alias', () => {
    expect(faq).toMatch(/bg-linear-to-[a-z]/)
    expect(faq).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('keeps the human copy verbatim (no text changes)', () => {
    expect(faq).toContain('Preguntas frecuentes sobre alquiler en')
    expect(faq).toContain('¿Tienes otra pregunta?')
    expect(faq).toContain('Escríbenos por WhatsApp')
  })
})
