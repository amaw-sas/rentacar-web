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

/**
 * The real p05 floor (price_floors, migration 142). The fallback path above
 * publishes `monthly_one_day_price`, which is the LIST rate before the
 * discount: alquilame.co shipped "desde $220.000 COP/día" while the p05 of what
 * customers actually paid was $157.696 and the median $178.396. A "desde" near
 * the p90 is the defect these cases pin shut.
 */
describe('buildHomeSEO — real price floor', () => {
  const LIST_RATE = [category('C', [price(220_000)])]

  it('SCEN-1: publishes the real floor, rounded up to the thousand', () => {
    const content = buildHomeSEO(LIST_RATE, ON_DATE, 157_696)

    expect(content.dailyFloor).toBe(158_000)
    expect(content.title).toBe('Alquiler de Carros en Colombia desde $158.000 COP/día')
    expect(content.description).toContain('Alquila carros desde $158.000 COP/día')
  })

  it('SCEN-1: the real floor wins over the list rate, even though it is lower', () => {
    const content = buildHomeSEO(LIST_RATE, ON_DATE, 157_696)

    expect(content.title).not.toContain('220.000')
  })

  it.each([
    [157_001, 158_000],
    [157_696, 158_000],
    [157_999, 158_000],
    [158_000, 158_000],
    [158_001, 159_000],
  ])('SCEN-4: rounds %d UP to %d — never down', (floor, published) => {
    // Rounding down would understate the cheapest day we sell: the same lie as
    // the $220.000, only in the other direction.
    const content = buildHomeSEO(LIST_RATE, ON_DATE, floor)

    expect(content.dailyFloor).toBe(published)
    expect(content.dailyFloor).toBeGreaterThanOrEqual(floor)
  })

  it('SCEN-1: publishes the floor even with no applicable category rows', () => {
    // The floor comes from real quotes, not from category_pricing: it must not
    // need a tariff row to be publishable.
    const content = buildHomeSEO([], ON_DATE, 157_696)

    expect(content.title).toBe('Alquiler de Carros en Colombia desde $158.000 COP/día')
  })

  it('SCEN-3: a brand that never opted in (argument omitted) keeps the list-rate claim', () => {
    const content = buildHomeSEO(LIST_RATE, ON_DATE)

    expect(content.dailyFloor).toBe(220_000)
    expect(content.title).toBe('Alquiler de Carros en Colombia desde $220.000 COP/día')
  })

  it.each([
    ['null', null],
    ['zero', 0],
    ['negative', -157_696],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('SCEN-2: opted in but the floor is %s -> NO number, never the list rate', (_label, floor) => {
    // The whole point of the pipeline. A stale/thin/broken floor must make the
    // title go quiet, NOT silently reprint the $220.000 it replaced. If this
    // ever falls through to 220.000, the defect is back.
    const content = buildHomeSEO(LIST_RATE, ON_DATE, floor as number | null)

    expect(content.dailyFloor).toBeUndefined()
    expect(content.title).toBe('Alquiler de Carros en Colombia')
    expect(content.title).not.toContain('220.000')
    expect(content.description).not.toMatch(/\$|COP\/día/)
  })

  it('SCEN-2/SCEN-3: absent and null are NOT interchangeable', () => {
    // Pinned because "always emit the key" looks like a harmless tidy-up and
    // would quietly restore the list-rate fallback for the opted-in brand.
    expect(buildHomeSEO(LIST_RATE, ON_DATE).dailyFloor).toBe(220_000)
    expect(buildHomeSEO(LIST_RATE, ON_DATE, null).dailyFloor).toBeUndefined()
  })

  it('SCEN-2: no floor AND no applicable row publishes no number at all', () => {
    const content = buildHomeSEO([category('C', [price(0)])], ON_DATE, null)

    expect(content.dailyFloor).toBeUndefined()
    expect(content.title).toBe('Alquiler de Carros en Colombia')
    expect(content.description).not.toMatch(/\$|COP\/día/)
  })

  it('SCEN-2: the Nuxt path goes quiet when the payload carries an explicit null', () => {
    vi.stubGlobal('useState', () => ({
      value: {
        dayPriceFloorGross: null,
        categories: [category('C', [price(220_000, { init_date: '2020-01-01', end_date: '' })])],
      },
    }))

    const homeSEO = useHomeSEO()
    vi.unstubAllGlobals()

    expect(homeSEO.title.value).toBe('Alquiler de Carros en Colombia')
    expect(homeSEO.title.value).not.toContain('220.000')
  })

  it('SCEN-1: reads the floor off the Nuxt payload', () => {
    vi.stubGlobal('useState', () => ({
      value: {
        dayPriceFloorGross: 157_696,
        categories: [category('C', [price(220_000, { init_date: '2020-01-01', end_date: '' })])],
      },
    }))

    const homeSEO = useHomeSEO()
    vi.unstubAllGlobals()

    expect(homeSEO.title.value).toContain('$158.000 COP/día')
    expect(homeSEO.title.value).not.toContain('220.000')
  })

  it('SCEN-7: survives the empty catalog shape on pages without the middleware', () => {
    vi.stubGlobal('useState', () => ({ value: { categories: [] } }))

    const homeSEO = useHomeSEO()
    vi.unstubAllGlobals()

    expect(homeSEO.title.value).toBe('Alquiler de Carros en Colombia')
  })
})
