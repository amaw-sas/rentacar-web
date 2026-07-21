/**
 * Fleet golden-parity contract (issue #112, alquilame home parity).
 *
 * Static-source assertions over Fleet.vue (mirrors tests/f0-chrome.test.ts):
 * the runtime/visual check (real price in the rendered card, modal open, toggle
 * switching grids) is deferred to the preview/dogfood pass. Here we pin the
 * golden contract from docs/specs/alquilame-home-parity/golden-sections/02-fleet.html:
 *   - 6 cards mapped to the 6 real category codes C/F/FX/G4/GC/LE.
 *   - golden copy: category titles + transmission + example + descriptions.
 *   - a Diario/Mensualidad toggle drives which price is shown.
 *   - both prices derive from the SAME low-season 1.000 km monthly floor
 *     (lowSeasonMonthly1k), with the daily figure prorated over 30 days
 *     (lowSeasonDailyFrom30) — real, never hardcoded, never one_day_price.
 *   - fail-soft: each price block is omitted (v-if) when its value is undefined.
 *   - gradient uses bg-linear-* (F0 lesson), never bg-gradient-to-*.
 *   - headings use the font-heading family (Plus Jakarta, F0-03).
 *   - the engine flow is preserved: no modal — the CTA "Cotizar mis fechas"
 *     redirects to /reservas, in BRAND RED (bg-brand-600), never green.
 *   - card typography is a small closed system: 4 sizes / 3 weights / 4 colors.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FLEET = readFileSync(
  join(__dirname, '..', 'Fleet.vue'),
  'utf-8',
)

describe('Fleet — 6 cards mapped to real category codes', () => {
  it('declares the 6 category codes C/F/FX/G4/GC/LE', () => {
    for (const code of ['C', 'F', 'FX', 'G4', 'GC', 'LE']) {
      expect(FLEET).toMatch(new RegExp(`code:\\s*'${code}'`))
    }
  })

  it('uses the golden card titles and transmissions', () => {
    expect(FLEET).toContain('Compacto')
    expect(FLEET).toContain('Sedán')
    expect(FLEET).toContain('Camioneta')
    expect(FLEET).toContain('Camioneta Premium')
    expect(FLEET).toContain('Mecánica')
    expect(FLEET).toContain('Automática')
  })

  it('uses the golden example/description copy', () => {
    expect(FLEET).toContain('Kia Picanto / Suzuki S-Presso')
    expect(FLEET).toContain('Ágil en el tráfico y fácil de parquear. Perfecto para moverte por la ciudad.')
    expect(FLEET).toContain('Máximo confort e imagen para viajes de trabajo y ocasiones especiales.')
  })

  it('points each card at a real /images/vehicles/*.jpg asset', () => {
    for (const asset of [
      'economico.jpg', 'sedan.jpg', 'sedan-automatico.jpg',
      'camioneta.jpg', 'camioneta-full.jpg', 'premium.jpg',
    ]) {
      expect(FLEET).toContain(`/images/vehicles/${asset}`)
    }
  })
})

describe('Fleet — Diario/Mensualidad toggle', () => {
  it('keeps a reactive plan ref with both options', () => {
    expect(FLEET).toMatch(/plan\s*=\s*ref<Plan>\('daily'\)/)
    expect(FLEET).toContain('Alquiler Diario')
    expect(FLEET).toContain('Mensualidad')
  })

  it('switches the plan on click', () => {
    expect(FLEET).toMatch(/@click="plan = 'daily'"/)
    expect(FLEET).toMatch(/@click="plan = 'monthly'"/)
  })
})

describe('Fleet — real prices + fail-soft', () => {
  it('derives the daily price from the 30-day low-season rate, never one_day_price', () => {
    // "Alquiler Diario" advertises a 30-day rental, so it is the low-season
    // 1.000 km monthly floor prorated over 30 days — NOT the standalone
    // one_day_price column, which is a different (much higher) product.
    expect(FLEET).toContain('lowSeasonDailyFrom30')
    expect(FLEET).toMatch(/categories\.find\(\s*\(?c\)?\s*=>\s*c\.id\s*===\s*category\.code\s*\)/)
    expect(FLEET).toContain('month_prices')
    expect(FLEET).toMatch(/dailyPrice:\s*lowSeasonDailyFrom30\(/)
    // Never READ from the one_day_price column (the name may still appear in a
    // comment explaining precisely why it is not used).
    expect(FLEET).not.toMatch(/[.[]\s*'?one_day_price/)
  })

  it('reads the monthly price from the shared low-season 1.000 km picker', () => {
    expect(FLEET).toContain('lowSeasonMonthly1k')
    // Both figures come from the same shared util, not from a local re-derivation.
    expect(FLEET).toMatch(
      /import\s*\{[^}]*lowSeasonMonthly1k[^}]*\}\s*from\s*'@rentacar-main\/logic\/utils'/,
    )
  })

  it('formats COP via moneyFormat — bare daily figure, /mes on the monthly one', () => {
    // The daily figure carries no "/día" suffix: the label above it already says
    // "Precio x día en alquiler de 30 días", which is the honest framing.
    expect(FLEET).toContain('useMoneyFormat')
    expect(FLEET).toMatch(/\$\{\{\s*moneyFormat\(card\.dailyPrice\)\s*\}\}/)
    expect(FLEET).not.toMatch(/moneyFormat\(card\.dailyPrice\)\s*\}\}\/día/)
    expect(FLEET).toContain('Precio x día en alquiler de 30 días')
    expect(FLEET).toMatch(/\$\{\{\s*moneyFormat\(card\.monthlyPrice\)\s*\}\}\/mes/)
  })

  it('hides each price when undefined — never $0 nor fabricated (fail-soft)', () => {
    expect(FLEET).toMatch(/card\.dailyPrice\s*!==\s*undefined/)
    expect(FLEET).toMatch(/card\.monthlyPrice\s*!==\s*undefined/)
    expect(FLEET).not.toMatch(/dailyPrice[^\n]*\?\?\s*0/)
    expect(FLEET).not.toMatch(/monthlyPrice[^\n]*\?\?\s*0/)
  })
})

describe('Fleet — engine flow (redirect to /reservas)', () => {
  it('redirects to /reservas instead of opening a branch modal', () => {
    expect(FLEET).not.toMatch(/<UModal[\s>]/)
    expect(FLEET).not.toContain('LazyUModal')
    expect(FLEET).not.toContain('SelectBranch')
    expect(FLEET).toContain("navigateTo('/reservas')")
  })

  it('preselects a branch of the current city when on a city page', () => {
    // On a city page the redirect resolves a branch from route.params.city via
    // the shared searchBranchByCity helper, so /reservas opens with the pickup
    // branch preset (no auto-search). On the home there is no city → clean /reservas.
    expect(FLEET).toContain('route.params.city')
    expect(FLEET).toContain('searchBranchByCity')
  })

  it('keeps the "Cotizar mis fechas" CTA in BRAND RED, never green', () => {
    // The copy invites quoting ANY duration because the shown daily figure is a
    // 30-day rate; 1-29 days price differently.
    expect(FLEET).toContain('Cotizar mis fechas')
    expect(FLEET).toMatch(/bg-brand-600\s+hover:bg-brand-700/)
    expect(FLEET).not.toMatch(/bg-green-/)
  })
})

describe('Fleet — F0 styling lessons', () => {
  it('uses bg-linear-* for gradients, never the v3 bg-gradient-to- alias', () => {
    expect(FLEET).toMatch(/bg-linear-to-/)
    expect(FLEET).not.toContain('bg-gradient-to-')
  })

  it('headings adopt the font-heading family (Plus Jakarta, F0-03)', () => {
    expect(FLEET).toMatch(/font-heading/)
  })

  it('the brand accent bar and price use the brand token, not raw red-600', () => {
    expect(FLEET).toContain('bg-brand-600')
    expect(FLEET).toContain('text-brand-600')
  })
})

/**
 * Card typography is a CLOSED system — the card previously mixed 5 weights,
 * 2 support grays and 4 sizes, which read as visual noise:
 *   sizes   → text-2xl (price) / text-lg (title) / text-sm (body, specs) /
 *             text-xs (meta labels). Nothing else.
 *   weights → bold (title, price, CTA) / medium (labels) / normal (rest).
 *             No extrabold, no semibold.
 *   colors  → gray-900 (title) / gray-600 (ALL support copy) /
 *             brand-600 (price) / emerald-600 (single accent, "IVA incluido").
 * Scoped to the card body only: the section heading and the Diario/Mensualidad
 * toggle are section chrome and keep their own (heavier) scale on purpose.
 */
