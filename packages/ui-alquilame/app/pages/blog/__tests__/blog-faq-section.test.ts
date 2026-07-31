import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pages = {
  alquilame: readFileSync(
    fileURLToPath(new URL('../[...slug].vue', import.meta.url)),
    'utf8',
  ),
  alquilatucarro: readFileSync(
    fileURLToPath(new URL('../../../../../ui-alquilatucarro/app/pages/blog/[...slug].vue', import.meta.url)),
    'utf8',
  ),
  alquicarros: readFileSync(
    fileURLToPath(new URL('../../../../../ui-alquicarros/app/pages/blog/[...slug].vue', import.meta.url)),
    'utf8',
  ),
}

describe('blog post FAQ content without retired FAQPage markup', () => {
  const src = pages.alquilame

  it('SCEN-FAQ-1: renders a visible FAQ section gated on post.faqItems', () => {
    expect(src).toMatch(/v-if="post\.faqItems\?\.length"/)
    expect(src).toContain('Preguntas frecuentes')
    expect(src).toContain('faq.question')
    expect(src).toContain('faq.answer')
  })

  it.each(Object.entries(pages))(
    'SCEN-FAQ-2: %s emits no retired FAQPage schema',
    (_brand, page) => {
      expect(page).not.toMatch(/FAQPage/)
      expect(page).toMatch(/BlogPosting/)
      expect(page).toMatch(/BreadcrumbList/)
    },
  )

  it('SCEN-FAQ-3: keeps visible questions sourced from post.faqItems', () => {
    expect(src).toMatch(/v-for="faq in post\.faqItems"/)
    expect(src).toMatch(/\{\{ faq\.question \}\}/)
    expect(src).toMatch(/\{\{ faq\.answer \}\}/)
  })
})
