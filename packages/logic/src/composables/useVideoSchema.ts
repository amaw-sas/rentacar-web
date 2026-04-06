// External dependencies
import type { VideoObject } from 'schema-dts'

interface VideoSchemaOptions {
    name: string
    description: string
    videoId: string
    thumbnailUrl: string
    uploadDate?: string
    duration?: string // ISO 8601 duration format (e.g., "PT1M30S" for 1:30)
}

/**
 * Composable to add VideoObject structured data
 * Enables video rich snippets in Google SERPs and video search
 */
export const useVideoSchema = (options: VideoSchemaOptions) => {
    const { franchise } = useAppConfig()

    const {
        name,
        description,
        videoId,
        thumbnailUrl,
        uploadDate = '2024-01-15T00:00:00-05:00', // Default upload date (ISO 8601 with timezone)
        duration = 'PT1M' // Default 1 minute
    } = options

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    const embedUrl = `https://www.youtube.com/embed/${videoId}`

    const videoSchema = <VideoObject>{
        '@type': 'VideoObject',
        '@id': `${franchise.website}#promo-video`,
        name,
        description,
        thumbnailUrl,
        uploadDate,
        duration,
        contentUrl: videoUrl,
        embedUrl,
        publisher: {
            '@type': 'Organization',
            name: franchise.shortname,
            logo: {
                '@type': 'ImageObject',
                url: franchise.logo
            }
        },
        potentialAction: {
            '@type': 'WatchAction',
            target: videoUrl
        }
    }

    useSchemaOrg([videoSchema])

    return {
        videoSchema
    }
}

/**
 * Pre-configured for homepage promotional video
 */
export const usePromoVideoSchema = () => {
    return useVideoSchema({
        name: 'Hasta 60% de Descuento en Alquiler de Carros - Reserva Ahora, Paga Después',
        description: 'Obtén hasta un 60% de descuento al reservar con anticipación. Aplica para todas las categorías: compactos, sedanes y camionetas. Reserva sin pago anticipado y asegura los mejores precios por planificar tu viaje con tiempo.',
        videoId: '_MVNhinVYHE',
        thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Fvideo.webp?alt=media&token=424d037e-4aab-47ef-af6f-0fa0caa24e7f',
        uploadDate: '2024-01-15T00:00:00-05:00',
        duration: 'PT1M'
    })
}