/**
 * Card surface — the "matte frame" treatment ported from the Astro design's
 * `framed` + `tinted` FleetShowcase variant:
 *   - the SECTION sits on a soft tint (surface-soft, #EDF0F5) instead of white,
 *     so the cards read as objects laid on a surface rather than boxes drawn on
 *     a page;
 *   - each CARD is a lighter panel (surface-softest, #F8F9FC) wrapped in a thick
 *     white border, which is what produces the "matte frame" look.
 * Both colors come from @theme tokens, never raw hex — the brand scale is the
 * single source of truth.
 */
describe('Fleet — framed cards on a tinted section', () => {
  it('puts the section on the soft tint token, not white', () => {
    const section = FLEET.match(/<section id="fleet"[^>]*class="([^"]+)"/)
    expect(section, 'fleet section not found').not.toBeNull()
    expect(section![1]).toMatch(/\bbg-surface-soft\b/)
    expect(section![1]).not.toMatch(/\bbg-white\b/)
  })

  it('frames each card with a thick white border over the lightest surface', () => {
    const card = FLEET.match(/v-for="card in cards"[\s\S]{0,120}?class="([^"]+)"/)
    expect(card, 'fleet card root not found').not.toBeNull()
    expect(card![1]).toMatch(/\bbg-surface-softest\b/)
    expect(card![1]).toMatch(/\bborder-\[7px\]/)
    expect(card![1]).toMatch(/\bborder-white\b/)
    expect(card![1]).not.toMatch(/\bborder-gray-200\b/)
  })

  it('uses brand @theme tokens for both surfaces, never raw hex', () => {
    expect(FLEET).not.toMatch(/bg-\[#[0-9a-fA-F]{6}\]/)
  })
})

