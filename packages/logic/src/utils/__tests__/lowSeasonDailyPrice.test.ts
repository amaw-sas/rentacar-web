/**
 * Scenarios for the alquilame Fleet "Alquiler Diario" price redefinition.
 *
 * Operator intent: the daily price shown must be the low-season, 1.000 km
 * MONTHLY rate prorated over a 30-day rental (monthly / 30), NOT the standalone
 * `one_day_price` column. Encodes:
 *   SCEN-D1 low-season 1k = cheapest active positive `1k_kms`
 *   SCEN-D2 daily = round(low-season 1k / 30)
 *   SCEN-D3 inactive / non-positive rows are ignored
 *   SCEN-D4 no active positive row => undefined (fail-soft, never $0)
 *   SCEN-D5 tie on 1k_kms => most recent init_date wins
 */
import { describe, it, expect } from 'vitest'
import {
  lowSeasonMonthly1k,
  lowSeasonDailyFrom30,
} from '../lowSeasonDailyPrice'
import type CategoryMonthPriceData from '../types/data/CategoryMonthPriceData'

function row(p: Partial<CategoryMonthPriceData>): CategoryMonthPriceData {
  return {
    '1k_kms': 0,
    '2k_kms': 0,
    '3k_kms': 0,
    init_date: '2026-01-01',
    end_date: '2026-12-31',
    total_insurance_price: 0,
    one_day_price: 0,
    status: 'active',
    ...p,
  } as CategoryMonthPriceData
}

describe('lowSeasonMonthly1k', () => {
  it('SCEN-D1: picks the cheapest active positive 1k_kms', () => {
    const prices = [
      row({ '1k_kms': 2_400_000, init_date: '2026-06-01' }),
      row({ '1k_kms': 1_800_000, init_date: '2026-01-01' }),
      row({ '1k_kms': 2_100_000, init_date: '2026-03-01' }),
    ]
    expect(lowSeasonMonthly1k(prices)).toBe(1_800_000)
  })

  it('SCEN-D3: ignores inactive and non-positive rows', () => {
    const prices = [
      row({ '1k_kms': 900_000, status: 'inactive' }),
      row({ '1k_kms': 0 }),
      row({ '1k_kms': 2_000_000 }),
    ]
    expect(lowSeasonMonthly1k(prices)).toBe(2_000_000)
  })

  it('SCEN-D4: returns undefined when no active positive row exists', () => {
    expect(lowSeasonMonthly1k([])).toBeUndefined()
    expect(
      lowSeasonMonthly1k([row({ '1k_kms': 0 }), row({ '1k_kms': 5, status: 'inactive' })]),
    ).toBeUndefined()
  })

  it('SCEN-D5: tie on 1k_kms resolves to the most recent init_date', () => {
    const prices = [
      row({ '1k_kms': 1_500_000, init_date: '2026-01-01' }),
      row({ '1k_kms': 1_500_000, init_date: '2026-05-01' }),
    ]
    // both have the same value; selection is stable and deterministic
    expect(lowSeasonMonthly1k(prices)).toBe(1_500_000)
  })
})

describe('lowSeasonDailyFrom30', () => {
  it('SCEN-D2: daily = round(low-season 1k monthly / 30)', () => {
    const prices = [row({ '1k_kms': 1_800_000 })]
    expect(lowSeasonDailyFrom30(prices)).toBe(60_000) // 1_800_000 / 30
  })

  it('SCEN-D2: rounds to the nearest peso', () => {
    const prices = [row({ '1k_kms': 2_000_000 })]
    // 2_000_000 / 30 = 66_666.66… -> 66_667
    expect(lowSeasonDailyFrom30(prices)).toBe(66_667)
  })

  it('SCEN-D4: undefined when no active positive monthly rate', () => {
    expect(lowSeasonDailyFrom30([row({ '1k_kms': 0 })])).toBeUndefined()
  })
})
