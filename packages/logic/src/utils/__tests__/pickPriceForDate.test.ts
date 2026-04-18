import { describe, it, expect } from 'vitest'
import { pickPriceForDate } from '../pickPriceForDate'
import type { CategoryMonthPriceData } from '../index'

const active = (init: string, end: string, k1: number): CategoryMonthPriceData => ({
  '1k_kms': k1,
  '2k_kms': k1 + 500_000,
  '3k_kms': k1 + 500_000,
  init_date: init,
  end_date: end,
  total_insurance_price: 476_000,
  one_day_price: 220_000,
  status: 'active',
})

const inactive = (init: string, end: string, k1: number): CategoryMonthPriceData => ({
  ...active(init, end, k1),
  status: 'inactive',
})

const SEASONAL_2026 = [
  active('2026-04-01', '2026-04-30', 4_149_000), // alta
  active('2026-05-01', '2026-05-31', 3_806_000), // baja
  active('2026-06-01', '2026-06-30', 4_149_000),
  active('2026-07-01', '2026-07-31', 4_149_000),
  active('2026-08-01', '2026-08-31', 3_806_000),
  active('2026-09-01', '2026-09-30', 3_806_000),
  active('2026-10-01', '2026-10-31', 4_149_000),
  active('2026-11-01', '2026-11-30', 3_806_000),
  active('2026-12-01', '2026-12-31', 4_149_000),
]

const LEGACY_2024_2025 = inactive('2024-01-15', '2025-12-30', 3_865_990)

describe('pickPriceForDate', () => {
  it('returns april (high season) row when pickup is 2026-04-15', () => {
    const result = pickPriceForDate(SEASONAL_2026, '2026-04-15')
    expect(result?.init_date).toBe('2026-04-01')
    expect(result?.['1k_kms']).toBe(4_149_000)
  })

  it('returns may (low season) row when pickup is 2026-05-15', () => {
    const result = pickPriceForDate(SEASONAL_2026, '2026-05-15')
    expect(result?.init_date).toBe('2026-05-01')
    expect(result?.['1k_kms']).toBe(3_806_000)
  })

  it('selects pickup-date season when rental crosses seasons (pickup in april = high)', () => {
    const result = pickPriceForDate(SEASONAL_2026, '2026-04-29')
    expect(result?.init_date).toBe('2026-04-01')
    expect(result?.['1k_kms']).toBe(4_149_000)
  })

  it('returns december (high) for pickup 2026-12-31', () => {
    const result = pickPriceForDate(SEASONAL_2026, '2026-12-31')
    expect(result?.init_date).toBe('2026-12-01')
  })

  it('falls back to inactive legacy when pickup is outside any active range', () => {
    const prices = [...SEASONAL_2026, LEGACY_2024_2025]
    const result = pickPriceForDate(prices, '2026-02-15')
    expect(result?.status).toBe('inactive')
    expect(result?.init_date).toBe('2024-01-15')
  })

  it('chooses the most recent active row when multiple active ranges overlap', () => {
    const overlapping = [
      active('2026-04-01', '2026-12-31', 4_000_000),
      active('2026-06-01', '2026-06-30', 4_500_000), // más específica/reciente
    ]
    const result = pickPriceForDate(overlapping, '2026-06-15')
    expect(result?.init_date).toBe('2026-06-01')
    expect(result?.['1k_kms']).toBe(4_500_000)
  })

  it('treats null end_date as open-ended (covers any future pickup)', () => {
    const openEnded = [{ ...active('2026-04-01', '', 4_149_000), end_date: '' }]
    const result = pickPriceForDate(openEnded, '2030-01-01')
    expect(result?.init_date).toBe('2026-04-01')
  })

  it('returns undefined when pickup is empty string', () => {
    const result = pickPriceForDate(SEASONAL_2026, '')
    expect(result).toBeUndefined()
  })

  it('returns undefined when prices is empty', () => {
    const result = pickPriceForDate([], '2026-04-15')
    expect(result).toBeUndefined()
  })

  it('chooses the legacy row with smallest temporal distance to pickup', () => {
    const olderLegacy = inactive('2022-01-01', '2022-12-31', 3_000_000)
    const newerLegacy = inactive('2024-01-15', '2025-12-30', 3_865_990)
    const result = pickPriceForDate([olderLegacy, newerLegacy], '2026-02-15')
    expect(result?.init_date).toBe('2024-01-15')
  })
})
