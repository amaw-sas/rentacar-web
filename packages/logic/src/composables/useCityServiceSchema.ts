import type { AggregateOffer, Service } from 'schema-dts'

import {
  AMAW_ORGANIZATION_ID,
  getCurrentBrandIdentity,
} from '../utils/structuredDataIdentity'

/**
 * Emits one truthful city-level rental-booking Service.
 *
 * Category pricing is global rather than city/date inventory, so it is only
 * used to describe the currently configured daily range. We deliberately do
 * not publish individual Product nodes or an InStock claim from that data.
 */
export function useCityServiceSchema(cityName: string, citySlug: string) {
  const { franchise, organization } = useAppConfig()
  const { categories } = useFetchRentacarData()
  const website = franchise.website.replace(/\/+$/, '')
  const cityUrl = `${website}/${citySlug}`
  const serviceId = `${cityUrl}#vehicle-rental-booking-service`
  const brand = getCurrentBrandIdentity(organization.brand, website)

  // AggregateOffer.lowPrice/highPrice/offerCount must all describe the same
  // represented offer set. Include every positive active configured daily-rate
  // row; taking only each category's minimum would understate highPrice.
  const dailyPrices = (categories ?? []).flatMap((category) =>
    category.month_prices
      .filter((price) => price.status === 'active' && price.one_day_price > 0)
      .map((price) => price.one_day_price),
  )

  const serviceSchema = <Service>{
    '@type': 'Service',
    '@id': serviceId,
    url: cityUrl,
    name: `Servicio de intermediación para alquiler de vehículos en ${cityName}`,
    description: `Compara tarifas y solicita una reserva de alquiler de vehículos en ${cityName}, Colombia. ${organization.brand} actúa como intermediario digital.`,
    serviceType: 'Intermediación digital para reservas de alquiler de vehículos',
    provider: { '@id': AMAW_ORGANIZATION_ID },
    broker: { '@id': AMAW_ORGANIZATION_ID },
    brand: { '@id': brand['@id'] },
    areaServed: {
      '@type': 'City',
      name: cityName,
      containedInPlace: {
        '@type': 'Country',
        name: 'Colombia',
      },
    },
    ...(dailyPrices.length > 0 ? {
      offers: <AggregateOffer>{
        '@type': 'AggregateOffer',
        '@id': `${serviceId}-daily-price-range`,
        url: cityUrl,
        priceCurrency: 'COP',
        lowPrice: Math.min(...dailyPrices),
        highPrice: Math.max(...dailyPrices),
        offerCount: dailyPrices.length,
        businessFunction: {
          '@id': 'http://purl.org/goodrelations/v1#LeaseOut',
        },
        itemOffered: { '@id': serviceId },
      },
    } : {}),
  }

  useSchemaOrg([serviceSchema])

  return {
    serviceSchema,
  }
}
