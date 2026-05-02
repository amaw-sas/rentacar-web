import { describe, it, expect } from 'vitest'
import { buildTariffs } from '../src/composables/useTariffs'
import type CategoryData from '../src/utils/types/data/CategoryData'
import type CategoryMonthPriceData from '../src/utils/types/data/CategoryMonthPriceData'
import type { CategoryType } from '../src/utils/types/type/CategoryType'

function makeCategory(code: string, opts: {
  category?: string
  extraKm?: number
  prices?: Partial<CategoryMonthPriceData>[]
} = {}): CategoryData {
  return {
    id: code as CategoryType,
    identification: code as CategoryType,
    name: `Gama ${code}`,
    category: opts.category ?? `Gama ${code} Demo Description`,
    description: '',
    image: '',
    ad: '',
    models: [],
    month_prices: (opts.prices ?? []).map((p) => ({
      '1k_kms': 0,
      '2k_kms': 0,
      '3k_kms': 0,
      init_date: '2026-05-01',
      end_date: '2026-05-31',
      total_insurance_price: 0,
      one_day_price: 0,
      status: 'active',
      ...p,
    })),
    total_coverage_unit_charge: 0,
    extra_km_charge: opts.extraKm ?? 0,
  }
}

const TODAY = '2026-05-02'

describe('buildTariffs', () => {
  it('returns 11 active categories from May 2026 ordered by code (E1)', () => {
    const cats = ['LE', 'C', 'GY', 'F', 'CX', 'FU', 'FX', 'FL', 'GC', 'G4', 'GL'].map((code) =>
      makeCategory(code, {
        prices: [{ '1k_kms': 1000000, '2k_kms': 2000000 }],
      }),
    )
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas.map((g) => g.code)).toEqual([
      'C', 'CX', 'F', 'FL', 'FU', 'FX', 'G4', 'GC', 'GL', 'GY', 'LE',
    ])
  })

  it('shows real-world May 2026 pricing for category C (E1)', () => {
    const cats = [makeCategory('C', {
      category: 'Gama C Económico Mecánico',
      prices: [{ '1k_kms': 3806000, '2k_kms': 4252000 }],
    })]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas[0].plan1k.monthly).toBe(3806000)
    expect(result.gamas[0].plan2k.monthly).toBe(4252000)
    expect(result.gamas[0].name).toBe('Económico Mecánico')
  })

  it('includes new CX category automatically (E2)', () => {
    const cats = [makeCategory('CX', {
      category: 'Gama CX Económico Automático',
      prices: [{ '1k_kms': 4166000, '2k_kms': 4613000 }],
    })]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas[0].code).toBe('CX')
    expect(result.gamas[0].plan1k.monthly).toBe(4166000)
    expect(result.gamas[0].name).toBe('Económico Automático')
  })

  it('reads kmExtra from category.extra_km_charge (E_C1)', () => {
    const cats = [
      makeCategory('C', { extraKm: 700, prices: [{}] }),
      makeCategory('GC', { extraKm: 900, prices: [{}] }),
      makeCategory('GY', { extraKm: 1100, prices: [{}] }),
    ]
    const byCode = Object.fromEntries(buildTariffs(cats, TODAY).gamas.map((g) => [g.code, g.kmExtra]))
    expect(byCode).toEqual({ C: 700, GC: 900, GY: 1100 })
  })

  it('returns kmExtra=null when extra_km_charge is 0 (unconfigured) (E_C3)', () => {
    const cats = [makeCategory('XX', { extraKm: 0, prices: [{}] })]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas[0].kmExtra).toBeNull()
  })

  it('reflects DB changes without code change (E_C1 dynamic)', () => {
    const before = buildTariffs([makeCategory('C', { extraKm: 700, prices: [{}] })], TODAY)
    const after = buildTariffs([makeCategory('C', { extraKm: 850, prices: [{}] })], TODAY)
    expect(before.gamas[0].kmExtra).toBe(700)
    expect(after.gamas[0].kmExtra).toBe(850)
  })

  it('derives daily price as monthly/30 rounded (E4 supports this)', () => {
    const cats = [makeCategory('C', { prices: [{ '1k_kms': 3806000 }] })]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas[0].plan1k.daily).toBe(Math.round(3806000 / 30))
  })

  it('formats period label "1 May – 31 May 2026" (E8)', () => {
    const cats = [makeCategory('C', {
      prices: [{ init_date: '2026-05-01', end_date: '2026-05-31', '1k_kms': 100 }],
    })]
    const result = buildTariffs(cats, TODAY)
    expect(result.period?.label).toBe('1 May – 31 May 2026')
    expect(result.period?.start).toBe('2026-05-01')
    expect(result.period?.end).toBe('2026-05-31')
  })

  it('formats period label across months "1 Feb – 31 Mar 2026" (E8)', () => {
    const cats = [makeCategory('C', {
      prices: [{ init_date: '2026-02-01', end_date: '2026-03-31', '1k_kms': 100 }],
    })]
    const result = buildTariffs(cats, '2026-02-15')
    expect(result.period?.label).toBe('1 Feb – 31 Mar 2026')
  })

  it('returns null period and empty gamas when categories are empty (E7)', () => {
    expect(buildTariffs([], TODAY)).toEqual({ period: null, gamas: [] })
  })

  it('returns null period and empty gamas when no pricing is active today (E7)', () => {
    const cats = [makeCategory('C', {
      prices: [{ init_date: '2026-02-01', end_date: '2026-03-31', status: 'active', '1k_kms': 100 }],
    })]
    const result = buildTariffs(cats, TODAY)
    expect(result).toEqual({ period: null, gamas: [] })
  })

  it('skips categories whose only pricing is inactive (E7)', () => {
    const cats = [
      makeCategory('C', { prices: [{ status: 'active', '1k_kms': 100 }] }),
      makeCategory('LU', {
        prices: [{ status: 'inactive', init_date: '2025-01-01', end_date: '2025-12-31', '1k_kms': 999 }],
      }),
    ]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas.map((g) => g.code)).toEqual(['C'])
  })

  it('picks the most recent active row when multiple match today', () => {
    const cats = [makeCategory('C', {
      prices: [
        { init_date: '2026-04-01', end_date: '2026-12-31', '1k_kms': 1000000 },
        { init_date: '2026-05-01', end_date: '2026-05-31', '1k_kms': 3806000 },
      ],
    })]
    const result = buildTariffs(cats, TODAY)
    expect(result.gamas[0].plan1k.monthly).toBe(3806000)
  })
})
