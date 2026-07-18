import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as productSchemaModule from '../useProductSchema'
import type { CategoryAvailabilityData, VehicleCategory } from '../../utils'

const { useProductSchema } = productSchemaModule

// Runtime test for issue #312: the category product schema must emit the
// per-brand identity (organization.brand / franchise.website) instead of the
// hardcoded "Alquilatucarro", and a plain per-day Offer instead of the
// fabricated AggregateOffer (highPrice = dailyPrice × 30 was not the price of
// any real offer). priceValidUntil (hardcoded '2026-12-31') is gone too.
// Mirrors the harness used by the city structured-data runtime test.

const category = (overrides: Partial<CategoryAvailabilityData> = {}): CategoryAvailabilityData =>
  ({
    categoryCode: 'C',
    vehicleDayCharge: 90_000,
    coverageUnitCharge: 30_000,
    categoryModels: [
      { name: 'Kia Picanto', image: '/picanto.jpg' },
      { name: 'Renault Kwid', image: '/kwid.jpg' },
    ],
    ...overrides,
  }) as unknown as CategoryAvailabilityData

const vehicleCategory = (): VehicleCategory =>
  ({
    grupo: 'Económico',
    descripcion_corta: 'Compactos de ciudad',
    descripcion_larga: 'Vehículos compactos perfectos para ciudad',
    tags: ['5 pasajeros', 'Mecánico'],
  }) as unknown as VehicleCategory

let capturedSchemas: any[] = []

const stub = (brand = 'Alquilame', website = 'https://alquilame.co') => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: { website, shortname: brand.toLowerCase(), logo: '/logo.svg' },
    organization: { brand },
  }))
  vi.stubGlobal('useRoute', () => ({ params: { city: 'bogota' } }))
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

const emit = (opts: Partial<Parameters<typeof useProductSchema>[0]> = {}) => {
  useProductSchema({
    category: category(),
    vehicleCategory: vehicleCategory(),
    cityName: 'Bogotá',
    ...opts,
  })
  return capturedSchemas[0]
}

describe('useProductSchema per-brand identity + real per-day offer (issue #312)', () => {
  // SCEN-2: brand/seller derive from the app config of the running brand
  it('uses organization.brand for brand and seller — never a hardcoded name', () => {
    stub('Alquilame')
    const schema = emit()
    expect(schema.brand.name).toBe('Alquilame')
    expect(schema.offers.seller.name).toBe('Alquilame')
    expect(schema.offers.seller.url).toBe('https://alquilame.co')
    expect(JSON.stringify(schema)).not.toContain('Alquilatucarro')
  })

  it('keeps the correct identity on the alquilatucarro brand itself', () => {
    stub('Alquilatucarro', 'https://alquilatucarro.com')
    const schema = emit()
    expect(schema.brand.name).toBe('Alquilatucarro')
    expect(schema.offers.seller.url).toBe('https://alquilatucarro.com')
  })

  // SCEN-2: plain per-day Offer, no fabricated aggregate range
  it('emits a plain Offer with the real daily price (vehicle + coverage), not an AggregateOffer', () => {
    stub()
    const schema = emit()
    expect(schema.offers['@type']).toBe('Offer')
    expect(schema.offers.price).toBe(120_000) // 90 000 + 30 000
    expect(schema.offers.lowPrice).toBeUndefined()
    expect(schema.offers.highPrice).toBeUndefined() // dailyPrice × 30 fabrication is gone
    expect(schema.offers.offerCount).toBeUndefined()
    expect(JSON.stringify(schema)).not.toContain('AggregateOffer')
  })

  it('marks the offer as a per-day unit price in COP', () => {
    stub()
    const offer = emit().offers
    expect(offer.priceCurrency).toBe('COP')
    expect(offer.priceSpecification['@type']).toBe('UnitPriceSpecification')
    expect(offer.priceSpecification.unitCode).toBe('DAY')
    expect(offer.priceSpecification.price).toBe(120_000)
  })

  it('omits the fabricated priceValidUntil (hardcoded 2026-12-31)', () => {
    stub()
    const offer = emit().offers
    expect(offer.priceValidUntil).toBeUndefined()
    expect(JSON.stringify(capturedSchemas)).not.toContain('2026-12-31')
  })

  it('emits nothing without a vehicleCategory (fail-soft, unchanged)', () => {
    stub()
    useProductSchema({ category: category(), vehicleCategory: undefined })
    expect(capturedSchemas).toHaveLength(0)
  })

  // Dead code with the same hardcoded seller must not survive the module
  it('no longer exports useCarSchema (dead code removed)', () => {
    expect((productSchemaModule as Record<string, unknown>).useCarSchema).toBeUndefined()
  })
})
