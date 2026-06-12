import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CityPage.vue', import.meta.url)),
  'utf8',
)
// F2 extracted the hero into app/components/city/Hero.vue, so the #41 pin moved
// there with it. The positive pin assertions now read the hero source; CityPage
// keeps the negative guards (it must not re-inline a leaking button/title).
const hero = readFileSync(
  fileURLToPath(new URL('../city/Hero.vue', import.meta.url)),
  'utf8',
)

// Issue #41 — the copy-to-WhatsApp action on the pin is a SECRET operator
// feature. It must stay out of the hero <h1>'s accessible name (WCAG 2.5.3) and
// must not leak to customers via an aria-label or title tooltip. The pin is an
// inert, non-focusable, aria-hidden <span> (not a <button>).
describe('CityPage — copy-to-WhatsApp pin is an inert, customer-invisible operator control (issue #41)', () => {
  it('delegates the hero to CityHero (the pin lives there)', () => {
    expect(source).toMatch(/<CityHero\b/)
  })

  it('does not render the legacy clipboard UButton (neither page nor hero)', () => {
    expect(source).not.toMatch(/i-heroicons-clipboard-document/)
    expect(hero).not.toMatch(/i-heroicons-clipboard-document/)
  })

  it('does not wrap the pin in a <button> carrying the copy aria-label (it leaked into the <h1> accessible name)', () => {
    expect(hero).not.toMatch(/<button\b[^>]*aria-label="Copiar datos de búsqueda para WhatsApp"/)
  })

  it('does not expose the secret operator action via a title tooltip', () => {
    expect(hero).not.toMatch(/title="Copiar datos de búsqueda para WhatsApp"/)
  })

  it('wraps the LocationIcon in an aria-hidden <span> bound to copySearchToWhatsapp (inert decorative pin)', () => {
    const ariaHiddenSpan = /<span\b[^>]*aria-hidden="true"[^>]*@click="copySearchToWhatsapp"[^>]*>[\s\S]*?<LocationIcon\b[\s\S]*?\/>[\s\S]*?<\/span>/
    expect(hero).toMatch(ariaHiddenSpan)
  })

  it('keeps the useShareSearchParams binding so the handler is still wired', () => {
    expect(hero).toMatch(/copyToWhatsapp:\s*copySearchToWhatsapp\s*\}\s*=\s*useShareSearchParams\(\)/)
  })
})
