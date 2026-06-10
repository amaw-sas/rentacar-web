import { describe, it, expect } from 'vitest'
import { pickRepresentativeDailyPrice } from '../pickRepresentativeDailyPrice'
import type { CategoryMonthPriceData } from '../index'

const row = (
  one_day_price: number,
  status: 'active' | 'inactive' = 'active',
  init_date = '2026-01-01',
  end_date = '2026-12-31',
): CategoryMonthPriceData => ({
  '1k_kms': 3_000_000,
  '2k_kms': 3_500_000,
  '3k_kms': 4_000_000,
  init_date,
  end_date,
  total_insurance_price: 476_000,
  one_day_price,
  status,
})

describe('pickRepresentativeDailyPrice', () => {
  // SCEN-001: real price replaces the fabricated value
  it('returns the single active row when it has a positive one_day_price', () => {
    const result = pickRepresentativeDailyPrice([row(90_000)])
    expect(result?.one_day_price).toBe(90_000)
  })

  // SCEN-002: cheapest active positive, ignoring inactive
  it('picks the minimum one_day_price among active rows and ignores inactive', () => {
    const prices = [
      row(120_000, 'active'),
      row(90_000, 'active'),
      row(70_000, 'inactive'), // cheaper but inactive → ignored
    ]
    const result = pickRepresentativeDailyPrice(prices)
    expect(result?.one_day_price).toBe(90_000)
  })

  // SCEN-006: mixed positive+zero active set never yields 0
  it('excludes zero-priced active rows (no monthly plan)', () => {
    const prices = [row(0, 'active'), row(110_000, 'active')]
    const result = pickRepresentativeDailyPrice(prices)
    expect(result?.one_day_price).toBe(110_000)
  })

  // SCEN-005: fail-soft — undefined when no positive active price exists
  it('returns undefined when all active rows are zero', () => {
    expect(pickRepresentativeDailyPrice([row(0, 'active'), row(0, 'active')])).toBeUndefined()
  })

  it('returns undefined when prices is empty', () => {
    expect(pickRepresentativeDailyPrice([])).toBeUndefined()
  })

  it('returns undefined when only inactive rows carry a price', () => {
    expect(pickRepresentativeDailyPrice([row(80_000, 'inactive')])).toBeUndefined()
  })

  // Tie-break: equal one_day_price → most recent init_date wins
  it('breaks ties on equal price by most recent init_date', () => {
    const older = row(90_000, 'active', '2026-01-01')
    const newer = row(90_000, 'active', '2026-06-01')
    const result = pickRepresentativeDailyPrice([older, newer])
    expect(result?.init_date).toBe('2026-06-01')
  })

  // SCEN-007: deterministic — same input yields identical output across calls
  it('is a pure function: repeated calls on the same input return the same row', () => {
    const prices = [row(120_000), row(95_000), row(150_000)]
    const a = pickRepresentativeDailyPrice(prices)
    const b = pickRepresentativeDailyPrice(prices)
    expect(a?.one_day_price).toBe(95_000)
    expect(a).toEqual(b)
  })

  // Does not mutate the caller's array (order-independent selection)
  it('does not mutate the input array order', () => {
    const prices = [row(120_000), row(90_000)]
    const snapshot = prices.map((p) => p.one_day_price)
    pickRepresentativeDailyPrice(prices)
    expect(prices.map((p) => p.one_day_price)).toEqual(snapshot)
  })
})
