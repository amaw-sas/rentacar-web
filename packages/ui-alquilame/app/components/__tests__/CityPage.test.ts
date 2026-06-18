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

// SCEN-001 (docs/specs/alquilame-reserva-ux/scenarios/reserva-results-consistency.scenarios.md)
// On a RESULTS page with an active search the generic home marketing
// ("Nuestra Flota" = HomeFleet, plus HowItWorks/Requirements) must NOT render;
// the results block (#seleccion-categorias) must render; the city-specific SEO
// sections (Intro/SeoContent/DeliveryPoints/Testimonios/FAQ) + HomeContact stay.
// On a LANDING page (no active search) HomeFleet MUST still appear.
//
// Static-source contract (mirrors the rest of this suite): the gate is a single
// computed `resultsActive` reused by the engine block AND the marketing v-if, so
// "results active in results mode" hides marketing and "landing" never hides it.
describe('CityPage — generic home marketing is gated off on active results (SCEN-001)', () => {
  // helper: capture the v-if expression on a tag (handles attrs before/after)
  const vIfOn = (src: string, tag: string): string | null => {
    const open = new RegExp(`<${tag}\\b[^>]*>`).exec(src)
    if (!open) return null
    const m = /v-if="([^"]+)"/.exec(open[0])
    return m ? m[1] : null
  }

  it('defines a single resultsActive gate (pending || filteredCategories.length || error)', () => {
    expect(source).toMatch(
      /const resultsActive\s*=\s*computed\([\s\S]*?pendingSearch[\s\S]*?filteredCategories\.value\.length[\s\S]*?searchError[\s\S]*?\)/,
    )
  })

  it('keeps the engine result block (#seleccion-categorias) gated by resultsActive', () => {
    const block = /<UPageSection[^>]*id="seleccion-categorias"[\s\S]*?v-if="resultsActive"/.test(source)
      || /id="seleccion-categorias"[^>]*v-if="resultsActive"/.test(source)
      || /v-if="resultsActive"[^>]*id="seleccion-categorias"/.test(source)
    expect(block).toBe(true)
  })

  it('hides HomeFleet ("Nuestra Flota") when on a results page with an active search', () => {
    const expr = vIfOn(source, 'HomeFleet')
    expect(expr).not.toBeNull()
    // SSR-stable marketing gate: hidden whenever in results mode, shown otherwise.
    // Gated by the `mode` prop (known at SSR) — NOT the onMounted search state —
    // so marketing never paints on a results page and then vanishes on hydration.
    expect(expr).toMatch(/mode\s*!==\s*['"]results['"]/)
  })

  it('hides HomeHowItWorks and HomeRequirements under the same results gate', () => {
    for (const tag of ['HomeHowItWorks', 'HomeRequirements']) {
      const expr = vIfOn(source, tag)
      expect(expr, `${tag} must carry the marketing gate`).not.toBeNull()
      expect(expr).toMatch(/mode\s*!==\s*['"]results['"]/)
    }
  })

  it('does NOT gate the city-specific SEO sections nor HomeContact (always rendered)', () => {
    for (const tag of [
      'CityIntro',
      'CitySeoContent',
      'CityDeliveryPoints',
      'CityTestimonios',
      'CityFaq',
      'HomeContact',
    ]) {
      expect(vIfOn(source, tag), `${tag} must not be hidden by the marketing gate`).toBeNull()
    }
  })

  it('landing mode never hides marketing: the gate is mode-conditional, not unconditional', () => {
    // The marketing v-if is `mode !== 'results'`, so in landing mode it always
    // evaluates true — marketing (HomeFleet) is never hidden on a landing page.
    const expr = vIfOn(source, 'HomeFleet') ?? ''
    expect(expr).toMatch(/mode\s*!==\s*['"]results['"]/)
  })
})
