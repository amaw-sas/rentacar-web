import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_TIMEOUT_MS = 8000

/**
 * The accessory `price_anchors` read gets its own, much shorter deadline —
 * mirrors PRICE_ANCHOR_FETCH_TIMEOUT_MS in the dashboard (lib/api/price-anchor).
 *
 * It cannot share the 8s catalog deadline: a merely SLOW anchors query would
 * abort the six core queries that already had their answer and turn the whole
 * catalog into a 504, which is exactly what the accessory table is never
 * allowed to do (R-WEB-M H-W1). Keep it well under the catalog deadline so this
 * one always fires first and the fallback is what the tuple carries.
 */
export const MONTHLY_ANCHORS_TIMEOUT_MS = 2000

/** What the 7th slot carries when there is no anchors answer to carry. */
const MONTHLY_ANCHORS_STUB = { data: null, error: null }

/**
 * Same reasoning as MONTHLY_ANCHORS_TIMEOUT_MS for the `price_floors` read
 * (migration 142) that feeds the home "desde" claim. Same budget on purpose:
 * both are single-digit-row reads on a primary key, and giving the floor a
 * longer rope would only let it be the one accessory table that stalls a page.
 */
export const PRICE_FLOORS_TIMEOUT_MS = 2000

/** What the 8th slot carries when there is no floors answer to carry. */
const PRICE_FLOORS_STUB = { data: null, error: null }

/**
 * Reads the monthly anchors under their own deadline, degrading to the stub on
 * timeout, abort or transport failure. Never rejects: the catalog's Promise.all
 * must not be able to fail because of this table.
 *
 * Its AbortController is its own (so the 2s deadline actually cancels the query
 * and frees the pooled connection) but is also chained to the catalog signal,
 * so an outer abort still tears this one down instead of leaking it.
 */
async function fetchMonthlyAnchors(
  supabase: SupabaseClient,
  franchiseCode: string,
  outerSignal: AbortSignal,
) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  outerSignal.addEventListener('abort', abort)
  const timer = setTimeout(abort, MONTHLY_ANCHORS_TIMEOUT_MS)

  try {
    return await supabase
      .from('price_anchors')
      .select('category_code, anchor_day_price_gross, computed_at')
      .eq('franchise', franchiseCode)
      .abortSignal(controller.signal)
  } catch {
    // Reached by the anchors budget, an outer abort or a transport failure —
    // the message names none of them because it cannot tell them apart here.
    // Worth logging at all because degrading in silence would let a chronically
    // slow anchors table make the pilot measure as if it were switched off. The
    // catalog is fine either way; this line is for us, not for the customer.
    console.warn(
      '[rentacar-data] monthly price anchors did not answer in time; serving catalog without the monthly cap',
    )
    return MONTHLY_ANCHORS_STUB
  } finally {
    clearTimeout(timer)
    outerSignal.removeEventListener('abort', abort)
  }
}

/**
 * Reads the publishable price floors under their own deadline. Identical
 * degradation contract to fetchMonthlyAnchors — never rejects, own controller
 * chained to the catalog signal — because the failure it guards against is the
 * same one: an accessory table must never be able to 504 the booking flow.
 *
 * The stakes differ on the other side though. Losing the anchors drops a
 * strike-through; losing the floors drops the numeric claim out of the home
 * title entirely, which is the deliberate fail-closed behaviour — publishing a
 * stale floor is the exact defect this pipeline exists to end.
 */
async function fetchPriceFloors(
  supabase: SupabaseClient,
  franchiseCode: string,
  outerSignal: AbortSignal,
) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  outerSignal.addEventListener('abort', abort)
  const timer = setTimeout(abort, PRICE_FLOORS_TIMEOUT_MS)

  try {
    return await supabase
      .from('price_floors')
      .select('category_code, floor_day_price_gross, computed_at')
      .eq('franchise', franchiseCode)
      .abortSignal(controller.signal)
  } catch {
    console.warn(
      '[rentacar-data] price floors did not answer in time; serving catalog without the home price claim',
    )
    return PRICE_FLOORS_STUB
  } finally {
    clearTimeout(timer)
    outerSignal.removeEventListener('abort', abort)
  }
}

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
 * Runs the rentacar-data Supabase queries in parallel with a hard deadline.
 * A shared AbortController cancels the underlying fetches on timeout so they
 * stop consuming the connection pool — Promise.race alone would leave them
 * running. Returns the raw PostgREST results in fixed order; per-result
 * `.error` interpretation stays in the caller (no behavior change there).
 *
 * `franchiseCode` (issue #322 PR10): each deploy serves exactly one brand, so
 * the franchises query is scoped to it — shipping all 3 brands' testimonials
 * on every page was pure cross-brand payload bloat. Omitted/empty = no filter
 * (standalone logic-layer runs without brand runtimeConfig).
 *
 * `includeMonthlyAnchors`: the monthly struck-price pilot. The 7th slot always
 * exists so the tuple shape never depends on a flag, but it costs a round trip
 * only when the pilot is on AND the deploy knows its brand — anchors are stored
 * per franchise, and an unscoped read would mix another brand's market into
 * this one's prices. That slot runs on its OWN short deadline and can only ever
 * resolve, so neither an error nor a stall in the accessory table can take the
 * catalog down — see fetchMonthlyAnchors.
 *
 * `includePriceFloors`: the home "desde" claim (migration 142). Same contract,
 * same reasons, 8th slot. Kept a separate flag rather than folded into the
 * anchors one because the two answer different questions — a p95 ceiling for a
 * strike-through and a p05 floor for a public claim — and a brand may well want
 * one without the other.
 */
export async function fetchRentacarData(
  supabase: SupabaseClient,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  franchiseCode?: string,
  includeMonthlyAnchors: boolean = false,
  includePriceFloors: boolean = false,
) {
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
        .select('id, code, name, city, slug, schedule, status, cities(slug, bookable)')
        .eq('status', 'active')
        .order('name')
        .abortSignal(signal),

      supabase
        .from('rental_companies')
        .select('extra_driver_day_price, baby_seat_day_price, extra_driver_month_price, baby_seat_month_price, wash_price, wash_onsite_price, wash_deep_price, wash_deep_upholstery_price')
        .eq('code', 'localiza')
        .abortSignal(signal)
        .single(),

      supabase
        .from('cities')
        .select('slug, name, description, testimonials, bookable')
        .eq('status', 'active')
        .order('name')
        .abortSignal(signal),

      (() => {
        let query = supabase
          .from('franchises')
          .select('code, testimonials')
          .eq('status', 'active')
        if (franchiseCode) query = query.eq('code', franchiseCode)
        return query.order('code').abortSignal(signal)
      })(),

      supabase
        .from('faqs')
        .select('label, content')
        .eq('status', 'active')
        .order('display_order')
        .abortSignal(signal),

      includeMonthlyAnchors && franchiseCode
        ? fetchMonthlyAnchors(supabase, franchiseCode, signal)
        : Promise.resolve(MONTHLY_ANCHORS_STUB),

      includePriceFloors && franchiseCode
        ? fetchPriceFloors(supabase, franchiseCode, signal)
        : Promise.resolve(PRICE_FLOORS_STUB),
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
