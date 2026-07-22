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

  it('no longer renders the pin at all — it was removed from the hero', () => {
    // Requested removal. The pin was an aria-hidden <span> inside the <h1>, so
    // nothing announced by assistive tech changes; what DID go with it is the
    // operator-only copy-the-search-to-WhatsApp shortcut it carried.
    expect(hero).not.toMatch(/<LocationIcon\b/)
    expect(hero).not.toMatch(/@click="copySearchToWhatsapp"/)
  })

  it('drops the now-dead useShareSearchParams binding with it', () => {
    // Keeping the handler wired to nothing would read as "this still works".
    expect(hero).not.toMatch(/useShareSearchParams\(\)/)
    expect(hero).not.toMatch(/copySearchToWhatsapp/)
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

/**
 * City pages gain the three marketing blocks the home already had and the
 * reference design also puts on its city landings:
 *   - the stats band,
 *   - "¿Por qué alquilar con …?" — titled WITH the city, as the reference does,
 *     so the heading targets the city query rather than repeating the home's;
 *   - Empresas Aliadas.
 * All three sit behind the same SSR-stable `mode !== 'results'` gate as the rest
 * of the generic marketing: a results page is a search view, not a brochure.
 * Order mirrors the home — HowItWorks → Stats → ¿Por qué? — and Partners closes
 * the page, again like the home.
 */
describe('CityPage — home marketing blocks added to city landings', () => {
  const vIf = (tag: string): string | null => {
    const open = new RegExp(`<${tag}\\b[^>]*>`).exec(source)
    if (!open) return null
    const m = /v-if="([^"]+)"/.exec(open[0])
    return m ? m[1] : null
  }
  const at = (tag: string) => source.indexOf(`<${tag}`)

  it('mounts the stats band, the why-rent block and the partners row', () => {
    expect(source).toMatch(/<HomeStats\b/)
    expect(source).toMatch(/<HomeValueProps\b/)
    expect(source).toMatch(/<HomePartners\b/)
  })

  it('gates all three on the SSR-stable results mode, like the rest of the marketing', () => {
    for (const tag of ['HomeStats', 'HomeValueProps', 'HomePartners']) {
      expect(vIf(tag), `${tag} must carry a v-if`).not.toBeNull()
      expect(vIf(tag)!).toMatch(/mode\s*!==\s*['"]results['"]/)
    }
  })

  it('orders them like the home: HowItWorks → Stats → ¿Por qué?, Partners last', () => {
    expect(at('HomeStats')).toBeGreaterThan(at('HomeHowItWorks'))
    expect(at('HomeValueProps')).toBeGreaterThan(at('HomeStats'))
    expect(at('HomePartners')).toBeGreaterThan(at('HomeContact'))
  })

  it('passes the city through so the why-rent heading names it', () => {
    expect(source).toMatch(/<HomeValueProps[^>]*:city="city"/)
  })
})

describe('ValueProps — heading names the city when given one', () => {
  const valueProps = readFileSync(
    fileURLToPath(new URL('../home/ValueProps.vue', import.meta.url)),
    'utf8',
  )

  it('accepts an optional city and appends it to the headline', () => {
    // Reference: "¿Por qué alquilar con Alquilame en Bogotá?" on a city landing,
    // "¿Por qué alquilar con Alquilame?" on the home.
    expect(valueProps).toMatch(/city\?:\s*City|city\?:/)
    expect(valueProps).toMatch(/en \$\{|\ben\b/)
  })

  it('still derives the brand from config, never a literal', () => {
    expect(valueProps).toMatch(/organization\.brand/)
    expect(valueProps).not.toContain('alquilar con Alquilame')
  })
})
