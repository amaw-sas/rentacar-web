import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CategoryData, CategoryMonthPriceData } from '../../utils'
import { AMAW_ORGANIZATION_ID } from '../../utils/structuredDataIdentity'
import { useCityProductSchema } from '../useCityProductSchema'
import { useCityServiceSchema } from '../useCityServiceSchema'

const priceRow = (
  one_day_price: number,
  status: 'active' | 'inactive' = 'active',
): CategoryMonthPriceData => ({
  '1k_kms': 3_000_000,
  '2k_kms': 3_500_000,
  '3k_kms': 4_000_000,
  init_date: '2026-01-01',
  end_date: '2026-12-31',
  total_insurance_price: 476_000,
  one_day_price,
  status,
})

const category = (id: string, month_prices: CategoryMonthPriceData[]): CategoryData => ({
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

const brands = [
  { name: 'Alquilatucarro', website: 'https://alquilatucarro.com' },
  { name: 'Alquilame', website: 'https://alquilame.co' },
  { name: 'Alquicarros', website: 'https://alquicarros.com' },
] as const

let capturedSchemas: any[] = []

const stub = (
  categories: CategoryData[],
  brand: (typeof brands)[number] = brands[0],
) => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: { website: brand.website },
    organization: { name: 'AMAW SAS', brand: brand.name },
  }))
  vi.stubGlobal('useFetchRentacarData', () => ({ categories }))
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

