import { useSupabaseClient } from '../utils/supabase'
import { fetchRentacarData, RentacarDataTimeoutError } from '../utils/rentacarDataFetch'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories, transformCities, transformFranchiseTestimonials } from '../utils/transformers'

export default defineCachedEventHandler(async () => {
  const supabase = useSupabaseClient()

  // NOTE(perf #11): each brand's SSR payload still includes all 3 brands'
  // testimonials (~14KB cross-brand bloat per render) via the franchises
  // query inside fetchRentacarData. Acceptable while testimonials are static
  // and small; revisit before the Google Maps Reviews integration.
  const [categoriesResult, locationsResult, companyResult, citiesResult, franchisesResult] =
    await fetchRentacarData(supabase).catch((err) => {
      if (err instanceof RentacarDataTimeoutError) {
        throw createError({ statusCode: 504, statusMessage: 'rentacar-data upstream timeout' })
      }
      throw err
    })

  if (categoriesResult.error) {
    throw createError({ statusCode: 500, message: `Categories query failed: ${categoriesResult.error.message}` })
  }
  if (locationsResult.error) {
    throw createError({ statusCode: 500, message: `Locations query failed: ${locationsResult.error.message}` })
  }
  if (companyResult.error) {
    throw createError({ statusCode: 500, message: `Rental company query failed: ${companyResult.error.message}` })
  }
  if (citiesResult.error) {
    throw createError({ statusCode: 500, message: `Cities query failed: ${citiesResult.error.message}` })
  }
  if (franchisesResult.error) {
    throw createError({ statusCode: 500, message: `Franchises query failed: ${franchisesResult.error.message}` })
  }

  return {
    categories: transformCategories(categoriesResult.data),
    branches: transformBranches(locationsResult.data),
    extras: transformExtras(companyResult.data),
    vehicleCategories: transformVehicleCategories(categoriesResult.data),
    cities: transformCities(citiesResult.data),
    franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data),
  }
}, {
  // TODO(perf+seo): revisit cache strategy before launch. 1h is fine while in
  // alpha but pricing edits in admin take up to 1h to surface. Options:
  // shorter maxAge, swr revalidation, or tag-based invalidation triggered
  // from the admin write path.
  maxAge: 3600,
  name: 'rentacar-data',
})
