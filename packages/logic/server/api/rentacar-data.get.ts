import { useSupabaseClient } from '../utils/supabase'
import { fetchRentacarData, RentacarDataTimeoutError } from '../utils/rentacarDataFetch'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories, transformCities, transformFranchiseTestimonials, transformFAQs } from '../utils/transformers'

// Catalog freshness has one cache clock: the one-hour ISR window declared by
// each price-bearing page. Do not add a handler cache here. Stacking another
// TTL would let a document regenerate from an older catalog snapshot and push
// tariff staleness beyond the documented one-hour SLA.
export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient()

  // Issue #322 PR10: scope the franchises query to this deploy's brand — each
  // deployment serves exactly one brand, so cross-brand testimonials were pure
  // payload bloat (perf #11). Empty/absent config (standalone logic layer)
  // falls back to unfiltered, preserving the old behavior.
  const franchiseCode = useRuntimeConfig(event).public?.rentacarFranchise as string | undefined

  const [categoriesResult, locationsResult, companyResult, citiesResult, franchisesResult, faqsResult] =
    await fetchRentacarData(supabase, undefined, franchiseCode).catch((err) => {
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
  // A missing `localiza` row (PGRST116 from .single()) must NOT crash the
  // page: extras fall back client-side (useCategory `?? 12000`). PGRST116 here
  // means zero rows or a transient failure only — never a duplicate, since
  // rental_companies.code is UNIQUE — so tolerating companyResult.error cannot
  // silently mask an integrity violation. Categories/branches/cities/
  // franchises/faqs errors keep throwing — those break the booking flow.
  // See issue #16, Finding 1.
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
    // Supabase infers the to-one `cities(slug)` embed as an array (the explicit-
    // column select yields a structured type, unlike the `*` selects), but the
    // FK is to-one, so at runtime `cities` is a single object|null — matching
    // SupabaseLocation. Assert the real runtime shape; transformBranches reads
    // `row.cities?.slug`. (The `*`-based transforms above infer `any` and pass.)
    branches: transformBranches(locationsResult.data as unknown as Parameters<typeof transformBranches>[0]),
    extras: companyResult.error || !companyResult.data
      ? undefined
      : transformExtras(companyResult.data),
    vehicleCategories: transformVehicleCategories(categoriesResult.data),
    cities: transformCities(citiesResult.data),
    franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data),
    faqs: transformFAQs(faqsResult.data),
  }
})
