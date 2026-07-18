import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSchemaOrgGraph,
  organizationResolver,
  webPageResolver,
} from '@unhead/schema-org'

import {
  AMAW_ORGANIZATION_ID,
  AMAW_ORGANIZATION_URL,
} from '../../utils/structuredDataIdentity'
import { useBaseSEO } from '../useBaseSEO'

const brands = [
  {
    name: 'Alquilatucarro',
    website: 'https://alquilatucarro.com',
    otherbrands: ['Alquilame', 'Alquicarros'],
  },
  {
    name: 'Alquilame',
    website: 'https://alquilame.co',
    otherbrands: ['Alquilatucarro', 'Alquicarros'],
  },
  {
    name: 'Alquicarros',
    website: 'https://alquicarros.com',
    otherbrands: ['Alquilatucarro', 'Alquilame'],
  },
] as const

let captured: any[] = []

const run = (brand: (typeof brands)[number]) => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: {
      name: brand.website.replace('https://', ''),
      title: `Alquiler — ${brand.name}`,
      shortname: brand.name.toLowerCase(),
      description: `Reserva vehículos con ${brand.name}`,
      website: brand.website,
      logo: '/logo.svg',
      phone: '+57 300 000 0000',
      email: `${brand.name.toLowerCase()}@example.test`,
      socialmedia: [],
    },
    organization: {
      name: 'AMAW SAS',
      logo: '/brand-logo.svg',
      brand: brand.name,
      otherbrands: brand.otherbrands,
    },
  }))
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarPublicApiBase: 'https://api.example.test' },
  }))
  vi.stubGlobal('useRoute', () => ({ path: '/bogota' }))
  vi.stubGlobal('useSeoMeta', () => {})
  vi.stubGlobal('useHead', () => {})
  vi.stubGlobal('defineWebSite', (value: any) => ({ '@type': 'WebSite', ...value }))
  vi.stubGlobal('defineWebPage', (value: any) => ({ '@type': 'WebPage', ...value }))
  vi.stubGlobal('defineOrganization', (value: any) => ({ '@type': 'Organization', ...value }))
  vi.stubGlobal('useSchemaOrg', (value: any[]) => {
    captured = value
  })

  useBaseSEO()
  return captured
}

const byType = (graph: any[], type: string) =>
  graph.filter((node) => node?.['@type'] === type)

afterEach(() => {
  captured = []
  vi.unstubAllGlobals()
})

