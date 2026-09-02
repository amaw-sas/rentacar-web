import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchRentacarData, RentacarDataTimeoutError } from '../rentacarDataFetch'

/** The six queries every request makes, in tuple order. */
const TABLES = ['vehicle_categories', 'locations', 'rental_companies', 'cities', 'franchises', 'faqs'] as const

/**
 * The 7th slot: only travelled when the monthly anchor pilot is on for a known
 * brand. Kept out of TABLES so the shared-abort assertions keep meaning "the
 * always-on queries", which is what the deadline contract is about.
 */
const ANCHOR_TABLE = 'price_anchors' as const

/**
 * The 8th slot: the home "desde" claim (migration 142). Out of TABLES for the
 * same reason as ANCHOR_TABLE — it is accessory, not always-on.
 */
const FLOOR_TABLE = 'price_floors' as const

function abortError() {
  return Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
}

/**
 * Fake supabase query builder. Chainable, thenable, records the AbortSignal.
 * - resolveWith set  -> resolves immediately with that PostgREST-shaped result
 * - resolveWith unset -> stalls until its AbortSignal aborts, then rejects
 *   (mirrors real supabase-js: an aborted fetch rejects with AbortError)
 */
function makeQuery(resolveWith?: { data: unknown; error: unknown }) {
  const state: { signal?: AbortSignal; eqCalls: unknown[][] } = { eqCalls: [] }
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'order', 'single']) q[m] = () => q
  q.eq = (...args: unknown[]) => {
    state.eqCalls.push(args)
    return q
  }
  q.abortSignal = (s: AbortSignal) => {
    state.signal = s
    return q
  }
  q.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
    if (resolveWith) return Promise.resolve(resolveWith).then(resolve, reject)
    return new Promise((_, rej) => {
      const sig = state.signal
      if (!sig) return
      if (sig.aborted) return rej(abortError())
      sig.addEventListener('abort', () => rej(abortError()))
    }).then(resolve, reject)
  }
  ;(q as { __state: typeof state }).__state = state
  return q
}

type AnyTable = (typeof TABLES)[number] | typeof ANCHOR_TABLE | typeof FLOOR_TABLE

function makeSupabase(perTable: Partial<Record<AnyTable, { data: unknown; error: unknown }>>) {
  const builders = Object.fromEntries(
    [...TABLES, ANCHOR_TABLE, FLOOR_TABLE].map((t) => [t, makeQuery(perTable[t] ?? (t in perTable ? perTable[t] : undefined))]),
  ) as Record<AnyTable, ReturnType<typeof makeQuery>>
  return {
    supabase: { from: (table: string) => builders[table as AnyTable] } as never,
    builders,
  }
}

