import {
  getCityPageTitle,
  truncateForSEO,
} from '@rentacar-main/logic/composables/useCityPageSEO'

import {
  getCityMetaDescription,
  getCityPullQuoteSource,
} from '~/data/cityContent'
import { useCityFAQSchema } from '~/data/cityFAQs'

/** Alquilame-only city SEO wiring, including local meta copy and local FAQ schema. */
export const useAlquilameCityPageSEO = () => {
  useBaseSEO()

  const { getCityById } = useData()
  const { franchise } = useAppConfig()
  const route = useRoute()
  const cityParam = route.params.city
  const catalogCity = cityParam ? getCityById(cityParam as string) : undefined
  const metaDescription = catalogCity
    ? getCityMetaDescription(catalogCity.id) ?? catalogCity.description
    : null
  const pullQuoteSource = catalogCity
    ? getCityPullQuoteSource(catalogCity.id) ?? catalogCity.description
    : null
  const city = catalogCity && pullQuoteSource
    ? { ...catalogCity, description: pullQuoteSource }
    : catalogCity

  const cityDescription = metaDescription
    ? truncateForSEO(metaDescription, 155)
    : franchise.description
  const cityTitle = city ? getCityPageTitle(city.name) : franchise.title
  const cityShareImageAlt = city
    ? `Alquiler de carros en ${city.name} — ${franchise.name}`
    : franchise.name

  useHead({
    title: cityTitle,
    htmlAttrs: { lang: 'es' },
    link: [{
      rel: 'canonical',
      href: `${franchise.website}/${cityParam}`,
    }],
  })

  useSeoMeta({
    description: cityDescription,
    ogDescription: cityDescription,
    twitterDescription: cityDescription,
    ogImage: franchise.ogImage,
    ogImageAlt: cityShareImageAlt,
    twitterImage: franchise.ogImage,
    twitterImageAlt: cityShareImageAlt,
  })

  if (city) {
    useCityBreadcrumbs(city.name, cityParam as string)
    useCityFAQSchema(city.name, `${franchise.website}/${cityParam}`)
  }

  return { city }
}
