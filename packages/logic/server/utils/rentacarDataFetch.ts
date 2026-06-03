import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_TIMEOUT_MS = 8000

/**
 * Thrown when the parallel Supabase fetch does not complete within the
 * deadline. The handler maps this to a 504 instead of letting the request
 * hang until Nitro's default timeout (relevant on cold cache revalidation
 * under load — see issue #7, concern #2).
 */
export class RentacarDataTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`rentacar-data upstream timeout after ${timeoutMs}ms`)
    this.name = 'RentacarDataTimeoutError'
  }
}

/**
 * Runs the 6 rentacar-data Supabase queries in parallel with a hard deadline.
 * A shared AbortController cancels the underlying fetches on timeout so they
 * stop consuming the connection pool — Promise.race alone would leave them
 * running. Returns the raw PostgREST results in fixed order; per-result
 * `.error` interpretation stays in the caller (no behavior change there).
 */
export async function fetchRentacarData(supabase: SupabaseClient, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const signal = controller.signal
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const results = await Promise.all([
      supabase
        .from('vehicle_categories')
        .select('*, category_models(*), category_pricing(*), category_city_visibility(cities(slug))')
        .eq('status', 'active')
        .order('code')
        .abortSignal(signal),

      supabase
        .from('locations')
        .select('id, code, name, city, slug, schedule, status, cities(slug)')
        .eq('status', 'active')
        .order('name')
        .abortSignal(signal),

      supabase
        .from('rental_companies')
        .select('extra_driver_day_price, baby_seat_day_price, wash_price, wash_onsite_price, wash_deep_price, wash_deep_upholstery_price')
        .eq('code', 'localiza')
        .abortSignal(signal)
        .single(),

      supabase
        .from('cities')
        .select('slug, name, description, testimonials')
        .eq('status', 'active')
        .order('name')
        .abortSignal(signal),

      supabase
        .from('franchises')
        .select('code, testimonials')
        .eq('status', 'active')
        .order('code')
        .abortSignal(signal),

      supabase
        .from('faqs')
        .select('label, content')
        .eq('status', 'active')
        .order('display_order')
        .abortSignal(signal),
    ])

    if (signal.aborted) throw new RentacarDataTimeoutError(timeoutMs)
    return results
  } catch (err) {
    if (signal.aborted) throw new RentacarDataTimeoutError(timeoutMs)
    throw err
  } finally {
    clearTimeout(timer)
  }
}
