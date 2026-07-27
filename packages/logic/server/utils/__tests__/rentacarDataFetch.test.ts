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

type AnyTable = (typeof TABLES)[number] | typeof ANCHOR_TABLE

function makeSupabase(perTable: Partial<Record<AnyTable, { data: unknown; error: unknown }>>) {
  const builders = Object.fromEntries(
    [...TABLES, ANCHOR_TABLE].map((t) => [t, makeQuery(perTable[t] ?? (t in perTable ? perTable[t] : undefined))]),
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
  it('SCEN-1: resolves the 7-result tuple and clears the timeout timer (happy path)', async () => {
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

    // The 7th slot always exists so the tuple shape never depends on a flag;
    // with the pilot off it is the stub, not a query (see the SCEN-M1 case).
    expect(results).toHaveLength(7)
    expect(results[6]).toEqual({ data: null, error: null })
    expect(builders.price_anchors.__state.signal).toBeUndefined()
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

  it('SCEN-M2: reads price_anchors scoped to the brand, on the shared deadline, when the pilot is on', async () => {
    vi.useFakeTimers()
    const anchors = { data: [{ category_code: 'GC', anchor_day_price_gross: 280607, computed_at: '2026-07-26T00:00:00Z' }], error: null }
    const { supabase, builders } = makeSupabase({ ...SIX_OK, price_anchors: anchors })

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', true)

    expect(results[6]).toEqual(anchors)
    expect(builders.price_anchors.__state.eqCalls).toEqual([['franchise', 'alquilame']])
    // Same AbortController as the rest: the accessory query cannot outlive the
    // deadline and keep a pooled connection busy.
    expect(builders.price_anchors.__state.signal).toBe(builders.cities.__state.signal)
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
})
