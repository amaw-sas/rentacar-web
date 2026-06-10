import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCityProductSchema } from '../useCityProductSchema'
import type { CategoryData, CategoryMonthPriceData } from '../../utils'

// Runtime test for issue #68: the city product schema must emit a REAL
// per-category daily price (from category_pricing via rentacar-data), the
// correct per-brand label, and an explicit per-day unit — never the deleted
// fabricated cityPricing matrix. Auto-imported Nuxt globals are stubbed.

const priceRow = (
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

const category = (id: string, month_prices: CategoryMonthPriceData[]): CategoryData =>
  ({
    id,
    identification: id,
    name: `cat-${id}`,
    category: 'Alquiler de Vehículos',
    description: '',
    image: '',
    ad: '',
    models: [],
    month_prices,
    total_coverage_unit_charge: 0,
    extra_km_charge: 0,
  }) as unknown as CategoryData

let capturedSchemas: any[] = []

const stub = (categories: CategoryData[], brand = 'Alquilame') => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: { website: 'https://alquilame.co' },
    organization: { brand },
  }))
  vi.stubGlobal('useFetchRentacarData', () => ({
    vehicleCategories: { C: { modelos: [{ image: '/c.jpg' }] } },
    categories,
  }))
  vi.stubGlobal('useSchemaOrg', (schemas: any[]) => {
    capturedSchemas = schemas
  })
}

beforeEach(() => {
  capturedSchemas = []
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const offerOf = (schemas: any[], code: string) =>
  schemas.find((s) => String(s['@id']).endsWith(`#vehicle-${code}`))?.offers

describe('useCityProductSchema runtime (issue #68)', () => {
  // SCEN-001: real price replaces the fabricated value
  it('emits the real one_day_price as offers.price, not a cityPricing×multiplier value', () => {
    stub([category('C', [priceRow(90_000)])])
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    const offer = offerOf(productSchemas, 'C')
    expect(offer.price).toBe(90_000)
    // the deleted Bogotá-SUV fabrication (110000 × 1.8 = 198000) must not appear
    const serialized = JSON.stringify(productSchemas)
    expect(serialized).not.toContain('198000')
    expect(serialized).not.toContain('110000') // old Bogotá lowPrice base
    // the schema actually reaches the JSON-LD emitter (useSchemaOrg), not just the return value
    expect(capturedSchemas).toBe(productSchemas)
  })

  // SCEN-003: the daily unit is explicit
  it('marks the offer as a per-day unit price in COP', () => {
    stub([category('C', [priceRow(90_000)])])
    const { productSchemas } = useCityProductSchema('Cali', 'cali')
    const offer = offerOf(productSchemas, 'C')
    expect(offer.priceCurrency).toBe('COP')
    expect(offer.priceSpecification['@type']).toBe('UnitPriceSpecification')
    expect(offer.priceSpecification.unitCode).toBe('DAY')
    expect(offer.priceSpecification.priceCurrency).toBe('COP')
  })

  // SCEN-004: seller/brand use the human brand label per brand
  it('uses organization.brand (not the domain, not a hardcoded brand) for seller and brand', () => {
    stub([category('C', [priceRow(90_000)])], 'Alquilame')
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    for (const schema of productSchemas as any[]) {
      expect(schema.brand.name).toBe('Alquilame')
      expect(schema.offers.seller.name).toBe('Alquilame')
    }
    const serialized = JSON.stringify(productSchemas)
    expect(serialized).not.toContain('Alquilatucarro')
    expect(serialized).not.toContain('"name":"alquilame.co"') // domain must never be a NAME value
  })

  // SCEN-005: fail-soft — categories without a real price are omitted, no throw
  it('omits categories that are absent or have no positive active price', () => {
    // C has a price; FX/GC/LE absent from payload
    stub([category('C', [priceRow(90_000)])])
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    expect(offerOf(productSchemas, 'C')).toBeTruthy()
    expect(offerOf(productSchemas, 'FX')).toBeUndefined()
    expect(productSchemas).toHaveLength(1)
  })

  it('renders an empty schema set without throwing when categories is empty', () => {
    stub([])
    expect(() => useCityProductSchema('Bogotá', 'bogota')).not.toThrow()
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    expect(productSchemas).toHaveLength(0)
  })

  // SCEN-006: mixed positive+zero active set never emits $0
  it('never emits a $0 offer for a category with a mixed positive+zero active set', () => {
    stub([category('C', [priceRow(0), priceRow(110_000)])])
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    const offer = offerOf(productSchemas, 'C')
    expect(offer.price).toBe(110_000)
    expect(JSON.stringify(productSchemas)).not.toContain('"price":0')
  })

  it('omits a category whose only active row is zero-priced', () => {
    stub([category('C', [priceRow(0)])])
    const { productSchemas } = useCityProductSchema('Bogotá', 'bogota')
    expect(offerOf(productSchemas, 'C')).toBeUndefined()
    expect(productSchemas).toHaveLength(0)
  })

  // priceValidUntil = real end_date when present, omitted otherwise
  it('sets priceValidUntil from the selected row end_date and omits it when empty', () => {
    stub([category('C', [priceRow(90_000, 'active', '2026-01-01', '2026-09-30')])])
    let offer = offerOf(useCityProductSchema('Bogotá', 'bogota').productSchemas, 'C')
    expect(offer.priceValidUntil).toBe('2026-09-30')

    vi.unstubAllGlobals()
    stub([category('C', [priceRow(90_000, 'active', '2026-01-01', '')])])
    offer = offerOf(useCityProductSchema('Bogotá', 'bogota').productSchemas, 'C')
    expect(offer.priceValidUntil).toBeUndefined()
  })

  // SCEN-007: deterministic — same payload yields the same price across renders
  it('is deterministic: server and client renders select the same price', () => {
    stub([category('C', [priceRow(120_000), priceRow(95_000)])])
    const first = offerOf(useCityProductSchema('Bogotá', 'bogota').productSchemas, 'C')
    const second = offerOf(useCityProductSchema('Bogotá', 'bogota').productSchemas, 'C')
    expect(first.price).toBe(95_000)
    expect(second.price).toBe(95_000)
  })
})