describe('useCityServiceSchema runtime — F6', () => {
  it('keeps the existing city-page entry point wired to Service semantics', () => {
    expect(useCityProductSchema).toBe(useCityServiceSchema)

    stub([category('C', [priceRow(90_000)])])
    const { serviceSchema } = useCityProductSchema('Bogotá', 'bogota')
    expect(serviceSchema['@type']).toBe('Service')
    expect(capturedSchemas).toEqual([serviceSchema])
  })

  it('emits one Service with an aggregate configured daily-price range', () => {
    stub([
      category('C', [priceRow(90_000)]),
      category('FX', [priceRow(130_000)]),
      category('GC', [priceRow(220_000)]),
    ])

    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')

    expect(capturedSchemas).toEqual([serviceSchema])
    expect(serviceSchema['@type']).toBe('Service')
    expect(serviceSchema.offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: 90_000,
      highPrice: 220_000,
      offerCount: 3,
      priceCurrency: 'COP',
      businessFunction: {
        '@id': 'http://purl.org/goodrelations/v1#LeaseOut',
      },
      itemOffered: {
        '@id': 'https://alquilatucarro.com/bogota#vehicle-rental-booking-service',
      },
    })
  })

  it('derives both bounds and offerCount from the same multi-season offer set', () => {
    stub([
      category('C', [priceRow(90_000), priceRow(150_000)]),
      category('FX', [priceRow(130_000), priceRow(200_000)]),
    ])

    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')

    expect(serviceSchema.offers).toMatchObject({
      lowPrice: 90_000,
      highPrice: 200_000,
      offerCount: 4,
    })
  })

  it('never serializes Product, AutoRental, InStock, or AggregateRating claims', () => {
    stub([category('C', [priceRow(90_000)])])
    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')
    const serialized = JSON.stringify(serviceSchema)

    expect(serialized).not.toContain('Product')
    expect(serialized).not.toContain('AutoRental')
    expect(serialized).not.toContain('InStock')
    expect(serialized).not.toContain('AggregateRating')
    expect(serialized).not.toContain('availability')
  })

  it('excludes inactive/zero prices and omits offers when no truthful range exists', () => {
    stub([
      category('C', [priceRow(0), priceRow(90_000, 'inactive')]),
      category('FX', []),
    ])

    expect(() => useCityServiceSchema('Cali', 'cali')).not.toThrow()
    const { serviceSchema } = useCityServiceSchema('Cali', 'cali')
    expect(serviceSchema.offers).toBeUndefined()
  })

  it.each(brands)('uses stable Organization/Brand references for $name', (brand) => {
    stub([category('C', [priceRow(90_000)])], brand)
    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')

    expect(serviceSchema.provider).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(serviceSchema.broker).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(serviceSchema.brand).toEqual({ '@id': `${brand.website}/#brand` })
    expect(serviceSchema.url).toBe(`${brand.website}/bogota`)
  })

  it('snapshots equivalent Service semantics across all three brands', () => {
    const output = brands.map((brand) => {
      stub([
        category('C', [priceRow(90_000)]),
        category('FX', [priceRow(220_000)]),
      ], brand)
      const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')
      vi.unstubAllGlobals()

      return serviceSchema
    })

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "@id": "https://alquilatucarro.com/bogota#vehicle-rental-booking-service",
          "@type": "Service",
          "areaServed": {
            "@type": "City",
            "containedInPlace": {
              "@type": "Country",
              "name": "Colombia",
            },
            "name": "Bogotá",
          },
          "brand": {
            "@id": "https://alquilatucarro.com/#brand",
          },
          "broker": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "description": "Compara tarifas y solicita una reserva de alquiler de vehículos en Bogotá, Colombia. Alquilatucarro actúa como intermediario digital.",
          "name": "Servicio de intermediación para alquiler de vehículos en Bogotá",
          "offers": {
            "@id": "https://alquilatucarro.com/bogota#vehicle-rental-booking-service-daily-price-range",
            "@type": "AggregateOffer",
            "businessFunction": {
              "@id": "http://purl.org/goodrelations/v1#LeaseOut",
            },
            "highPrice": 220000,
            "itemOffered": {
              "@id": "https://alquilatucarro.com/bogota#vehicle-rental-booking-service",
            },
            "lowPrice": 90000,
            "offerCount": 2,
            "priceCurrency": "COP",
            "url": "https://alquilatucarro.com/bogota",
          },
          "provider": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
          "url": "https://alquilatucarro.com/bogota",
        },
        {
          "@id": "https://alquilame.co/bogota#vehicle-rental-booking-service",
          "@type": "Service",
          "areaServed": {
            "@type": "City",
            "containedInPlace": {
              "@type": "Country",
              "name": "Colombia",
            },
            "name": "Bogotá",
          },
          "brand": {
            "@id": "https://alquilame.co/#brand",
          },
          "broker": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "description": "Compara tarifas y solicita una reserva de alquiler de vehículos en Bogotá, Colombia. Alquilame actúa como intermediario digital.",
          "name": "Servicio de intermediación para alquiler de vehículos en Bogotá",
          "offers": {
            "@id": "https://alquilame.co/bogota#vehicle-rental-booking-service-daily-price-range",
            "@type": "AggregateOffer",
            "businessFunction": {
              "@id": "http://purl.org/goodrelations/v1#LeaseOut",
            },
            "highPrice": 220000,
            "itemOffered": {
              "@id": "https://alquilame.co/bogota#vehicle-rental-booking-service",
            },
            "lowPrice": 90000,
            "offerCount": 2,
            "priceCurrency": "COP",
            "url": "https://alquilame.co/bogota",
          },
          "provider": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
          "url": "https://alquilame.co/bogota",
        },
        {
          "@id": "https://alquicarros.com/bogota#vehicle-rental-booking-service",
          "@type": "Service",
          "areaServed": {
            "@type": "City",
            "containedInPlace": {
              "@type": "Country",
              "name": "Colombia",
            },
            "name": "Bogotá",
          },
          "brand": {
            "@id": "https://alquicarros.com/#brand",
          },
          "broker": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "description": "Compara tarifas y solicita una reserva de alquiler de vehículos en Bogotá, Colombia. Alquicarros actúa como intermediario digital.",
          "name": "Servicio de intermediación para alquiler de vehículos en Bogotá",
          "offers": {
            "@id": "https://alquicarros.com/bogota#vehicle-rental-booking-service-daily-price-range",
            "@type": "AggregateOffer",
            "businessFunction": {
              "@id": "http://purl.org/goodrelations/v1#LeaseOut",
            },
            "highPrice": 220000,
            "itemOffered": {
              "@id": "https://alquicarros.com/bogota#vehicle-rental-booking-service",
            },
            "lowPrice": 90000,
            "offerCount": 2,
            "priceCurrency": "COP",
            "url": "https://alquicarros.com/bogota",
          },
          "provider": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
          },
          "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
          "url": "https://alquicarros.com/bogota",
        },
      ]
    `)
  })
})
