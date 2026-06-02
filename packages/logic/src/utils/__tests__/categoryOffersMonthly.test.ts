import { describe, it, expect } from 'vitest'
import { categoryOffersMonthly } from '../categoryOffersMonthly'
import type CategoryMonthPriceData from '../types/data/CategoryMonthPriceData'

// Encodes the Ola A predicate (issue #28). A category "offers monthly" when the
// pricing row applicable to the pickup date has a positive monthly mileage price.
// FU/FL/GL/LU are modeled in production as monthly_*_price = NULL → 0 in the
// payload (mig. 042 + transformer `?? 0`), so they never offer monthly.

const row = (
  overrides: Partial<CategoryMonthPriceData> = {},
): CategoryMonthPriceData => ({
  '1k_kms': 900000,
  '2k_kms': 1200000,
  '3k_kms': 1500000,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 0,
  one_day_price: 0,
  status: 'active',
  ...overrides,
})

describe('categoryOffersMonthly', () => {
  it('offers monthly when the applicable active row has a positive mileage price', () => {
    expect(categoryOffersMonthly([row()], '2026-03-15')).toBe(true)
  })

  it('does not offer monthly when the applicable row has both mileage prices at zero (mig. 042 shape)', () => {
    const zeroed = row({ '1k_kms': 0, '2k_kms': 0, '3k_kms': 0 })
    expect(categoryOffersMonthly([zeroed], '2026-03-15')).toBe(false)
  })

  it('offers monthly when only the 2k plan is priced (partial pricing still sellable)', () => {
    const partial = row({ '1k_kms': 0, '2k_kms': 1200000 })
    expect(categoryOffersMonthly([partial], '2026-03-15')).toBe(true)
  })

  // Only 1k/2k are sellable in the reservation UI — a row priced only on 3k has
  // no selectable monthly plan, so it must not count as offering monthly.
  it('does not offer monthly when only the unsellable 3k plan is priced', () => {
    const only3k = row({ '1k_kms': 0, '2k_kms': 0, '3k_kms': 1500000 })
    expect(categoryOffersMonthly([only3k], '2026-03-15')).toBe(false)
  })

  // SCEN-A06: date-aware — same category, different answer per pickup date.
  it('respects the pickup date: priced in range A, zeroed in range B', () => {
    const rangeA = row({ init_date: '2026-01-01', end_date: '2026-06-30', '1k_kms': 900000 })
    const rangeB = row({ init_date: '2026-07-01', end_date: '2026-12-31', '1k_kms': 0, '2k_kms': 0 })
    const prices = [rangeA, rangeB]
    expect(categoryOffersMonthly(prices, '2026-03-15')).toBe(true)
    expect(categoryOffersMonthly(prices, '2026-08-15')).toBe(false)
  })

  // SCEN-A08: pickup date outside every active range must not exclude a category
  // that has a real monthly product, just because a $0 off-season row would be
  // the cheapest fallback pick. No in-range row → safety net (any active
  // positive) decides.
  it('offers monthly when the pickup date is beyond all ranges but a priced active row exists', () => {
    const priced = row({ init_date: '2026-01-01', end_date: '2026-06-30', '1k_kms': 900000 })
    const offSeasonZero = row({ init_date: '2026-07-01', end_date: '2026-12-31', '1k_kms': 0, '2k_kms': 0 })
    // 2030 is past both ranges; the old pickPriceForDate-based predicate picked
    // the $0 seasonLow row and wrongly returned false.
    expect(categoryOffersMonthly([priced, offSeasonZero], '2030-01-01')).toBe(true)
    expect(categoryOffersMonthly([offSeasonZero, priced], '2030-01-01')).toBe(true)
  })

  // The flip side of SCEN-A08: when the date IS inside a $0 range, that in-range
  // row is authoritative and the category is excluded — even though another
  // active range is priced (SCEN-A06 invariant).
  it('excludes when the in-range active row is $0, even if another range is priced', () => {
    const pricedH1 = row({ init_date: '2026-01-01', end_date: '2026-06-30', '1k_kms': 900000 })
    const zeroH2 = row({ init_date: '2026-07-01', end_date: '2026-12-31', '1k_kms': 0, '2k_kms': 0 })
    expect(categoryOffersMonthly([pricedH1, zeroH2], '2026-08-15')).toBe(false)
    expect(categoryOffersMonthly([pricedH1, zeroH2], '2026-03-15')).toBe(true)
  })

  // SCEN-A07: safety net — undefined pick (missing date) must not mass-exclude a
  // category that genuinely has positive active monthly pricing.
  it('falls back to "any active positive row" when pickup date is empty', () => {
    expect(categoryOffersMonthly([row()], '')).toBe(true)
  })

  it('still excludes an all-zero category when pickup date is empty', () => {
    const zeroed = row({ '1k_kms': 0, '2k_kms': 0, '3k_kms': 0 })
    expect(categoryOffersMonthly([zeroed], '')).toBe(false)
  })

  it('does not offer monthly when there is no pricing data at all', () => {
    expect(categoryOffersMonthly([], '2026-03-15')).toBe(false)
  })

  // The safety net only counts ACTIVE rows — an inactive legacy row with a
  // positive price must not resurrect monthly for a discontinued category.
  it('ignores inactive legacy rows in the empty-date safety net', () => {
    const legacy = row({ status: 'inactive', '1k_kms': 900000 })
    const activeZero = row({ status: 'active', '1k_kms': 0, '2k_kms': 0 })
    expect(categoryOffersMonthly([legacy, activeZero], '')).toBe(false)
  })
})
