import type { Service } from 'schema-dts'

import {
  AMAW_ORGANIZATION_ID,
  getCurrentBrandIdentity,
} from '../utils/structuredDataIdentity'

/**
 * Emits one truthful city-level rental-booking Service.
 *
 * Category pricing is global rather than city/date inventory, so it cannot
 * support a city Offer claim. Keep this graph price-free until the page has an
 * explicit, user-visible set of offers for the selected city and rental dates.
 */
export function useCityServiceSchema(cityName: string, citySlug: string) {
  const { franchise, organization } = useAppConfig()
  const website = franchise.website.replace(/\/+$/, '')
  const cityUrl = `${website}/${citySlug}`
  const serviceId = `${cityUrl}#vehicle-rental-booking-service`
  const brand = getCurrentBrandIdentity(organization.brand, website)

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
  }

  useSchemaOrg([serviceSchema])

  return {
    serviceSchema,
  }
}