describe('useBaseSEO structured identity — F6/F7', () => {
  it.each(brands)('emits the same canonical AMAW + public brand entities for $name', (brand) => {
    const graph = run(brand)
    const website = byType(graph, 'WebSite')[0]
    const webPage = byType(graph, 'WebPage')[0]
    const organization = byType(graph, 'Organization')[0]
    const service = byType(graph, 'Service')[0]

    expect(website.publisher).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(webPage).toEqual({ '@type': 'WebPage' })
    expect(webPage.title).toBeUndefined()

    expect(organization).toMatchObject({
      '@type': 'Organization',
      '@id': AMAW_ORGANIZATION_ID,
      name: 'AMAW SAS',
      url: AMAW_ORGANIZATION_URL,
      brand: [
        {
          '@type': 'Brand',
          '@id': 'https://alquilatucarro.com/#brand',
          name: 'Alquilatucarro',
          url: 'https://alquilatucarro.com',
        },
        {
          '@type': 'Brand',
          '@id': 'https://alquilame.co/#brand',
          name: 'Alquilame',
          url: 'https://alquilame.co',
        },
        {
          '@type': 'Brand',
          '@id': 'https://alquicarros.com/#brand',
          name: 'Alquicarros',
          url: 'https://alquicarros.com',
        },
      ],
    })
    expect(organization.subOrganization).toBeUndefined()
    expect(service.provider).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(service.broker).toEqual({ '@id': AMAW_ORGANIZATION_ID })
    expect(service.brand).toEqual({ '@id': `${brand.website}/#brand` })
  })

  it.each(brands)('keeps AMAW canonical when the real resolver runs on $name', (brand) => {
    const inputGraph = run(brand)
    const organization = byType(inputGraph, 'Organization')[0]
    const resolverGraph = createSchemaOrgGraph()
    resolverGraph.push({ ...organization, _resolver: organizationResolver })

    const resolvedGraph = resolverGraph.resolveGraph({
      host: brand.website,
      path: '/bogota',
    })
    const resolvedOrganization = resolvedGraph.find(
      (node) => node['@id'] === AMAW_ORGANIZATION_ID,
    )

    expect(resolvedOrganization).toMatchObject({
      '@type': 'Organization',
      '@id': AMAW_ORGANIZATION_ID,
      name: 'AMAW SAS',
      url: AMAW_ORGANIZATION_URL,
    })
  })

  it('lets the real WebPage resolver use page metadata without an AMAW title field', () => {
    const brand = brands[0]
    const inputGraph = run(brand)
    const webPage = byType(inputGraph, 'WebPage')[0]
    const resolverGraph = createSchemaOrgGraph()
    resolverGraph.push({ ...webPage, _resolver: webPageResolver })

    const resolvedGraph = resolverGraph.resolveGraph({
      host: brand.website,
      path: '/bogota',
      title: 'Alquiler de carros en Bogotá',
    })
    const resolvedWebPage = byType(resolvedGraph, 'WebPage')[0]

    expect(resolvedWebPage).toMatchObject({
      '@type': 'WebPage',
      name: 'Alquiler de carros en Bogotá',
    })
    expect(resolvedWebPage.title).toBeUndefined()
  })

  it.each(brands)('does not emit unsupported or fabricated schema types for $name', (brand) => {
    const graph = run(brand)
    const serialized = JSON.stringify(graph)

    expect(byType(graph, 'Service')).toHaveLength(1)
    expect(byType(graph, 'AutoRental')).toHaveLength(0)
    expect(byType(graph, 'Product')).toHaveLength(0)
    expect(serialized).not.toContain('AggregateRating')
  })

  it('snapshots the three-brand identity relationships', () => {
    const output = brands.map((brand) => {
      const graph = run(brand)
      const website = byType(graph, 'WebSite')[0]
      const webPage = byType(graph, 'WebPage')[0]
      const organization = byType(graph, 'Organization')[0]
      const service = byType(graph, 'Service')[0]
      vi.unstubAllGlobals()

      return {
        host: brand.website,
        website: {
          id: website['@id'],
          publisher: website.publisher,
        },
        webPage,
        organization,
        service: {
          type: service['@type'],
          id: service['@id'],
          serviceType: service.serviceType,
          provider: service.provider,
          broker: service.broker,
          brand: service.brand,
        },
      }
    })

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "host": "https://alquilatucarro.com",
          "organization": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
            "@type": "Organization",
            "brand": [
              {
                "@id": "https://alquilatucarro.com/#brand",
                "@type": "Brand",
                "name": "Alquilatucarro",
                "url": "https://alquilatucarro.com",
              },
              {
                "@id": "https://alquilame.co/#brand",
                "@type": "Brand",
                "name": "Alquilame",
                "url": "https://alquilame.co",
              },
              {
                "@id": "https://alquicarros.com/#brand",
                "@type": "Brand",
                "name": "Alquicarros",
                "url": "https://alquicarros.com",
              },
            ],
            "name": "AMAW SAS",
            "url": "https://alquilatucarro.com",
          },
          "service": {
            "brand": {
              "@id": "https://alquilatucarro.com/#brand",
            },
            "broker": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "id": "https://alquilatucarro.com/#vehicle-rental-booking-service",
            "provider": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
            "type": "Service",
          },
          "webPage": {
            "@type": "WebPage",
          },
          "website": {
            "id": "https://alquilatucarro.com/#website",
            "publisher": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
          },
        },
        {
          "host": "https://alquilame.co",
          "organization": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
            "@type": "Organization",
            "brand": [
              {
                "@id": "https://alquilatucarro.com/#brand",
                "@type": "Brand",
                "name": "Alquilatucarro",
                "url": "https://alquilatucarro.com",
              },
              {
                "@id": "https://alquilame.co/#brand",
                "@type": "Brand",
                "name": "Alquilame",
                "url": "https://alquilame.co",
              },
              {
                "@id": "https://alquicarros.com/#brand",
                "@type": "Brand",
                "name": "Alquicarros",
                "url": "https://alquicarros.com",
              },
            ],
            "name": "AMAW SAS",
            "url": "https://alquilatucarro.com",
          },
          "service": {
            "brand": {
              "@id": "https://alquilame.co/#brand",
            },
            "broker": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "id": "https://alquilame.co/#vehicle-rental-booking-service",
            "provider": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
            "type": "Service",
          },
          "webPage": {
            "@type": "WebPage",
          },
          "website": {
            "id": "https://alquilame.co/#website",
            "publisher": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
          },
        },
        {
          "host": "https://alquicarros.com",
          "organization": {
            "@id": "https://alquilatucarro.com/#amaw-sas",
            "@type": "Organization",
            "brand": [
              {
                "@id": "https://alquilatucarro.com/#brand",
                "@type": "Brand",
                "name": "Alquilatucarro",
                "url": "https://alquilatucarro.com",
              },
              {
                "@id": "https://alquilame.co/#brand",
                "@type": "Brand",
                "name": "Alquilame",
                "url": "https://alquilame.co",
              },
              {
                "@id": "https://alquicarros.com/#brand",
                "@type": "Brand",
                "name": "Alquicarros",
                "url": "https://alquicarros.com",
              },
            ],
            "name": "AMAW SAS",
            "url": "https://alquilatucarro.com",
          },
          "service": {
            "brand": {
              "@id": "https://alquicarros.com/#brand",
            },
            "broker": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "id": "https://alquicarros.com/#vehicle-rental-booking-service",
            "provider": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
            "serviceType": "Intermediación digital para reservas de alquiler de vehículos",
            "type": "Service",
          },
          "webPage": {
            "@type": "WebPage",
          },
          "website": {
            "id": "https://alquicarros.com/#website",
            "publisher": {
              "@id": "https://alquilatucarro.com/#amaw-sas",
            },
          },
        },
      ]
    `)
  })
})
