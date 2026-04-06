// External dependencies
import type { Product, AggregateOffer } from 'schema-dts';

interface CityPricing {
  lowPrice: number
  highPrice: number
}

// Base prices per city (in COP) - from useCityFAQs.ts
const cityPricing: Record<string, CityPricing> = {
  'Bogotá': { lowPrice: 110000, highPrice: 450000 },
  'Medellín': { lowPrice: 115000, highPrice: 460000 },
  'Cali': { lowPrice: 105000, highPrice: 420000 },
  'Cartagena': { lowPrice: 120000, highPrice: 480000 },
  'Barranquilla': { lowPrice: 100000, highPrice: 400000 },
  'Santa Marta': { lowPrice: 110000, highPrice: 440000 },
  'Pereira': { lowPrice: 105000, highPrice: 420000 },
  'Bucaramanga': { lowPrice: 100000, highPrice: 400000 },
  'Armenia': { lowPrice: 100000, highPrice: 400000 },
  'Manizales': { lowPrice: 105000, highPrice: 420000 },
  'Villavicencio': { lowPrice: 95000, highPrice: 380000 },
  'Valledupar': { lowPrice: 95000, highPrice: 380000 },
  'Ibagué': { lowPrice: 95000, highPrice: 380000 },
  'Neiva': { lowPrice: 90000, highPrice: 360000 },
  'Cúcuta': { lowPrice: 90000, highPrice: 360000 },
  'Montería': { lowPrice: 95000, highPrice: 380000 },
  'Floridablanca': { lowPrice: 95000, highPrice: 380000 },
  'Palmira': { lowPrice: 100000, highPrice: 400000 },
  'Soledad': { lowPrice: 95000, highPrice: 380000 },
}

// Representative vehicle categories for schema
const representativeCategories = [
  {
    code: 'C',
    name: 'Económico',
    description: 'Vehículos compactos perfectos para ciudad. Fiat Mobi, Kia Picanto, Renault Kwid.',
    image: 'https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgamac%2Fgrupo-c-kia-picanto-alquiler-de-carros.avif?alt=media',
    priceMultiplier: 1.0
  },
  {
    code: 'FX',
    name: 'Sedán Automático',
    description: 'Sedanes cómodos con transmisión automática. Kia Rio, Hyundai Accent, Suzuki Dzire.',
    image: 'https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupofx%2Fgrupo-fx-kia-rio-alquiler-de-carros.avif?alt=media',
    priceMultiplier: 1.3
  },
  {
    code: 'GC',
    name: 'Camioneta SUV',
    description: 'Camionetas compactas ideales para familias. Suzuki Vitara, Hyundai Creta, Fiat Pulse.',
    image: 'https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupogc%2Fgrupo-gc-suzuki-vitara-at-alquiler-de-camionetas.avif?alt=media',
    priceMultiplier: 1.8
  },
  {
    code: 'LE',
    name: 'Camioneta Premium',
    description: 'SUVs de lujo con todas las comodidades. Kia Sportage, Hyundai Tucson, Renault Koleos.',
    image: 'https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Fcategorias%2Fgrupole%2Fgrupo-le-kia-sportage-alquiler-de-camionetas.avif?alt=media',
    priceMultiplier: 2.5
  }
]

/**
 * Generates Product Schema for city landing pages
 * This provides structured data for Google to show rich results
 * even when no search has been performed
 */
export function useCityProductSchema(cityName: string, citySlug: string) {
  const { franchise } = useAppConfig()

  const pricing = cityPricing[cityName] || { lowPrice: 100000, highPrice: 400000 }

  const productSchemas = representativeCategories.map((category) => {
    const categoryLowPrice = Math.round(pricing.lowPrice * category.priceMultiplier)
    const categoryHighPrice = Math.round(pricing.highPrice * category.priceMultiplier)

    return <Product>{
      '@type': 'Product',
      '@id': `${franchise.website}/${citySlug}#vehicle-${category.code}`,
      name: `Alquiler ${category.name} en ${cityName}`,
      description: `${category.description} Disponible para alquiler en ${cityName}, Colombia.`,
      category: 'Alquiler de Vehículos',
      brand: {
        '@type': 'Brand',
        name: 'Alquilatucarro'
      },
      image: category.image,
      offers: <AggregateOffer>{
        '@type': 'AggregateOffer',
        priceCurrency: 'COP',
        lowPrice: categoryLowPrice,
        highPrice: categoryHighPrice,
        offerCount: 4,
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
        seller: {
          '@type': 'Organization',
          name: 'Alquilatucarro',
          url: franchise.website
        },
        areaServed: {
          '@type': 'City',
          name: cityName,
          containedInPlace: {
            '@type': 'Country',
            name: 'Colombia'
          }
        }
      }
    }
  })

  useSchemaOrg(productSchemas)

  return {
    productSchemas
  }
}
