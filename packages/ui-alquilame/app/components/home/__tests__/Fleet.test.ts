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
 *   - daily price from pickRepresentativeDailyPrice (real, not hardcoded);
 *     monthly price from a representative monthly picker (real, not hardcoded).
 *   - fail-soft: each price block is omitted (v-if) when its value is undefined.
 *   - gradient uses bg-linear-* (F0 lesson), never bg-gradient-to-*.
 *   - headings use the font-heading family (Plus Jakarta, F0-03).
 *   - the engine flow is preserved: SelectBranch inside a modal, "Ver
 *     disponibilidad" CTA — now in BRAND RED (bg-brand-600), never green.
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
  it('reads the daily price from pickRepresentativeDailyPrice (real, not hardcoded)', () => {
    expect(FLEET).toContain('pickRepresentativeDailyPrice')
    expect(FLEET).toMatch(/categories\.find\(\s*\(?c\)?\s*=>\s*c\.id\s*===\s*category\.code\s*\)/)
    expect(FLEET).toContain('month_prices')
    expect(FLEET).toContain('one_day_price')
  })

  it('reads the monthly price from a representative monthly picker (real, not hardcoded)', () => {
    expect(FLEET).toContain('pickRepresentativeMonthlyPrice')
    expect(FLEET).toContain("'1k_kms'")
  })

  it('formats COP via moneyFormat with the /día and /mes suffixes', () => {
    expect(FLEET).toContain('useMoneyFormat')
    expect(FLEET).toMatch(/\$\{\{\s*moneyFormat\(card\.dailyPrice\)\s*\}\}\/día/)
    expect(FLEET).toMatch(/\$\{\{\s*moneyFormat\(card\.monthlyPrice\)\s*\}\}\/mes/)
  })

  it('hides each price when undefined — never $0 nor fabricated (fail-soft)', () => {
    expect(FLEET).toMatch(/card\.dailyPrice\s*!==\s*undefined/)
    expect(FLEET).toMatch(/card\.monthlyPrice\s*!==\s*undefined/)
    expect(FLEET).not.toMatch(/dailyPrice[^\n]*\?\?\s*0/)
    expect(FLEET).not.toMatch(/monthlyPrice[^\n]*\?\?\s*0/)
  })
})

describe('Fleet — engine flow preserved', () => {
  it('mounts SelectBranch (variant="gray") inside a lazy modal', () => {
    expect(FLEET).not.toMatch(/<UModal[\s>]/)
    expect(FLEET).toContain('LazyUModal')
    expect(FLEET).toContain('<SelectBranch variant="gray" />')
  })

  it('keeps the "Ver disponibilidad" CTA in BRAND RED, never green', () => {
    expect(FLEET).toContain('Ver disponibilidad')
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
