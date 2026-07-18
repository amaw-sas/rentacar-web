import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AMAW_ORGANIZATION_ID } from '../../utils/structuredDataIdentity'
import { useCityProductSchema } from '../useCityProductSchema'
import { useCityServiceSchema } from '../useCityServiceSchema'

const brands = [
  { name: 'Alquilatucarro', website: 'https://alquilatucarro.com' },
  { name: 'Alquilame', website: 'https://alquilame.co' },
  { name: 'Alquicarros', website: 'https://alquicarros.com' },
] as const

let capturedSchemas: any[] = []

const stub = (brand: (typeof brands)[number] = brands[0]) => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: { website: brand.website },
    organization: { name: 'AMAW SAS', brand: brand.name },
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

describe('useCityServiceSchema runtime — F6', () => {
  it('keeps the existing city-page entry point wired to Service semantics', () => {
    expect(useCityProductSchema).toBe(useCityServiceSchema)

    stub()
    const { serviceSchema } = useCityProductSchema('Bogotá', 'bogota')
    expect(serviceSchema['@type']).toBe('Service')
    expect(capturedSchemas).toEqual([serviceSchema])
  })

  it('emits a city Service without Offer claims', () => {
    stub()

    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')
    const renderedSchema = JSON.stringify(capturedSchemas)

    expect(capturedSchemas).toEqual([serviceSchema])
    expect(serviceSchema['@type']).toBe('Service')
    expect(serviceSchema).not.toHaveProperty('offers')
    expect(renderedSchema).not.toContain('Offer')
    expect(renderedSchema).not.toContain('price')
    expect(renderedSchema).not.toContain('offerCount')
  })

  it('does not read global seasonal rows to manufacture city offers', () => {
    const useFetchRentacarData = vi.fn(() => ({
      categories: [
        {
          id: 'C',
          month_prices: [
            { status: 'active', one_day_price: 90_000 },
            { status: 'active', one_day_price: 150_000 },
          ],
        },
        {
          id: 'FX',
          month_prices: [
            { status: 'active', one_day_price: 130_000 },
            { status: 'active', one_day_price: 200_000 },
          ],
        },
      ],
    }))

    vi.stubGlobal('useFetchRentacarData', useFetchRentacarData)
    stub()

    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')

    expect(useFetchRentacarData).not.toHaveBeenCalled()
    expect(serviceSchema).not.toHaveProperty('offers')
    expect(JSON.stringify(serviceSchema)).not.toContain('AggregateOffer')
  })

  it('never serializes Product, AutoRental, availability, or rating claims', () => {
    stub()
    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')
    const serialized = JSON.stringify(serviceSchema)

    expect(serialized).not.toContain('Product')
    expect(serialized).not.toContain('AutoRental')
    expect(serialized).not.toContain('InStock')
    expect(serialized).not.toContain('AggregateRating')
    expect(serialized).not.toContain('availability')
  })

  it('renders safely without rental pricing data', () => {
    stub()

    expect(() => useCityServiceSchema('Cali', 'cali')).not.toThrow()
    const { serviceSchema } = useCityServiceSchema('Cali', 'cali')
    expect(serviceSchema).not.toHaveProperty('offers')
  })

  it.each(brands)('uses stable Organization/Brand references for $name', (brand) => {
    stub(brand)
    const { serviceSchema } = useCityServiceSchema('Bogotá', 'bogota')

    expect(serviceSchema.provider).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(serviceSchema.broker).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(serviceSchema.brand).toEqual({ '@id': `${brand.website}/#brand` })
    expect(serviceSchema.url).toBe(`${brand.website}/bogota`)
  })

  it('snapshots equivalent price-free Service semantics across all three brands', () => {
    const output = brands.map((brand) => {
      stub(brand)
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
