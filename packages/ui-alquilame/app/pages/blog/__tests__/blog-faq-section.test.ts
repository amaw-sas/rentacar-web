import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Blog post FAQ section + FAQPage schema.
 *
 * SCEN-FAQ-1: a post that carries `faq_items` renders a visible
 *   "Preguntas frecuentes" section built from `post.faqItems`.
 * SCEN-FAQ-2: the FAQPage schema is built from that SAME array (visible text
 *   and structured data can never diverge — declaring a question that is not
 *   on screen is a Google penalty vector), using the defineQuestion pattern
 *   the city FAQs already use (inLanguage/@id parity).
 * SCEN-FAQ-3: a post WITHOUT faq_items renders no section and emits no empty
 *   FAQPage node — both template and schema are gated on the same condition.
 */
describe('blog post FAQ section', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../[...slug].vue', import.meta.url)),
    'utf8',
  )

  it('SCEN-FAQ-1: renders a visible FAQ section gated on post.faqItems', () => {
    expect(src).toMatch(/v-if="post\.faqItems\?\.length"/)
    expect(src).toContain('Preguntas frecuentes')
    expect(src).toContain('faq.question')
    expect(src).toContain('faq.answer')
  })

  it('SCEN-FAQ-2: FAQPage schema is built from the same faqItems array via defineQuestion', () => {
    expect(src).toMatch(/defineQuestion/)
    expect(src).toMatch(/'@type':\s*'FAQPage'/)
    // Schema maps over post.faqItems — the same source the template renders.
    expect(src).toMatch(/faqItems\.map\(\s*\(faq, index\)\s*=>\s*defineQuestion\(/)
    expect(src).toMatch(/name:\s*faq\.question/)
    expect(src).toMatch(/acceptedAnswer:\s*faq\.answer/)
  })

  it('SCEN-FAQ-3: schema emission is conditional — no empty FAQPage node', () => {
    expect(src).toMatch(/if\s*\(post\.value\.faqItems\?\.length\)/)
  })
})
