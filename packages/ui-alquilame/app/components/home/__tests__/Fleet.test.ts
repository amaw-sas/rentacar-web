/**
 * F1 step 2 — Fleet con precio "Desde $X/día" real (issue #112, SCEN-F1-02).
 *
 * Static-source assertions over Fleet.vue (mirrors tests/f0-chrome.test.ts):
 * the runtime/visual check (real price in the rendered card, modal open) is
 * deferred to the preview pass. Here we pin the contract:
 *   - 4 representative category codes (C/FX/GC/LE) present.
 *   - price comes from pickRepresentativeDailyPrice (real, not hardcoded).
 *   - fail-soft branch exists: price is omitted (v-if) when undefined.
 *   - gradient uses bg-linear-* (F0 lesson), never bg-gradient-to-*.
 *   - headings use a .heading-* utility (Plus Jakarta, F0-03).
 *   - the engine flow is preserved: SelectBranch inside a modal, green
 *     "Ver disponibilidad" CTA.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FLEET = readFileSync(
  join(__dirname, '..', 'Fleet.vue'),
  'utf-8',
)

describe('F1 fleet — 4 categorías representativas (SCEN-F1-02)', () => {
  it('declares the 4 curated category codes C/FX/GC/LE', () => {
    for (const code of ['C', 'FX', 'GC', 'LE']) {
      expect(FLEET).toMatch(new RegExp(`code:\\s*'${code}'`))
    }
  })

  it('uses the curated names, not the legacy ones', () => {
    expect(FLEET).toContain('Económico')
    expect(FLEET).toContain('Sedán Automático')
    expect(FLEET).toContain('Camioneta SUV')
    expect(FLEET).toContain('Camioneta Premium')
  })
})

describe('F1 fleet — precio real + fail-soft', () => {
  it('reads the price from pickRepresentativeDailyPrice (real, not hardcoded)', () => {
    expect(FLEET).toContain('pickRepresentativeDailyPrice')
    // sourced from the global-per-category payload
    expect(FLEET).toMatch(/categories\.find\(\s*\(?c\)?\s*=>\s*c\.id\s*===\s*category\.code\s*\)/)
    expect(FLEET).toContain('month_prices')
    expect(FLEET).toContain('one_day_price')
  })

  it('formats as Colombian pesos via moneyFormat with the /día suffix', () => {
    expect(FLEET).toContain('useMoneyFormat')
    expect(FLEET).toMatch(/\$\{\{\s*moneyFormat\(card\.dailyPrice\)\s*\}\}\/día/)
  })

  it('hides the price when undefined — never $0 nor fabricated (fail-soft)', () => {
    // the price block is guarded by v-if on the optional dailyPrice
    expect(FLEET).toMatch(/v-if="card\.dailyPrice\s*!==\s*undefined"/)
    // dailyPrice is the optional one_day_price (undefined when no active row)
    expect(FLEET).toMatch(/dailyPrice:\s*priceRow\?\.one_day_price/)
    // no fabricated/zero fallback
    expect(FLEET).not.toMatch(/dailyPrice[^\n]*\?\?\s*0/)
  })
})

describe('F1 fleet — engine flow preserved', () => {
  it('mounts SelectBranch (variant="gray") inside a modal', () => {
    // lazy variant only (hydrate-on-interaction) — no eager <UModal mount
    expect(FLEET).not.toMatch(/<UModal[\s>]/)
    expect(FLEET).toContain('LazyUModal')
    expect(FLEET).toContain('<SelectBranch variant="gray" />')
  })

  it('keeps the green "Ver disponibilidad" CTA', () => {
    expect(FLEET).toContain('Ver disponibilidad')
    expect(FLEET).toMatch(/bg-green-700/)
  })
})

describe('F1 fleet — F0 styling lessons', () => {
  it('uses bg-linear-* for gradients, never the v3 bg-gradient-to- alias', () => {
    expect(FLEET).toMatch(/bg-linear-to-/)
    expect(FLEET).not.toContain('bg-gradient-to-')
  })

  it('headings adopt the .heading-* utility (Plus Jakarta, F0-03)', () => {
    expect(FLEET).toMatch(/heading-section/)
    expect(FLEET).toMatch(/heading-card/)
  })
})
