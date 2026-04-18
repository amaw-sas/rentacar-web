import { useSupabaseClient } from '../utils/supabase'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories } from '../utils/transformers'

export default defineCachedEventHandler(async () => {
  const supabase = useSupabaseClient()

  const [categoriesResult, locationsResult, companyResult] = await Promise.all([
    supabase
      .from('vehicle_categories')
      .select('*, category_models(*), category_pricing(*)')
      .eq('status', 'active')
      .order('code'),

    supabase
      .from('locations')
      .select('id, code, name, city, slug, schedule, status')
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('rental_companies')
      .select('extra_driver_day_price, baby_seat_day_price, wash_price')
      .eq('code', 'localiza')
      .single(),
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

  return {
    categories: transformCategories(categoriesResult.data),
    branches: transformBranches(locationsResult.data),
    extras: transformExtras(companyResult.data),
    vehicleCategories: transformVehicleCategories(categoriesResult.data),
  }
}, {
  // TODO(perf+seo): revisit cache strategy before launch. 1h is fine while in
  // alpha but pricing edits in admin take up to 1h to surface. Options:
  // shorter maxAge, swr revalidation, or tag-based invalidation triggered
  // from the admin write path.
  maxAge: 3600,
  name: 'rentacar-data',
})
