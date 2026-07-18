import type {
  ContactPoint,
  EntryPoint,
  RentalCarReservation,
  ReserveAction,
  Service,
  ServiceChannel,
  SoftwareApplication,
} from 'schema-dts'

import {
  AMAW_ORGANIZATION_ID,
  AMAW_ORGANIZATION_URL,
  getCurrentBrandIdentity,
  getOrganizationBrandIdentities,
} from '../utils/structuredDataIdentity'

export const useBaseSEO = () => {
  const { franchise, organization } = useAppConfig()
  const route = useRoute()
  const website = franchise.website.replace(/\/+$/, '')
  const brand = getCurrentBrandIdentity(organization.brand, website)
  const organizationBrands = getOrganizationBrandIdentities(
    organization.brand,
    organization.otherbrands,
    website,
  )

  // Issue #116: public base of the dashboard's documented API (D2), shared by
  // the 3 brands. An empty/missing value disables the programmatic EntryPoint.
  const apiBase = (useRuntimeConfig().public.rentacarPublicApiBase ?? '').replace(/\/+$/, '')

  const reserveAction = <ReserveAction>{
    '@type': 'ReserveAction',
    name: `Reservar vehículo en ${franchise.name}`,
    target: [
      <EntryPoint>{
        '@type': 'EntryPoint',
        urlTemplate: website,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      ...(apiBase ? [<EntryPoint>{
        '@type': 'EntryPoint',
        urlTemplate: `${apiBase}/api/reservations`,
        httpMethod: 'POST',
        contentType: 'application/json',
        encodingType: 'application/json',
        actionApplication: <SoftwareApplication>{
          '@type': 'SoftwareApplication',
          name: 'Rentacar Reservations API',
          applicationCategory: 'BusinessApplication',
          url: `${apiBase}/api/openapi`,
        },
      }] : []),
    ],
    result: <RentalCarReservation>{
      '@type': 'RentalCarReservation',
    },
  }

  useSeoMeta({
    title: franchise.name,
    description: franchise.description,
  })

  useHead({
    title: franchise.title,
    templateParams: {
      schemaOrg: {
        host: website,
        path: route.path,
        inLanguage: 'es',
      },
    },
    htmlAttrs: {
      lang: 'es',
    },
  })

  useSchemaOrg([
    defineWebSite({
      '@id': `${website}/#website`,
      url: website,
      name: franchise.name,
      inLanguage: 'es',
      publisher: { '@id': AMAW_ORGANIZATION_ID },
    }),
    // The page-specific useHead/useSeoMeta call supplies the actual page name.
    // Injecting the parent company name here produced WebPage.title="AMAW SAS".
    defineWebPage({}),
    defineOrganization({
      '@id': AMAW_ORGANIZATION_ID,
      name: organization.name,
      url: AMAW_ORGANIZATION_URL,
      brand: organizationBrands,
    }),
    <Service>{
      '@type': 'Service',
      '@id': `${website}/#vehicle-rental-booking-service`,
      url: website,
      name: `Servicio de intermediación para alquiler de vehículos de ${organization.brand}`,
      description: franchise.description,
      serviceType: 'Intermediación digital para reservas de alquiler de vehículos',
      provider: { '@id': AMAW_ORGANIZATION_ID },
      broker: { '@id': AMAW_ORGANIZATION_ID },
      brand: { '@id': brand['@id'] },
      areaServed: {
        '@type': 'Country',
        name: 'Colombia',
      },
      availableChannel: <ServiceChannel>{
        '@type': 'ServiceChannel',
        serviceUrl: website,
        servicePhone: <ContactPoint>{
          '@type': 'ContactPoint',
          telephone: franchise.phone,
          email: franchise.email,
          contactType: 'customer service',
          availableLanguage: 'es',
        },
      },
      termsOfService: `${website}/terminos-condiciones`,
      potentialAction: reserveAction,
    },
  ])
}
