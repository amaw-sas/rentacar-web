import { useSupabaseClient } from '../utils/supabase'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories, transformCities, transformFranchiseTestimonials } from '../utils/transformers'

export default defineCachedEventHandler(async () => {
  const supabase = useSupabaseClient()

  const [categoriesResult, locationsResult, companyResult, citiesResult, franchisesResult] = await Promise.all([
    supabase
      .from('vehicle_categories')
      .select('*, category_models(*), category_pricing(*)')
      .eq('status', 'active')
      .order('code'),

    supabase
      .from('locations')
      .select('id, code, name, city, slug, schedule, status, cities(slug)')
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('rental_companies')
      .select('extra_driver_day_price, baby_seat_day_price, wash_price, wash_onsite_price, wash_deep_price, wash_deep_upholstery_price')
      .eq('code', 'localiza')
      .single(),

    supabase
      .from('cities')
      .select('slug, name, description, testimonials')
      .eq('status', 'active')
      .order('name'),

    // TODO(perf): each brand's SSR payload includes all 3 brands' testimonials
    // (~14KB cross-brand bloat per render). Acceptable while testimonials are
    // static and small; revisit when this stops being true (e.g., before the
    // Google Maps Reviews integration). Per-brand filter would require either
    // a dynamic cache key based on rentacarFranchise or a brand-aware wrapper
    // route — both are larger changes than this issue's scope (#11).
    supabase
      .from('franchises')
      .select('code, testimonials')
      .eq('status', 'active')
      .order('code'),
  ])

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
