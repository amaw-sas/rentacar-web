import { describe, expect, it, vi } from 'vitest'

import { buildHomeSEO, useHomeSEO } from '../useHomeSEO'
import type CategoryData from '../../utils/types/data/CategoryData'
import type CategoryMonthPriceData from '../../utils/types/data/CategoryMonthPriceData'

const ON_DATE = '2026-07-18'

const price = (
  oneDayPrice: number,
  options: Partial<CategoryMonthPriceData> = {},
): CategoryMonthPriceData => ({
  '1k_kms': 3_000_000,
  '2k_kms': 3_500_000,
  '3k_kms': 4_000_000,
  init_date: '2026-07-01',
  end_date: '2026-07-31',
  total_insurance_price: 500_000,
  one_day_price: oneDayPrice,
  status: 'active',
  ...options,
})

const category = (code: string, prices: CategoryMonthPriceData[]): CategoryData => ({
  id: code as CategoryData['id'],
  identification: code as CategoryData['identification'],
  name: `Gama ${code}`,
  category: `Gama ${code}`,
  description: '',
  image: '',
  ad: '',
  models: [],
  month_prices: prices,
  extra_km_charge: 0,
})

describe('buildHomeSEO', () => {
  it('derives the COP daily floor from applicable category-pricing rows', () => {
    const content = buildHomeSEO([
      category('C', [price(310_000)]),
      category('E', [price(220_000)]),
      category('L', [price(90_000, { status: 'inactive' })]),
    ], ON_DATE)

    expect(content.dailyFloor).toBe(220_000)
    expect(content.title).toBe('Alquiler de Carros en Colombia desde $220.000 COP/día')
    expect(content.description).toContain('Alquila carros desde $220.000 COP/día')
  })

  it('changes the public claim when the pricing source changes', () => {
    const content = buildHomeSEO([category('C', [price(185_500)])], ON_DATE)

    expect(content.dailyFloor).toBe(185_500)
    expect(content.title).toContain('$185.500 COP/día')
    expect(content.description).toContain('$185.500 COP/día')
  })

  it('omits the numeric claim when no positive active row applies on the date', () => {
    const content = buildHomeSEO([
      category('C', [price(180_000, { end_date: '2026-07-17' })]),
      category('E', [price(190_000, { init_date: '2026-07-19' })]),
      category('L', [price(0)]),
    ], ON_DATE)

    expect(content.dailyFloor).toBeUndefined()
    expect(content.title).toBe('Alquiler de Carros en Colombia')
    expect(content.description).not.toMatch(/\$|COP\/día/)
  })

  it('captures the Nuxt state during setup before head refs are unwrapped', () => {
    vi.stubGlobal('useState', () => ({
      value: {
        categories: [category('C', [price(205_000, {
          init_date: '2020-01-01',
          end_date: '',
        })])],
      },
    }))

    const homeSEO = useHomeSEO()
    vi.unstubAllGlobals()

    expect(homeSEO.title.value).toContain('$205.000 COP/día')
    expect(homeSEO.description.value).toContain('$205.000 COP/día')
  })
})
