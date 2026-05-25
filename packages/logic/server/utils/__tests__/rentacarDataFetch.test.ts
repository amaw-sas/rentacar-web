import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchRentacarData, RentacarDataTimeoutError, isRetryableResult } from '../rentacarDataFetch'

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
  const state: { signal?: AbortSignal } = {}
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'single']) q[m] = () => q
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

type Result = { data: unknown; error: unknown; status?: number }

/**
 * Supabase mock that returns a different per-table result on each batch run,
 * so retry behavior can be exercised. A "batch run" is counted when the first
 * table (`vehicle_categories`) is requested — all 6 `from()` calls of one batch
 * happen synchronously before any await. `perAttempt(n)` (1-indexed) returns
 * per-table overrides; tables not overridden default to OK. `'stall'` makes a
 * query hang until its AbortSignal fires (mirrors a timeout).
 */
function makeRetrySupabase(
  perAttempt: (attempt: number) => Partial<Record<(typeof TABLES)[number], Result | 'stall'>>,
) {
  let runs = 0
  const supabase = {
    from: (table: string) => {
      if (table === 'vehicle_categories') runs++
      const spec = perAttempt(runs)[table as (typeof TABLES)[number]]
      return makeQuery(spec === 'stall' ? undefined : (spec ?? OK))
    },
  } as never
  return { supabase, runs: () => runs }
}

const NET_ERR: Result = { data: null, error: { code: '' }, status: 0 } // network blip (postgrest-js shape)

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

    const results = await fetchRentacarData(supabase, { timeoutMs: 8000, retries: 0 })

    expect(results).toHaveLength(6)
    expect(vi.getTimerCount()).toBe(0) // timer cleared, no dangling handle
  })

  it('SCEN-2: aborts all 6 queries and throws RentacarDataTimeoutError when the deadline passes', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase({}) // all stall until abort

    const promise = fetchRentacarData(supabase, { timeoutMs: 8000, retries: 0 })
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

    const results = await fetchRentacarData(supabase, { timeoutMs: 8000, retries: 0 })

    expect(results[0]).toEqual(dbError)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('isRetryableResult (SCEN-R5)', () => {
  it.each([
    // NON-retryable: data/schema/auth errors (PGRST*) and HTTP 4xx — retrying won't help.
    [{ error: null }, false],
    [{ error: { code: 'PGRST116' }, status: 406 }, false],
    [{ error: { code: 'PGRST301' }, status: 401 }, false],
    [{ error: { message: 'forbidden' }, status: 401 }, false],
    [{ error: { message: 'not found' }, status: 404 }, false],
    // RETRYABLE: network (code:'' / status:0), 5xx, PG connection codes, and unknown.
    [{ error: { code: '' }, status: 0 }, true],
    [{ error: { message: 'unavailable' }, status: 503 }, true],
    [{ error: { code: '57P03' }, status: 503 }, true],
    [{ error: { message: 'x' } }, true],
  ])('classifies %o as retryable=%s', (result, expected) => {
    expect(isRetryableResult(result as { error: unknown; status?: number })).toBe(expected)
  })
})

describe('fetchRentacarData retry (SCEN-R1..R4)', () => {
  it('SCEN-R1: transient .error on attempt 1, success on attempt 2 → returns ok, 2 batch runs', async () => {
    const { supabase, runs } = makeRetrySupabase((attempt) =>
      attempt === 1 ? { vehicle_categories: NET_ERR } : {},
    )

    const results = await fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })

    expect(runs()).toBe(2)
    expect(results.every((r) => r.error === null)).toBe(true)
  })

  it('SCEN-R2: transient .error on every attempt → no throw, returns .error after 3 runs', async () => {
    const { supabase, runs } = makeRetrySupabase(() => ({ vehicle_categories: NET_ERR }))

    const results = await fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })

    expect(runs()).toBe(3) // retries + 1
    expect(results.some((r) => r.error)).toBe(true) // handler will map this to 500 (fail-loud preserved)
  })

  it('SCEN-R3: PGRST116 (missing row) is not retried → 1 batch run', async () => {
    const pgrst116: Result = { data: null, error: { code: 'PGRST116' }, status: 406 }
    const { supabase, runs } = makeRetrySupabase(() => ({ rental_companies: pgrst116 }))

    const results = await fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })

    expect(runs()).toBe(1)
    expect(results[2].error).toEqual({ code: 'PGRST116' })
  })

  it('SCEN-R4: a timeout throws RentacarDataTimeoutError immediately (not retried)', async () => {
    // A timeout is NOT retried: it propagates on the first attempt → 504. Real
    // timers + tiny timeout; the stalled queries reject on abort.
    const { supabase, runs } = makeRetrySupabase(() =>
      Object.fromEntries(TABLES.map((t) => [t, 'stall' as const])),
    )

    await expect(
      fetchRentacarData(supabase, { timeoutMs: 5, retries: 2, retryDelayMs: 0 }),
    ).rejects.toBeInstanceOf(RentacarDataTimeoutError)

    expect(runs()).toBe(1) // timeouts are not retried
  })

  it('SCEN-R7: a permanent error mixed with a transient one is not retried → 1 run', async () => {
    // PGRST205 (schema cache miss, permanent) on one table + a network blip on
    // another. Retry cannot fix the permanent error, so bail immediately and
    // let the handler surface it (fail-loud, just not delayed).
    const permanent: Result = { data: null, error: { code: 'PGRST205' }, status: 404 }
    const { supabase, runs } = makeRetrySupabase(() => ({
      vehicle_categories: permanent,
      cities: NET_ERR,
    }))

    const results = await fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })

    expect(runs()).toBe(1)
    expect(results.some((r) => r.error)).toBe(true)
  })
})
