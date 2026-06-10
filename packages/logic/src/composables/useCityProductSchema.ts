// External dependencies
import type { Product, Offer, UnitPriceSpecification } from 'schema-dts';

// Internal dependencies - utils
import { pickRepresentativeDailyPrice } from '../utils';

// Representative vehicle categories featured in the city landing schema.
// Curated Spanish names/descriptions (the Localiza catalog descriptions are in
// Portuguese — see issue #74). The real PRICE is no longer hardcoded: it is read
// per category from category_pricing (SSR via rentacar-data). See issue #68.
const representativeCategories = [
  {
    code: 'C',
    name: 'Económico',
    description: 'Vehículos compactos perfectos para ciudad. Fiat Mobi, Kia Picanto, Renault Kwid.',
  },
  {
    code: 'FX',
    name: 'Sedán Automático',
    description: 'Sedanes cómodos con transmisión automática. Kia Rio, Hyundai Accent, Suzuki Dzire.',
  },
  {
    code: 'GC',
    name: 'Camioneta SUV',
    description: 'Camionetas compactas ideales para familias. Suzuki Vitara, Hyundai Creta, Fiat Pulse.',
  },
  {
    code: 'LE',
    name: 'Camioneta Premium',
    description: 'SUVs de lujo con todas las comodidades. Kia Sportage, Hyundai Tucson, Renault Koleos.',
  },
]

/**
 * Generates Product schema for city landing pages so a JS-less crawler reads a
 * real, representative "from" price per featured category.
 *
 * The price is the cheapest positive active `one_day_price` from
 * category_pricing (`pickRepresentativeDailyPrice`) — the same source the
 * checkout uses — emitted as a per-day `UnitPriceSpecification`. A category with
 * no real price (absent, or no monthly plan) is omitted rather than published
 * with a fabricated or $0 value. The brand label comes from `organization.brand`
 * (per-brand), never a hardcoded name.
 */
export function useCityProductSchema(cityName: string, citySlug: string) {
  const { franchise, organization } = useAppConfig()
  const { vehicleCategories, categories } = useFetchRentacarData()

  const brandName = organization.brand

  const productSchemas = representativeCategories.flatMap((category) => {
    const categoryData = categories?.find((c) => c.id === category.code)
    const priceRow = categoryData ? pickRepresentativeDailyPrice(categoryData.month_prices) : undefined

    // Fail-soft: no real price → omit this category (never $0 or fabricated).
    if (!priceRow) return []

    const dailyPrice = priceRow.one_day_price
    const categoryImage = vehicleCategories?.[category.code]?.modelos?.[0]?.image || ''
    const validUntil = priceRow.end_date || undefined

    return [<Product>{
      '@type': 'Product',
      '@id': `${franchise.website}/${citySlug}#vehicle-${category.code}`,
      name: `Alquiler ${category.name} en ${cityName}`,
      description: `${category.description} Disponible para alquiler en ${cityName}, Colombia.`,
      category: 'Alquiler de Vehículos',
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
      // Omit empty image rather than emit image:'' (incomplete Product node).
      ...(categoryImage ? { image: categoryImage } : {}),
      offers: <Offer>{
        '@type': 'Offer',
        priceCurrency: 'COP',
        price: dailyPrice,
        priceSpecification: <UnitPriceSpecification>{
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'COP',
          price: dailyPrice,
          unitCode: 'DAY', // UN/CEFACT: per-day rate, not a rental total
        },
        availability: 'https://schema.org/InStock',
        ...(validUntil ? { priceValidUntil: validUntil } : {}),
        seller: {
          '@type': 'Organization',
          name: brandName,
          url: franchise.website,
        },
        areaServed: {
          '@type': 'City',
          name: cityName,
          containedInPlace: {
            '@type': 'Country',
            name: 'Colombia',
          },
        },
      },
    }]
  })

  useSchemaOrg(productSchemas)

  return {
    productSchemas,
  }
}
