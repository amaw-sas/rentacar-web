import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { fetchRentacarData, MONTHLY_ANCHORS_TIMEOUT_MS, RentacarDataTimeoutError } from '../rentacarDataFetch'

/**
 * R-WEB-M H-W1, FLIPPED from characterisation to desired behaviour.
 *
 * The reviewer left this file proving the hole: hard rule 5 of the mission says
 * a failure of the accessory `price_anchors` query must never take the catalog
 * down, and that held for a query that ERRORED but not for one that was merely
 * SLOW — the 7th slot shared the single 8s deadline of the Promise.all, so a
 * stalled anchors query aborted the six queries that already had their answer
 * and the handler turned it into a 504 for the whole catalog.
 *
 * The assertions below are now the fix's contract, not the bug's: the anchors
 * read runs on its own short deadline and degrades to the stub, so the catalog
 * comes back whole. Reachable only with the pilot on (alquilame), which is why
 * the reviewer graded it non-blocking — but "only one brand's catalog" is still
 * a catalog.
 */

function abortError() {
  return Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
}

function makeQuery(resolveWith?: { data: unknown; error: unknown }) {
  const state: { signal?: AbortSignal } = {}
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'order', 'single', 'eq']) q[m] = () => q
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

const OK = { data: [], error: null }
const CORE = ['vehicle_categories', 'locations', 'rental_companies', 'cities', 'franchises', 'faqs'] as const

/** Six healthy core queries; the anchors query stalls unless given an answer. */
function makeSupabase(anchors?: { data: unknown; error: unknown }) {
  const builders: Record<string, ReturnType<typeof makeQuery>> = {}
  for (const t of CORE) builders[t] = makeQuery(OK)
  builders.price_anchors = makeQuery(anchors)
  return { supabase: { from: (t: string) => builders[t] } as never, builders }
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
  vi.useRealTimers()
})

describe('a SLOW price_anchors query must NOT take the catalog down (H-W1)', () => {
  it('six healthy queries + one stalled anchors query = full catalog, anchors stubbed', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase()

    const promise = fetchRentacarData(supabase, 8000, 'alquilame', true)
    await vi.advanceTimersByTimeAsync(MONTHLY_ANCHORS_TIMEOUT_MS)
    const results = await promise

    expect(results).toHaveLength(7)
    expect(results[0]).toEqual(OK) // the catalog survived intact
    expect(results[5]).toEqual(OK)
    expect(results[6]).toEqual({ data: null, error: null })
  })

  it('resolves at the anchors deadline, long before the catalog deadline', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase()

    const promise = fetchRentacarData(supabase, 8000, 'alquilame', true)
    let settled = false
    void promise.then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(MONTHLY_ANCHORS_TIMEOUT_MS - 1)
    expect(settled).toBe(false) // still waiting on the anchors
    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true) // and never reaches the 8s catalog deadline

    await promise
    expect(MONTHLY_ANCHORS_TIMEOUT_MS).toBeLessThan(8000)
  })

  it('aborts the stalled anchors query so it stops holding a pooled connection', async () => {
    vi.useFakeTimers()
    const { supabase, builders } = makeSupabase()

    const promise = fetchRentacarData(supabase, 8000, 'alquilame', true)
    await vi.advanceTimersByTimeAsync(MONTHLY_ANCHORS_TIMEOUT_MS)
    await promise

    expect(builders.price_anchors.__state.signal!.aborted).toBe(true)
  })

  it('says so in the logs — a chronically slow table must not measure as a switched-off pilot', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase()

    const promise = fetchRentacarData(supabase, 8000, 'alquilame', true)
    await vi.advanceTimersByTimeAsync(MONTHLY_ANCHORS_TIMEOUT_MS)
    await promise

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('did not answer')
  })

  it('leaves no dangling timer behind', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase()

    const promise = fetchRentacarData(supabase, 8000, 'alquilame', true)
    await vi.advanceTimersByTimeAsync(MONTHLY_ANCHORS_TIMEOUT_MS)
    await promise

    expect(vi.getTimerCount()).toBe(0)
  })

  it('a FAST anchors query still returns its rows — the deadline only bites on stalls', async () => {
    vi.useFakeTimers()
    const rows = { data: [{ category_code: 'GC', anchor_day_price_gross: 280607, computed_at: '2026-07-27T00:00:00Z' }], error: null }
    const { supabase } = makeSupabase(rows)

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', true)

    expect(results[6]).toEqual(rows)
    expect(warn).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('control: the same six queries WITHOUT the pilot resolve fine', async () => {
    vi.useFakeTimers()
    const { supabase } = makeSupabase()

    const results = await fetchRentacarData(supabase, 8000, 'alquilame', false)

    expect(results).toHaveLength(7)
    expect(results[6]).toEqual({ data: null, error: null })
  })

  it('regression: a stalled CORE query still times out the catalog (the guard stays loud)', async () => {
    // The fix must not have made the catalog deadline unreachable — only the
    // accessory table is exempt from it.
    vi.useFakeTimers()
    const stalledCore = { from: (t: string) => (t === 'cities' ? makeQuery(undefined) : makeQuery(OK)) } as never

    const promise = fetchRentacarData(stalledCore, 8000, 'alquilame', true)
    const assertion = expect(promise).rejects.toBeInstanceOf(RentacarDataTimeoutError)
    await vi.advanceTimersByTimeAsync(8000)
    await assertion
  })
})
