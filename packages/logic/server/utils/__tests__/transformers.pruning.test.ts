import { describe, it, expect } from 'vitest'
import { transformCategories } from '../transformers'
import { pickPriceForDate } from '../../../src/utils/pickPriceForDate'
import { pickRepresentativeDailyPrice } from '../../../src/utils/pickRepresentativeDailyPrice'
import { categoryOffersMonthly } from '../../../src/utils/categoryOffersMonthly'
import { pickTotalCoverageChargeForDate } from '../../../src/utils/pickTotalCoverageCharge'

// Issue #322 PR10 — SCEN-322-K03 (month_prices) + SCEN-322-K01 (per-row charge).
//
// The catalog used to ship every historical category_pricing row (~85 rows)
// on every page. prunePricingRows (applied inside transformCategories) drops
// rows no client-side selector can pick for a today-or-future pickup, keeping
// the exact representative rows each selector's fallback rules need.

const TODAY = '2026-07-16'

interface PricingRow {
  total_coverage_unit_charge: number
  monthly_1k_price: number | null
  monthly_2k_price: number | null
  monthly_3k_price: number | null
  monthly_insurance_price: number | null
  monthly_one_day_price: number | null
  valid_from: string
  valid_until: string | null
  status: string
}

const pricing = (over: Partial<PricingRow>): PricingRow => ({
  total_coverage_unit_charge: 40000,
  monthly_1k_price: 4000000,
  monthly_2k_price: 4200000,
  monthly_3k_price: null,
  monthly_insurance_price: 500000,
  monthly_one_day_price: 220000,
  valid_from: '2026-01-01',
  valid_until: '2026-12-31',
  status: 'active',
  ...over,
})

const category = (rows: PricingRow[]) => ([{
  id: 'uuid-1',
  code: 'C',
  name: 'Gama C',
  description: '',
  image_url: '',
  passenger_count: 5,
  luggage_count: 2,
  has_ac: true,
  transmission: 'manual',
  status: 'active',
  visibility_mode: 'all',
  group_label: '',
  short_description: '',
  long_description: '',
  tags: [],
  extra_km_charge: 0,
  category_models: [],
  category_pricing: rows,
}] as never as Parameters<typeof transformCategories>[0])

// A realistic historical pile: 3 years of quarterly rows, mostly expired.
function historicalRows(): PricingRow[] {
  const rows: PricingRow[] = []
  for (const year of [2023, 2024, 2025]) {
    for (const [from, until] of [
      [`${year}-01-01`, `${year}-03-31`],
      [`${year}-04-01`, `${year}-06-30`],
      [`${year}-07-01`, `${year}-09-30`],
      [`${year}-10-01`, `${year}-12-31`],
    ] as const) {
      rows.push(pricing({
        valid_from: from,
        valid_until: until,
        status: year <= 2024 ? 'inactive' : 'active',
        total_coverage_unit_charge: 20000 + year,
        monthly_1k_price: 3000000 + year * 100,
        monthly_one_day_price: 150000 + year * 10,
      }))
    }
  }
  // Current + future active rows (must all survive).
  rows.push(pricing({ valid_from: '2026-01-01', valid_until: '2026-12-31', status: 'active' }))
  rows.push(pricing({ valid_from: '2027-01-01', valid_until: null, status: 'active', total_coverage_unit_charge: 45000 }))
  return rows
}

describe('transformCategories pricing pruning (SCEN-322-K03)', () => {
  it('drops expired historical rows and keeps every current/future row', () => {
    const full = historicalRows() // 14 rows, 12 expired
    const [cat] = transformCategories(category(full), TODAY)

    // Every current/future row survives.
    const kept = cat!.month_prices
    expect(kept.some((p) => p.init_date === '2026-01-01')).toBe(true)
    expect(kept.some((p) => p.init_date === '2027-01-01')).toBe(true)
    // The 12 expired rows collapse to a handful of representatives.
    expect(kept.length).toBeLessThanOrEqual(6)
    expect(kept.length).toBeLessThan(full.length)
  })

  it('keeps the latest-ending expired inactive row (pickPriceForDate rule-2 candidate)', () => {
    const [cat] = transformCategories(category(historicalRows()), TODAY)
    const expiredInactives = cat!.month_prices.filter(
      (p) => p.status === 'inactive' && p.end_date && p.end_date < TODAY,
    )
    expect(expiredInactives.map((p) => p.end_date)).toEqual(['2024-12-31'])
  })

  it('serialized month_prices shrink to a fraction of the full history', () => {
    const full = historicalRows()
    const before = JSON.stringify(full).length
    const [cat] = transformCategories(category(full), TODAY)
    const after = JSON.stringify(cat!.month_prices).length
    expect(after).toBeLessThan(before * 0.5)
  })

  // Equivalence property: for any today-or-future pickup date, every client
  // selector answers the same on the pruned list as on the full list.
  it('preserves pickPriceForDate / categoryOffersMonthly / pickRepresentativeDailyPrice / coverage selection for future pickups', () => {
    const scenarios = [
      historicalRows(),
      // no inactive rows at all → pickPriceForDate rule 3 (season-low) territory
      historicalRows().map((r) => ({ ...r, status: 'active' })),
      // gap: nothing active covers 2026-08 → legacy fallback territory
      [
        pricing({ valid_from: '2026-01-01', valid_until: '2026-06-30', status: 'active' }),
        pricing({ valid_from: '2024-01-01', valid_until: '2024-12-31', status: 'inactive' }),
        pricing({ valid_from: '2023-01-01', valid_until: '2023-12-31', status: 'inactive' }),
      ],
    ]
    const pickups = ['2026-07-16', '2026-08-15', '2026-12-31', '2027-06-01', '2028-01-01']

    for (const rows of scenarios) {
      const mapAll = (r: PricingRow[]) => transformCategories(category(r), '1900-01-01')[0]!.month_prices
      const fullMapped = mapAll(rows) // 1900 cutoff = prune keeps everything
      expect(fullMapped).toHaveLength(rows.length)
      const pruned = transformCategories(category(rows), TODAY)[0]!.month_prices

      for (const pickup of pickups) {
        expect(pickPriceForDate(pruned, pickup)).toEqual(pickPriceForDate(fullMapped, pickup))
        expect(categoryOffersMonthly(pruned, pickup)).toBe(categoryOffersMonthly(fullMapped, pickup))
        expect(pickTotalCoverageChargeForDate(pruned, pickup)).toBe(pickTotalCoverageChargeForDate(fullMapped, pickup))
      }
      expect(pickRepresentativeDailyPrice(pruned)).toEqual(pickRepresentativeDailyPrice(fullMapped))
    }
  })

  it('K01 at transform level: each surviving row carries its own coverage charge', () => {
    const rows = [
      pricing({ valid_from: '2026-01-01', valid_until: '2026-12-31', status: 'active', total_coverage_unit_charge: 40000 }),
      pricing({ valid_from: '2024-01-01', valid_until: '2024-12-31', status: 'inactive', total_coverage_unit_charge: 15000 }),
    ]
    const [cat] = transformCategories(category(rows), TODAY)

    expect(pickTotalCoverageChargeForDate(cat!.month_prices, '2026-07-20')).toBe(40000)
    // K02: an all-inactive catalog quotes nothing.
    const [legacyOnly] = transformCategories(
      category([pricing({ valid_from: '2024-01-01', valid_until: '2024-12-31', status: 'inactive', total_coverage_unit_charge: 15000 })]),
      TODAY,
    )
    expect(pickTotalCoverageChargeForDate(legacyOnly!.month_prices, '2026-07-20')).toBeNull()
  })
})