describe('Fleet — card typography system', () => {
  // The card body: from the category <h3> to the CTA label. lastIndexOf on the
  // CTA because the copy is also quoted in the file's top docblock.
  const start = FLEET.indexOf('<h3 class="text-lg')
  const end = FLEET.lastIndexOf('Cotizar mis fechas')
  const CARD = FLEET.slice(start, end)

  it('extracts a non-empty card body slice (guards the slice itself)', () => {
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
  })

  it('uses a single support gray — gray-500 is gone from the card', () => {
    expect(CARD).not.toMatch(/\btext-gray-500\b/)
    expect(CARD).toMatch(/\btext-gray-600\b/)
    expect(CARD).toMatch(/\btext-gray-900\b/)
  })

  it('uses only bold / medium / normal — no extrabold, no semibold', () => {
    expect(CARD).not.toMatch(/\bfont-extrabold\b/)
    expect(CARD).not.toMatch(/\bfont-semibold\b/)
  })

  it('uses only the 4 sizes text-2xl / text-lg / text-sm / text-xs', () => {
    const allowed = new Set(['text-2xl', 'text-lg', 'text-sm', 'text-xs'])
    const sizes = CARD.match(/\btext-(xs|sm|base|lg|xl|\dxl)\b/g) ?? []
    const rogue = [...new Set(sizes)].filter((s) => !allowed.has(s))
    expect(rogue, `unexpected size utilities in the card: ${rogue.join(', ')}`).toEqual([])
  })

  it('keeps the price as the loudest element: 2xl + bold + brand red', () => {
    expect(CARD).toMatch(/text-2xl\s+font-bold\s+font-heading\s+text-brand-600/)
  })

  it('drops UPPERCASE on the CTA — sentence case reads as a phrase, not a shout', () => {
    const cta = FLEET.match(/<UButton[\s\S]*?<\/UButton>/)
    expect(cta, 'fleet CTA button not found').not.toBeNull()
    expect(cta![0]).not.toMatch(/\buppercase\b/)
    expect(cta![0]).toContain('Cotizar mis fechas')
  })

  it('keeps "IVA incluido" as the only non-brand accent color', () => {
    expect(CARD).toMatch(/text-xs\s+font-medium\s+text-emerald-600">IVA incluido/)
    const colors = CARD.match(/\btext-(emerald|green|blue|amber|yellow|purple|pink)-\d{3}\b/g) ?? []
    expect([...new Set(colors)]).toEqual(['text-emerald-600'])
  })
})
