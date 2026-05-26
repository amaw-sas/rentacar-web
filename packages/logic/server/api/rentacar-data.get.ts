import { useSupabaseClient } from '../utils/supabase'
import { fetchRentacarData, RentacarDataTimeoutError } from '../utils/rentacarDataFetch'
import { rentacarDataCacheKey } from '../utils/rentacarDataCacheKey'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories, transformCities, transformFranchiseTestimonials, transformFAQs } from '../utils/transformers'

export default defineCachedEventHandler(async () => {
  const supabase = useSupabaseClient()

  // NOTE(perf #11): each brand's SSR payload still includes all 3 brands'
  // testimonials (~14KB cross-brand bloat per render) via the franchises
  // query inside fetchRentacarData. Acceptable while testimonials are static
  // and small; revisit before the Google Maps Reviews integration.
  const [categoriesResult, locationsResult, companyResult, citiesResult, franchisesResult, faqsResult] =
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
  if (faqsResult.error) {
    throw createError({ statusCode: 500, message: `FAQs query failed: ${faqsResult.error.message}` })
  }

  return {
    categories: transformCategories(categoriesResult.data),
    branches: transformBranches(locationsResult.data),
    extras: transformExtras(companyResult.data),
    vehicleCategories: transformVehicleCategories(categoriesResult.data),
    cities: transformCities(citiesResult.data),
    franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data),
    faqs: transformFAQs(faqsResult.data),
  }
}, {
  maxAge: 3600,
  name: 'rentacar-data',
  // Scope the cache to a single deployment. Vercel restores Nitro's persisted
  // handler cache across builds, so without a per-build key a new deploy can be
  // served the previous deploy's response — whose schema may predate the current
  // code (e.g. a body without `faqs`), which crashes the `/` prerender. Keying on
  // app.buildId (unique per prod build, stable within a build) makes a restored
  // entry sit under the old key and be ignored, while the cache is still reused
  // within a deploy. See docs/specs/2026-05-26-rentacar-data-cache-deploy-scope-design.md.
  getKey: (event) => rentacarDataCacheKey(useRuntimeConfig(event).app.buildId),
  // TODO(perf+seo): broader cache strategy still open (#7 / #16-F2) — pricing
  // edits in admin take up to 1h (maxAge) to surface; options are a shorter
  // maxAge, swr, or tag-based invalidation from the admin write path.
})
