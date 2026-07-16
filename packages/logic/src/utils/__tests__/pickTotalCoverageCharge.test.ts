import { describe, it, expect } from 'vitest'
import { pickTotalCoverageChargeForDate } from '../pickTotalCoverageCharge'
import type CategoryMonthPriceData from '../types/data/CategoryMonthPriceData'

// Issue #322 PR10 — SCEN-322-K01 / SCEN-322-K02.
//
// The "Seguro Total" charge used to come from `activePricing[0] ?? allPricing[0]`
// in the server transform: undefined Postgres order, and an inactive legacy
// fallback that quoted a retired rate worth less than half the current one.
// The charge now travels per pricing row and is selected by pickup date with
// the same criterion pickPriceForDate uses for monthly prices (rule 1), but
// WITHOUT the inactive/season-low fallbacks: no applicable active row → null
// (coverage visibly unquoted).

const row = (over: Partial<CategoryMonthPriceData>): CategoryMonthPriceData => ({
  '1k_kms': 0,
  '2k_kms': 0,
  '3k_kms': 0,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 0,
  one_day_price: 100000,
  status: 'active',
  total_coverage_unit_charge: 40000,
  ...over,
})

describe('pickTotalCoverageChargeForDate (SCEN-322-K01)', () => {
  const activeApplicable = row({
    init_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'active',
    total_coverage_unit_charge: 40000,
  })
  const inactiveLegacy = row({
    init_date: '2023-01-01',
    end_date: '2023-12-31',
    status: 'inactive',
    total_coverage_unit_charge: 15000, // retired rate, less than half
  })

  it('selects the active row applicable to the pickup date, not array position 0', () => {
    // Both orders — Postgres embed order is undefined, the result must not
    // depend on it.
    expect(pickTotalCoverageChargeForDate([activeApplicable, inactiveLegacy], '2026-07-20')).toBe(40000)
    expect(pickTotalCoverageChargeForDate([inactiveLegacy, activeApplicable], '2026-07-20')).toBe(40000)
  })

  it('resolves overlapping active rows by most recent init_date (same as pickPriceForDate)', () => {
    const older = row({ init_date: '2026-01-01', end_date: '', total_coverage_unit_charge: 30000 })
    const newer = row({ init_date: '2026-06-01', end_date: '', total_coverage_unit_charge: 45000 })
    expect(pickTotalCoverageChargeForDate([older, newer], '2026-07-20')).toBe(45000)
    expect(pickTotalCoverageChargeForDate([newer, older], '2026-07-20')).toBe(45000)
  })

  it('treats an open-ended active row (no end_date) as applicable', () => {
    const openEnded = row({ init_date: '2026-01-01', end_date: '', total_coverage_unit_charge: 38000 })
    expect(pickTotalCoverageChargeForDate([openEnded], '2027-03-01')).toBe(38000)
  })
})

describe('pickTotalCoverageChargeForDate (SCEN-322-K02 — never quote a retired rate)', () => {
  it('returns null when every pricing row is inactive — no legacy fallback', () => {
    const legacyOnly = [
      row({ status: 'inactive', init_date: '2023-01-01', end_date: '2023-12-31', total_coverage_unit_charge: 15000 }),
      row({ status: 'inactive', init_date: '2024-01-01', end_date: '2024-12-31', total_coverage_unit_charge: 18000 }),
    ]
    expect(pickTotalCoverageChargeForDate(legacyOnly, '2026-07-20')).toBeNull()
  })

  it('returns null when no active row covers the pickup date — no season-low fallback', () => {
    const outOfRange = [
      row({ status: 'active', init_date: '2026-01-01', end_date: '2026-06-30', total_coverage_unit_charge: 40000 }),
      row({ status: 'inactive', init_date: '2023-01-01', end_date: '2023-12-31', total_coverage_unit_charge: 15000 }),
    ]
    expect(pickTotalCoverageChargeForDate(outOfRange, '2026-08-15')).toBeNull()
  })

  it('returns null when the applicable row carries no charge', () => {
    const chargeless = [row({ total_coverage_unit_charge: null })]
    expect(pickTotalCoverageChargeForDate(chargeless, '2026-07-20')).toBeNull()
    const absent = [row({ total_coverage_unit_charge: undefined })]
    expect(pickTotalCoverageChargeForDate(absent, '2026-07-20')).toBeNull()
  })

  it('returns null on empty, missing or invalid inputs', () => {
    expect(pickTotalCoverageChargeForDate([], '2026-07-20')).toBeNull()
    expect(pickTotalCoverageChargeForDate(undefined, '2026-07-20')).toBeNull()
    expect(pickTotalCoverageChargeForDate(null, '2026-07-20')).toBeNull()
    expect(pickTotalCoverageChargeForDate([row({})], '')).toBeNull()
    expect(pickTotalCoverageChargeForDate([row({})], 'not-a-date')).toBeNull()
  })

  it('preserves a genuine 0 charge (misconfigured data is floored later, not hidden here)', () => {
    const zero = [row({ total_coverage_unit_charge: 0 })]
    expect(pickTotalCoverageChargeForDate(zero, '2026-07-20')).toBe(0)
  })
})
