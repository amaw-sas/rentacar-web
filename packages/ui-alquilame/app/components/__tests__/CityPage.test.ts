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
// updated by SCEN-322-X06: the results block (#seleccion-categorias +
// CategorySelectionSection + the resultsActive gate) was DEAD CODE in alquilame —
// buscar-vehiculos no longer exists here (routing independence) and the only
// CityPage consumer is pages/[city]/index.vue with mode="landing". The engine
// block is gone (city landings must not download the reservation engine); the
// SSR-stable marketing gates on `mode` remain because CityHero and HomeContact
// still consume the prop.
describe('CityPage — generic home marketing is gated off on active results (SCEN-001)', () => {
  // helper: capture the v-if expression on a tag (handles attrs before/after)
  const vIfOn = (src: string, tag: string): string | null => {
    const open = new RegExp(`<${tag}\\b[^>]*>`).exec(src)
    if (!open) return null
    const m = /v-if="([^"]+)"/.exec(open[0])
    return m ? m[1] : null
  }

  // SCEN-322-X06: the dead results engine must stay out of the landing chunk.
  it('does not render nor statically import the reservation engine (dead results branch removed)', () => {
    expect(source).not.toMatch(/CategorySelectionSection/)
    expect(source).not.toMatch(/id="seleccion-categorias"/)
    expect(source).not.toMatch(/resultsActive/)
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

  // BUG (stale-results leak, historical): resultsActive was store-only and a
  // populated Pinia singleton leaked the results block onto a landing /[city].
  // SCEN-322-X06 removed the whole results block, which closes that leak for
  // good: with no engine block in the source there is nothing a stale store can
  // reveal. Guarded by the dead-code assertion above (no resultsActive, no
  // #seleccion-categorias, no CategorySelectionSection).
  it('landing cannot leak stale search state: no store-driven results wiring remains', () => {
    expect(source).not.toMatch(/useStoreSearchData/)
    expect(source).not.toMatch(/filteredCategories/)
  })
})