const OK = { data: [], error: null }

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchRentacarData', () => {
  it('SCEN-1: resolves the 8-result tuple and clears the timeout timer (happy path)', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({
      vehicle_categories: OK,
      locations: OK,
      rental_companies: OK,
      cities: OK,
      franchises: OK,
      faqs: OK,
    })

    const results = await fetchRentacarData(supabase, 8000)

    // The 7th and 8th slots always exist so the tuple shape never depends on a
    // flag; with both pilots off they are stubs, not queries (SCEN-M1/SCEN-F1).
    expect(results).toHaveLength(8)
    expect(results[6]).toEqual({ data: null, error: null })
    expect(results[7]).toEqual({ data: null, error: null })
    expect(builders.price_anchors.__state.signal).toBeUndefined()
    expect(builders.price_floors.__state.signal).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0) // timer cleared, no dangling handle
  })

  it('SCEN-2: aborts all 6 queries and throws RentacarDataTimeoutError when the deadline passes', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({}) // all stall until abort

    const promise = fetchRentacarData(supabase, 8000)
    const assertion = expect(promise).rejects.toBeInstanceOf(RentacarDataTimeoutError)

    await vi.advanceTimersByTimeAsync(8000)
    await assertion

    const signals = TABLES.map((t) => builders[t].__state.signal)
    expect(signals.every((s) => s !== undefined)).toBe(true)
    expect(new Set(signals).size).toBe(1) // one shared controller signal across all 6
    expect(signals[0]!.aborted).toBe(true)
  })

  it('SCEN-3: passes an upstream { error } result through unchanged (no throw, 500 path preserved)', async () => {
    vi.useFakeTimers()
    const dbError = { data: null, error: { message: 'Categories query failed' } }
    const { supabase } = makeSupabase({
      vehicle_categories: dbError,
      locations: OK,
      rental_companies: OK,
      cities: OK,
      franchises: OK,
      faqs: OK,
    })

    const results = await fetchRentacarData(supabase, 8000)

    expect(results[0]).toEqual(dbError)
    expect(vi.getTimerCount()).toBe(0)
  })

  // Issue #322 PR10 (SCEN-322-K03): each deploy serves one brand — the
  // franchises query must be scoped to it so the payload stops shipping the
  // other brands' testimonials.
  it('scopes the franchises query to the deploy brand when franchiseCode is provided', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({
      vehicle_categories: OK, locations: OK, rental_companies: OK, cities: OK, franchises: OK, faqs: OK,
    })

    await fetchRentacarData(supabase, 8000, 'alquilame')

    expect(builders.franchises.__state.eqCalls).toContainEqual(['code', 'alquilame'])
    // Other queries keep only their status filter.
    expect(builders.cities.__state.eqCalls).toEqual([['status', 'active']])
  })

  it('keeps the franchises query unfiltered when franchiseCode is absent (standalone logic layer)', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({
      vehicle_categories: OK, locations: OK, rental_companies: OK, cities: OK, franchises: OK, faqs: OK,
    })

    await fetchRentacarData(supabase, 8000)

    expect(builders.franchises.__state.eqCalls).toEqual([['status', 'active']])
  })

  // Monthly struck-price anchor pilot.
  const SIX_OK = {
    vehicle_categories: OK, locations: OK, rental_companies: OK, cities: OK, franchises: OK, faqs: OK,
  } as const

  it('SCEN-M2: reads price_anchors scoped to the brand when the pilot is on', async () => {
    vi.useFakeTimers()
    const anchors = { data: [{ category_code: 'GC', anchor_day_price_gross: 280607, computed_at: '2026-07-26T00:00:00Z' }], error: null }
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: anchors })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', true)

    expect(results[6]).toEqual(anchors)
    expect(builders.price_anchors.__state.eqCalls).toEqual([['franchise', 'alquilame']])
    // Its OWN controller, NOT the catalog's (H-W1): sharing it meant a slow
    // anchors query aborted six answered queries and 504'd the whole catalog.
    // Deadline behaviour is pinned in rentacarDataFetch.anchorsDeadline.adversarial.
    expect(builders.price_anchors.__state.signal).not.toBe(builders.cities.__state.signal)
  })

  it('SCEN-M2: a catalog deadline SHORTER than the anchors one still tears the anchors query down', async () => {
    vi.useFakeTimers()
    // With a 1s catalog deadline the outer signal fires before the anchors'
    // own 2s one. The chaining is what stops the in-flight accessory query from
    // outliving the request and holding a pooled connection.
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: undefined })

    const promise = fetchRentacarData(supabase, 1000, 'alquilame', true)
    const assertion = expect(promise).rejects.toBeInstanceOf(RentacarDataTimeoutError)
    await vi.advanceTimersByTimeAsync(1000)
    await assertion

    expect(builders.price_anchors.__state.signal!.aborted).toBe(true)
  })

  it('SCEN-M1: makes no anchors round trip when the pilot is off (default)', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: OK })

    const off = await fetchRentacarData(supabase, 8000, 'alquilame', false)
    const omitted = await fetchRentacarData(supabase, 8000, 'alquilame')

    expect(off[6]).toEqual({ data: null, error: null })
    expect(omitted[6]).toEqual({ data: null, error: null })
    expect(builders.price_anchors.__state.eqCalls).toEqual([])
    expect(builders.price_anchors.__state.signal).toBeUndefined()
  })

  it('SCEN-M4: makes no anchors round trip without a brand — anchors are per franchise', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: OK })

    const results = await fetchRentacarData(supabase, 8000, undefined, true)

    expect(results[6]).toEqual({ data: null, error: null })
    expect(builders.price_anchors.__state.eqCalls).toEqual([])
  })

  it('SCEN-M4: passes an anchors { error } through instead of throwing (the handler fails open)', async () => {
    vi.useFakeTimers()
    const anchorsError = { data: null, error: { message: 'relation "price_anchors" does not exist' } }
    const { supabase } = makeSupabase({ ...SIX_OK, price_anchors: anchorsError })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', true)

    expect(results[6]).toEqual(anchorsError)
    expect(results[0]).toEqual(OK)
  })

  // Home "desde" claim (price_floors, migration 142). Same contract as the
  // anchors above; asserted separately because the two flags are independent —
  // a brand may publish the floor without running the monthly strike pilot.
  const FLOORS = {
    data: [{ category_code: 'C', floor_day_price_gross: 157696, computed_at: '2026-08-28T04:28:59Z' }],
    error: null,
  }

  it('SCEN-F2: reads price_floors scoped to the brand when the claim is on', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_floors: FLOORS })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', false, true)

    expect(results[7]).toEqual(FLOORS)
    expect(builders.price_floors.__state.eqCalls).toEqual([['franchise', 'alquilame']])
    // Its OWN controller, like the anchors': an accessory table must never be
    // able to abort the answered core queries and 504 the catalog.
    expect(builders.price_floors.__state.signal).not.toBe(builders.cities.__state.signal)
  })

  it('SCEN-F2: the two accessory flags are independent', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: OK, price_floors: FLOORS })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', false, true)

    expect(results[7]).toEqual(FLOORS)
    // Floors on must not drag the anchors pilot on with it.
    expect(results[6]).toEqual({ data: null, error: null })
    expect(builders.price_anchors.__state.eqCalls).toEqual([])
  })

  it('SCEN-F1: makes no floors round trip when the claim is off (default)', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_floors: FLOORS })

    const off = await fetchRentacarData(supabase, 8000, 'alquilame', false, false)
    const omitted = await fetchRentacarData(supabase, 8000, 'alquilame')

    expect(off[7]).toEqual({ data: null, error: null })
    expect(omitted[7]).toEqual({ data: null, error: null })
    expect(builders.price_floors.__state.eqCalls).toEqual([])
    expect(builders.price_floors.__state.signal).toBeUndefined()
  })

  it('SCEN-F1: makes no floors round trip without a brand — floors are per franchise', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_floors: FLOORS })

    const results = await fetchRentacarData(supabase, 8000, undefined, false, true)

    expect(results[7]).toEqual({ data: null, error: null })
    expect(builders.price_floors.__state.eqCalls).toEqual([])
  })

  it('SCEN-F5: passes a floors { error } through instead of throwing (the handler fails open)', async () => {
    vi.useFakeTimers()
    const floorsError = { data: null, error: { message: 'relation "price_floors" does not exist' } }
    const { supabase } = makeSupabase({ ...SIX_OK, price_floors: floorsError })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', false, true)

    expect(results[7]).toEqual(floorsError)
    expect(results[0]).toEqual(OK)
  })

  it('SCEN-F5: a catalog deadline SHORTER than the floors one still tears the floors query down', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_floors: undefined })

    const promise = fetchRentacarData(supabase, 1000, 'alquilame', false, true)
    const assertion = expect(promise).rejects.toBeInstanceOf(RentacarDataTimeoutError)
    await vi.advanceTimersByTimeAsync(1000)
    await assertion

    expect(builders.price_floors.__state.signal!.aborted).toBe(true)
  })
})
