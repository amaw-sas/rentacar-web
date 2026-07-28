import { describe, it, expect } from 'vitest'
import { transformCategories } from '../transformers'

/**
 * transformCategories gained a third parameter for the monthly struck-price
 * anchor (SCEN-M1/M2/M5). The contract these cases defend is that the anchor is
 * additive: every caller that does not pass it — and every category with no
 * anchor — must produce exactly what it produced before.
 */

const TODAY = '2026-07-27'

const category = (code: string) =>
  ({
    code,
    name: `Gama ${code}`,
    description: 'desc',
    image_url: 'img.png',
    extra_km_charge: 500,
    picoyplaca_exempt: null,
    visibility_mode: 'all',
    category_models: [],
    category_city_visibility: [],
    category_pricing: [
      {
        monthly_1k_price: 3_000_000,
        monthly_2k_price: 3_500_000,
        monthly_3k_price: 4_000_000,
        monthly_insurance_price: 400_000,
        monthly_one_day_price: 550_000,
        valid_from: '2026-07-01',
        valid_until: '2026-12-31',
        status: 'active',
        total_coverage_unit_charge: 40_000,
      },
    ],
  }) as never as Parameters<typeof transformCategories>[0][number]

describe('transformCategories — monthly anchor passthrough', () => {
  it('SCEN-M1: called with two arguments (every pre-pilot caller) → month_anchor_gross is null', () => {
    const [cat] = transformCategories([category('GC')], TODAY)
    expect(cat!.month_anchor_gross).toBeNull()
  })

  it('SCEN-M1: an empty anchor map changes nothing else in the category', () => {
    const before = transformCategories([category('GC')], TODAY)
    const after = transformCategories([category('GC')], TODAY, {})
    expect(after).toEqual(before)
  })

  it('SCEN-M2: attaches the anchor of the matching code', () => {
    const [cat] = transformCategories([category('GC')], TODAY, { GC: 280_607 })
    expect(cat!.month_anchor_gross).toBe(280_607)
    // The manual one_day_price travels untouched — the cap is display-only and
    // happens on the client, never in the payload.
    expect(cat!.month_prices[0]!.one_day_price).toBe(550_000)
  })

  it('SCEN-M5: a category with no entry in the map gets null, not another gama\'s anchor', () => {
    const cats = transformCategories([category('GC'), category('LE')], TODAY, { GC: 280_607 })
    expect(cats[0]!.month_anchor_gross).toBe(280_607)
    expect(cats[1]!.month_anchor_gross).toBeNull()
  })

  it('does not fall back to a lower-cased key — buildMonthlyAnchorMap upper-cases codes', () => {
    const [cat] = transformCategories([category('GC')], TODAY, { gc: 280_607 } as Record<string, number>)
    expect(cat!.month_anchor_gross).toBeNull()
  })

  it('leaves every other field byte-identical when an anchor IS present', () => {
    const withAnchor = transformCategories([category('GC')], TODAY, { GC: 280_607 })[0]!
    const withoutAnchor = transformCategories([category('GC')], TODAY)[0]!
    const { month_anchor_gross: _a, ...restWith } = withAnchor
    const { month_anchor_gross: _b, ...restWithout } = withoutAnchor
    expect(restWith).toEqual(restWithout)
  })
})
