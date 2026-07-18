import { useCityServiceSchema } from './useCityServiceSchema'

/**
 * Backward-compatible entry point for the existing city-page wiring.
 *
 * The historical name is retained to avoid overlapping the open content PR's
 * Alquilatucarro CityPage. The emitted node is a Service + price range; this
 * composable no longer creates Product nodes or inventory claims.
 */
export const useCityProductSchema = useCityServiceSchema
