// External dependencies
import type { Product, Offer, AggregateOffer, Car } from 'schema-dts'

// Types
import type { CategoryAvailabilityData, CategoryModelData, VehicleCategory } from '@rentacar-main/logic/utils';

interface ProductSchemaOptions {
    category: CategoryAvailabilityData
    vehicleCategory?: VehicleCategory
    cityName?: string
}

export const useProductSchema = (options: ProductSchemaOptions): void => {
    const { franchise } = useAppConfig()
    const route = useRoute()

    const { category, vehicleCategory, cityName } = options

    if (!vehicleCategory) return

    const citySlug = route.params.city as string || ''
    const cityLabel = cityName || citySlug

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
            name: 'Alquilatucarro'
        },
        image: models[0]?.image || franchise.logo,
        offers: <AggregateOffer>{
            '@type': 'AggregateOffer',
            priceCurrency: 'COP',
            lowPrice: dailyPrice,
            highPrice: dailyPrice * 30,
            offerCount: models.length || 1,
            availability: 'https://schema.org/InStock',
            priceValidUntil: getNextMonthDate(),
            seller: {
                '@type': 'Organization',
                name: 'Alquilatucarro',
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

function getNextMonthDate(): string {
    // Use fixed date to avoid hydration mismatch between server/client
    // For Schema.org, only server-rendered value matters (for crawlers)
    return '2026-12-31'
}

export const useCarSchema = (options: ProductSchemaOptions): void => {
    const { franchise } = useAppConfig()
    const route = useRoute()

    const { category, vehicleCategory, cityName } = options

    if (!vehicleCategory || !category.categoryModels?.length) return

    const citySlug = route.params.city as string || ''
    const cityLabel = cityName || citySlug

    const models = category.categoryModels

    const carSchemas = models.slice(0, 3).map((model: CategoryModelData, index: number) => {
        return <Car>{
            '@type': 'Car',
            '@id': `${franchise.website}/${citySlug}#car-${category.categoryCode}-${index}`,
            name: model.name,
            image: model.image,
            vehicleConfiguration: vehicleCategory.grupo,
            description: `${model.name} disponible para alquiler en ${cityLabel}`,
            offers: <Offer>{
                '@type': 'Offer',
                priceCurrency: 'COP',
                price: category.vehicleDayCharge + category.coverageUnitCharge,
                priceValidUntil: getNextMonthDate(),
                availability: 'https://schema.org/InStock',
                seller: {
                    '@type': 'Organization',
                    name: 'Alquilatucarro'
                }
            }
        }
    })

    useSchemaOrg(carSchemas)
}
