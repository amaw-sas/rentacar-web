/**
 * /reservas (alquicarros) — WIZARD de reserva acompañada + invariantes F3.
 *
 * El wizard (docs/specs/2026-07-01-alquicarros-reservation-wizard-*) reemplaza la
 * estructura F3 anterior de /reservas: el hero+Searcher y el grid de resultados se
 * reorganizan en un stepper de 5 pasos. Los OBSERVABLES de SCEN-F3-05/06 se
 * preservan (Searcher monta, la búsqueda se dispara desde el query, /reservas
 * limpia es indexable, el estado de resultados es noindex,follow) — solo cambia
 * DÓNDE viven en el source. Este archivo REAPUNTA cada aserción de invariante
 * preservado al nuevo source (StepSearch.vue / ReservationWizard.vue) sin
 * debilitarla — sancionado por SCEN-F3-15 ("reapuntar al nuevo source sin debilitar
 * la aserción"). La única aserción superseded (el grid #seleccion-categorias →
 * CategorySelectionSection) se reemplaza por "la página monta el wizard", el cambio
 * de diseño aprobado; a cambio se AÑADEN aserciones de la composición del wizard.
 *
 * Style: static-source assertions (igual que city/__tests__/Hero.test.ts).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// El alias v3 roto, ensamblado por fragmentos para que este guard no contenga él
// mismo el literal que un grep global prohíbe en el markup renderizado.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

const page = read('app/pages/reservas/index.vue')
const stepSearch = read('app/components/wizard/steps/StepSearch.vue')
const shell = read('app/components/wizard/ReservationWizard.vue')

describe('/reservas — Paso 1 hero + gradient (StepSearch.vue)', () => {
  it('renders the brand gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(stepSearch).toMatch(/bg-linear-to-[a-z]/)
    expect(stepSearch).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('uses the hero-from / hero-to brand gradient tokens', () => {
    expect(stepSearch).toMatch(/from-hero-from\s+to-hero-to/)
  })

  it('sets [--ctx-text-primary:#fff] so .heading-* headings render white on the orange hero', () => {
    expect(stepSearch).toMatch(/\[--ctx-text-primary:#fff\]/)
  })

  it('adopts a prominent .heading-* utility for the headline h1', () => {
    // Design-tier detail (heading-page here); the observable is a prominent
    // white-on-orange branded headline, preserved.
    expect(stepSearch).toMatch(/<h1[^>]*heading-(hero|page)/)
  })

  it('renders a search-focused headline', () => {
    expect(stepSearch).toMatch(/necesitas tu carro/)
  })
})

describe('/reservas — Searcher engine + #109 CLS guard (StepSearch.vue)', () => {
  it('mounts the <Searcher> engine (same component → same data-testid)', () => {
    expect(stepSearch).toMatch(/<Searcher\b/)
  })

  it('imports the engine from the shared Searcher.vue component, not reimplemented', () => {
    expect(stepSearch).toMatch(/import\(['"][^'"]*Searcher\.vue['"]\)/)
  })

  it('wraps the Searcher in <ClientOnly> with a fixed-height fallback (no hydration shift, #109)', () => {
    expect(stepSearch).toMatch(/<ClientOnly>/)
    expect(stepSearch).toMatch(/<PlaceholdersSearcher\b/)
    expect(stepSearch).toMatch(/h-\[\d+px\]/)
  })

  it('reserves the engine footprint with explicit fixed heights (desktop + mobile)', () => {
    expect(stepSearch).toMatch(/h-\[410px\]/)
    expect(stepSearch).toMatch(/h-\[360px\]/)
  })

  it('does NOT bake Date/today() into the SSR/ISR markup (#109)', () => {
    expect(stepSearch).not.toMatch(/new Date\b/)
    expect(stepSearch).not.toMatch(/\btoday\(/)
  })

  it('keeps an in-page #hero anchor for the HomeContact reserve CTA', () => {
    expect(stepSearch).toMatch(/id="hero"/)
    expect(page).toMatch(/reserve-anchor="#hero"/)
  })
})

describe('/reservas — reuses the F1 trust sections (page)', () => {
  it('mounts HomeHowItWorks', () => {
    expect(page).toMatch(/<HomeHowItWorks\b/)
  })
  it('mounts HomeRequirements', () => {
    expect(page).toMatch(/<HomeRequirements\b/)
  })
  it('mounts HomeStats', () => {
    expect(page).toMatch(/<HomeStats\b/)
  })
  it('mounts HomeContact', () => {
    expect(page).toMatch(/<HomeContact\b/)
  })
})

describe('/reservas — wizard shell composition (stepper + summary + step)', () => {
  it('the page mounts the <ReservationWizard> (replaces the old inline grid)', () => {
    expect(page).toMatch(/<ReservationWizard\b/)
    // El grid F3 antiguo queda superseded por el wizard.
    expect(page).not.toMatch(/<CategorySelectionSection\b/)
  })

  it('renders the step bar (WizardStepper) and the persistent summary (WizardSummary)', () => {
    expect(shell).toMatch(/<WizardStepper\b/)
    expect(shell).toMatch(/<WizardSummary\b/)
  })

  it('mounts the search step (StepSearch) for Paso 1', () => {
    expect(shell).toMatch(/<WizardStepsStepSearch\b/)
  })
})

describe('/reservas — wizard drives search from the query string', () => {
  it('the wizard shell calls the query-param search driver, not the route-param one', () => {
    expect(shell).toMatch(/useSearchByQueryParams\(\)/)
    expect(shell).not.toMatch(/useSearchByRouteParams\(/)
  })

  it('the wizard shell derives the step from the route (SSR-stable), not a grid gate', () => {
    expect(shell).toMatch(/useReservationWizard/)
    expect(shell).toMatch(/deriveStepFromRoute|currentStep/)
  })
})

describe('/reservas — trust marketing hides on a results query (SSR-stable gate, page)', () => {
  it('derives a results-query flag from route.query.lugar_recogida (SSR-stable)', () => {
    expect(page).toMatch(/route\.query\.lugar_recogida/)
  })

  it('gates HomeHowItWorks / HomeRequirements / HomeStats with v-if (hidden on a results query)', () => {
    expect(page).toMatch(/<HomeHowItWorks\b[^>]*v-if=/)
    expect(page).toMatch(/<HomeRequirements\b[^>]*v-if=/)
    expect(page).toMatch(/<HomeStats\b[^>]*v-if=/)
  })

  it('keeps HomeContact unconditionally rendered (no v-if gate)', () => {
    expect(page).toMatch(/<HomeContact\b(?:(?!v-if)[^>])*reserve-anchor/)
  })
})

describe('/reservas — robots noindex,follow only on a results query (page)', () => {
  it('emits noindex, follow when a results query is present', () => {
    expect(page).toMatch(/noindex,\s*follow/)
  })

  it('makes the robots value conditional on the query presence (computed/ternary on route.query)', () => {
    expect(page).toMatch(
      /route\.query\.lugar_recogida[\s\S]{0,80}?noindex|noindex[\s\S]{0,80}?route\.query\.lugar_recogida/,
    )
  })
})

describe('/reservas — SEO without city schema (SCEN-F3-08, page)', () => {
  it('sets its own SEO (useBaseSEO + useSeoMeta + canonical)', () => {
    expect(page).toMatch(/useBaseSEO\(\)/)
    expect(page).toMatch(/useSeoMeta\(/)
    expect(page).toMatch(/rel:\s*['"]canonical['"]/)
  })

  it('does NOT emit the city Product/FAQPage schemas', () => {
    expect(page).not.toMatch(/useCityProductSchema/)
    expect(page).not.toMatch(/useCityFAQSchema/)
    expect(page).not.toMatch(/['"]FAQPage['"]/)
    expect(page).not.toMatch(/['"]Product['"]/)
  })
})
