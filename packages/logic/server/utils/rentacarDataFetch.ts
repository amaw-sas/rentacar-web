import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY_MS = 300

interface FetchOptions {
  /** Per-attempt deadline for the parallel batch. */
  timeoutMs?: number
  /** Extra attempts after the first (total attempts = retries + 1). */
  retries?: number
  /** Base backoff; attempt N waits `retryDelayMs * 2 ** N` ms. */
  retryDelayMs?: number
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
 * Classifies a PostgREST result as worth retrying after a transient failure.
 *
 * In @supabase/postgrest-js (with `.throwOnError()` off, as here) a network /
 * DNS / connection failure does NOT throw — it resolves to a result with
 * `error.code: ''` and `status: 0`. The HTTP status lives on the result
 * wrapper, never on `error` (PostgrestError has no `status` field).
 *
 * - Retryable: network (`code: ''`, `status: 0`), 5xx, PG connection codes
 *   (e.g. 57P03/53300), and anything unrecognized — a cold-start blip we want
 *   to recover from. If it's actually persistent, the bounded retry exhausts
 *   and the caller still fails loud.
 * - NOT retryable: PostgREST data/schema/auth errors (`PGRST*`, incl. the
 *   missing-row PGRST116 handled upstream by #16) and HTTP 4xx — retrying
 *   cannot change the outcome.
 */
export function isRetryableResult(result: { error: unknown; status?: number }): boolean {
  if (!result?.error) return false
  const code = (result.error as { code?: unknown }).code
  if (typeof code === 'string' && code.startsWith('PGRST')) return false
  if (typeof result.status === 'number' && result.status >= 400 && result.status < 500) return false
  return true
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function logRetry(attempt: number, retries: number, error: unknown): void {
  console.warn(
    `[rentacar-data] transient fetch failure (attempt ${attempt + 1}/${retries + 1}), retrying:`,
    error,
  )
}

/**
 * Runs the 6 rentacar-data Supabase queries in parallel with a hard deadline.
 * A shared AbortController cancels the underlying fetches on timeout so they
 * stop consuming the connection pool — Promise.race alone would leave them
 * running. Returns the raw PostgREST results in fixed order; per-result
 * `.error` interpretation stays in the caller (no behavior change there).
 */
async function runBatch(supabase: SupabaseClient, timeoutMs: number) {
  const controller = new AbortController()
  const signal = controller.signal
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const results = await Promise.all([
      supabase
        .from('vehicle_categories')
        .select('*, category_models(*), category_pricing(*)')
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

/**
 * Fetches rentacar-data with bounded retry on transient failures.
 *
 * A cold first call during build-time prerender can fail transiently (network
 * warmup, a brief 5xx); the rentacar-data plugin is fail-loud, so one such blip
 * on the `/` route aborts the whole deploy (#7, #16). This retries with
 * exponential backoff ONLY when every errored query is transient (see
 * `isRetryableResult`). Two failures are deliberately NOT retried:
 *   - a timeout (`RentacarDataTimeoutError`) — a slow upstream won't recover
 *     within the deadline, and retrying would multiply the tail latency
 *     (eroding the 8s bound from #7); the cold-start blip we recover from
 *     surfaces as a fast `.error`, not a timeout;
 *   - a batch containing any permanent error (PGRST code or HTTP 4xx) — retry
 *     can't fix it, so retrying only delays the loud failure.
 * Both still surface (a thrown timeout → 504, an `.error` result → 500), so the
 * build fails loud — just without the wasted attempts. Backward-compatible with
 * `fetchRentacarData(supabase)`.
 */
export async function fetchRentacarData(
  supabase: SupabaseClient,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  }: FetchOptions = {},
) {
  const lastAttempt = Math.max(0, retries) // clamp: retries < 0 still runs once
  for (let attempt = 0; attempt <= lastAttempt; attempt++) {
    // runBatch throws RentacarDataTimeoutError on timeout — it propagates here
    // unretried (see docstring), surfacing as a 504 in the handler.
    const results = await runBatch(supabase, timeoutMs)
    const errored = results.filter((r) => r.error)
    // Retry only when something errored AND every errored query is transient.
    const shouldRetry = errored.length > 0 && errored.every(isRetryableResult)
    if (!shouldRetry || attempt === lastAttempt) return results
    logRetry(attempt, lastAttempt, errored[0].error)
    await sleep(retryDelayMs * 2 ** attempt)
  }
  // Unreachable: the final iteration (attempt === lastAttempt) always returns.
  throw new Error('fetchRentacarData: retry loop exited without returning')
}
