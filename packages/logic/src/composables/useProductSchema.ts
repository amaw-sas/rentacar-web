// External dependencies
import type { Product, Offer, UnitPriceSpecification } from 'schema-dts'

// Types
import type { CategoryAvailabilityData, CategoryModelData, VehicleCategory } from '@rentacar-main/logic/utils';

interface ProductSchemaOptions {
    category: CategoryAvailabilityData
    vehicleCategory?: VehicleCategory
    cityName?: string
}

/**
 * Product schema for a category card in availability results.
 *
 * The brand label comes from `organization.brand` (per-brand), never a
 * hardcoded name, and the offer is the REAL quoted daily price (vehicle +
 * coverage) emitted as a per-day `UnitPriceSpecification`. City landings use
 * a separate Service price-range schema. Issue #312 removed the fabricated `AggregateOffer`
 * (its `highPrice` was dailyPrice × 30, the price of no real offer) and the
 * invented fixed `priceValidUntil`.
 */
export const useProductSchema = (options: ProductSchemaOptions): void => {
    const { franchise, organization } = useAppConfig()
    const route = useRoute()

    const { category, vehicleCategory, cityName } = options

    if (!vehicleCategory) return

    const citySlug = route.params.city as string || ''
    const cityLabel = cityName || citySlug

    const brandName = organization.brand

    const categoryName = vehicleCategory.grupo
    const categoryCode = category.categoryCode
    const description = vehicleCategory.descripcion_larga || vehicleCategory.descripcion_corta

    const models = category.categoryModels || []
    const modelNames = models.map((m: CategoryModelData) => m.name).join(', ')

    const dailyPrice = category.vehicleDayCharge + category.coverageUnitCharge

    const productSchema = <Product>{
        '@type': 'Product',
        '@id': `${franchise.website}/${citySlug}#vehicle-${categoryCode}`,
        name: `Alquiler ${categoryName} en ${cityLabel}`,
        description: `${description}. Modelos disponibles: ${modelNames}`,
        category: 'Alquiler de Vehículos',
        brand: {
            '@type': 'Brand',
            name: brandName
        },
        image: models[0]?.image || franchise.logo,
        offers: <Offer>{
            '@type': 'Offer',
            priceCurrency: 'COP',
            price: dailyPrice,
            priceSpecification: <UnitPriceSpecification>{
                '@type': 'UnitPriceSpecification',
                priceCurrency: 'COP',
                price: dailyPrice,
                unitCode: 'DAY' // UN/CEFACT: per-day rate, not a rental total
            },
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: brandName,
                url: franchise.website
            },
            areaServed: {
                '@type': 'City',
                name: cityLabel,
                containedInPlace: {
                    '@type': 'Country',
                    name: 'Colombia'
                }
            }
        },
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'Categoría',
                value: categoryCode
            },
            {
                '@type': 'PropertyValue',
                name: 'Tipo',
                value: categoryName
            },
            ...vehicleCategory.tags.map((tag: string) => ({
                '@type': 'PropertyValue',
                name: 'Característica',
                value: tag
            }))
        ]
    }

    useSchemaOrg([productSchema])
}
