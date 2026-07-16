import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchRentacarData, RentacarDataTimeoutError } from '../rentacarDataFetch'

const TABLES = ['vehicle_categories', 'locations', 'rental_companies', 'cities', 'franchises', 'faqs'] as const

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

function makeSupabase(perTable: Partial<Record<(typeof TABLES)[number], { data: unknown; error: unknown }>>) {
  const builders = Object.fromEntries(
    TABLES.map((t) => [t, makeQuery(perTable[t] ?? (t in perTable ? perTable[t] : undefined))]),
  ) as Record<(typeof TABLES)[number], ReturnType<typeof makeQuery>>
  return {
    supabase: { from: (table: string) => builders[table as (typeof TABLES)[number]] } as never,
    builders,
  }
}

const OK = { data: [], error: null }

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchRentacarData', () => {
  it('SCEN-1: resolves the 6-result tuple and clears the timeout timer (happy path)', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase({
      vehicle_categories: OK,
      locations: OK,
      rental_companies: OK,
      cities: OK,
      franchises: OK,
      faqs: OK,
    })

    const results = await fetchRentacarData(supabase, 8000)

    expect(results).toHaveLength(6)
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
})
