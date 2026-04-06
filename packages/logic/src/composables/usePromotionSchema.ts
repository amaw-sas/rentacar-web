// External dependencies
import type { Offer } from 'schema-dts'

interface PromotionSchemaOptions {
    name: string
    description: string
    discountPercentage?: number
    validFrom?: string
    validThrough?: string
    eligibleRegion?: string | string[]
}

/**
 * Composable to add Promotion/Offer structured data
 * Enables promotional rich snippets in Google SERPs
 */
export const usePromotionSchema = (options: PromotionSchemaOptions) => {
    const { franchise } = useAppConfig()

    const {
        name,
        description,
        discountPercentage,
        validFrom,
        validThrough,
        eligibleRegion = 'CO'
    } = options

    // Use fixed dates to avoid hydration mismatch between server/client
    // For Schema.org, only server-rendered value matters (for crawlers)
    const defaultValidFrom = validFrom || '2026-01-01'
    const defaultValidThrough = validThrough || '2026-12-31'

    const regions = Array.isArray(eligibleRegion) ? eligibleRegion : [eligibleRegion]

    const promotionSchema = <Offer>{
        '@type': 'Offer',
        '@id': `${franchise.website}#promotion`,
        name,
        description,
        url: franchise.website,
        priceCurrency: 'COP',
        priceSpecification: discountPercentage ? {
            '@type': 'PriceSpecification',
            valueAddedTaxIncluded: true,
            priceCurrency: 'COP'
        } : undefined,
        availabilityStarts: defaultValidFrom,
        availabilityEnds: defaultValidThrough,
        eligibleRegion: regions.map(region => ({
            '@type': 'Country',
            name: region === 'CO' ? 'Colombia' : region === 'MX' ? 'México' : region
        })),
        seller: {
            '@type': 'Organization',
            name: franchise.shortname,
            url: franchise.website
        },
        itemOffered: {
            '@type': 'Service',
            name: 'Alquiler de Carros',
            description: 'Servicio de alquiler de vehículos en Colombia',
            provider: {
                '@type': 'Organization',
                name: franchise.shortname
            },
            areaServed: {
                '@type': 'Country',
                name: 'Colombia'
            }
        }
    }

    // Add discount if provided
    if (discountPercentage) {
        (promotionSchema as any).priceSpecification = {
            '@type': 'UnitPriceSpecification',
            priceType: 'https://schema.org/SalePrice',
            valueAddedTaxIncluded: true,
            priceCurrency: 'COP',
            referenceQuantity: {
                '@type': 'QuantitativeValue',
                value: discountPercentage,
                unitCode: 'P1' // Percentage
            }
        }
    }

    useSchemaOrg([promotionSchema])

    return {
        promotionSchema
    }
}

/**
 * Pre-configured for homepage 60% discount promotion
 */
export const useEarlyBookingPromotion = () => {
    return usePromotionSchema({
        name: 'Hasta 60% de Descuento - Reserva Anticipada',
        description: 'Obtén hasta un 60% de descuento al reservar con anticipación. Aplica para todas las categorías: compactos, sedanes y camionetas. Reserva sin pago anticipado y asegura los mejores precios por planificar tu viaje con tiempo.',
        discountPercentage: 60,
        eligibleRegion: ['CO']
    })
}
