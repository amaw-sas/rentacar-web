import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Issue #16 Finding 1 — graceful fallback for a missing `localiza` row.
//
// SCEN-16-1: companyResult error (PGRST116, row absent) → handler returns
//   200 with extras: undefined, other sections populated, transformExtras
//   NOT called, no throw.
// SCEN-16-2 (regression guard): categoriesResult error → still throws 500;
//   booking-breaking failures stay loud. extras never evaluated.
// SCEN-16-3 (happy-path regression): companyResult ok → transformExtras
//   runs once on the row; extras is its output (NOT undefined). Guards that
//   a present row with NULL columns is never confused with an absent row.
//
// Holdout: docs/specs/2026-05-23-issue-16-localiza-fallback/scenarios/
//          localiza-missing-fallback.scenarios.md

vi.mock('../../utils/supabase', () => ({
  useSupabaseClient: () => ({ __dummy: true }),
}))

vi.mock('../../utils/rentacarDataFetch', () => ({
  fetchRentacarData: vi.fn(),
  RentacarDataTimeoutError: class RentacarDataTimeoutError extends Error {},
}))

// Transformers stubbed with identifiable sentinels — the handler contract
// under test is the per-result branching/assembly, not transformer internals
// (those are covered by transformers.test.ts / SCEN-007). transformExtras is
// a spy so we can assert called/not-called.
vi.mock('../../utils/transformers', () => ({
  transformCategories: vi.fn(() => ['CAT']),
  transformBranches: vi.fn(() => ['BRANCH']),
  transformExtras: vi.fn(() => ({ extraDriverDayPrice: 999 })),
  transformVehicleCategories: vi.fn(() => ({ B: {} })),
  transformCities: vi.fn(() => ['CITY']),
  transformFranchiseTestimonials: vi.fn(() => ({ localiza: [] })),
  transformFAQs: vi.fn(() => ['FAQ']),
}))

import { fetchRentacarData } from '../../utils/rentacarDataFetch'
import { transformExtras, transformCategories } from '../../utils/transformers'

type Result = { data: unknown; error: unknown }
const ok = (data: unknown): Result => ({ data, error: null })
const errResult = (error: unknown): Result => ({ data: null, error })

// Mutated per test; read by the useRuntimeConfig stub below.
let publicConfig: Record<string, unknown> = {}

// Tuple order matches fetchRentacarData / handler destructuring:
// [categories, locations, company, cities, franchises, faqs, anchors]
function tuple(over: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, Result>> = {}): Result[] {
  const base: Result[] = [
    ok([{ id: 'B' }]),
    ok([{ code: 'BOG' }]),
    ok({ extra_driver_day_price: 15000 }),
    ok([{ slug: 'bogota' }]),
    ok([{ code: 'localiza' }]),
    ok([{ label: 'q' }]),
    { data: null, error: null }, // anchors: the pilot-off stub
  ]
  for (const [i, v] of Object.entries(over)) base[Number(i)] = v as Result
  return base
}

describe('server/api/rentacar-data.get — missing localiza fallback (#16)', () => {
  let handler: () => Promise<Record<string, unknown>>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Price freshness is owned by page ISR. Deliberately stub only the plain
    // event handler so reintroducing a second handler-cache clock fails import.
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
    // Issue #322 PR10: the handler scopes the franchises query to the deploy's
    // brand via runtimeConfig.
    publicConfig = { rentacarFranchise: 'alquilame' }
    vi.stubGlobal('useRuntimeConfig', () => ({ public: publicConfig }))
    vi.stubGlobal('createError', (opts: { message?: string; statusMessage?: string }) =>
      Object.assign(new Error(opts?.message ?? opts?.statusMessage ?? 'error'), opts),
    )
    handler = (await import('../rentacar-data.get')).default as unknown as typeof handler
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-16-1: missing localiza row (PGRST116) → extras undefined, no throw, transformExtras not called', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ 2: errResult({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }) }) as never,
    )

    const result = await handler()

    expect(result.extras).toBeUndefined()
    expect(result.categories).toEqual(['CAT'])
    expect(result.branches).toEqual(['BRANCH'])
    expect(result.vehicleCategories).toEqual({ B: {} })
    expect(result.cities).toEqual(['CITY'])
    expect(result.franchiseTestimonials).toEqual({ localiza: [] })
    expect(result.faqs).toEqual(['FAQ'])
    expect(vi.mocked(transformExtras)).not.toHaveBeenCalled()
  })

  it('SCEN-16-2: categories error → throws statusCode 500; extras never evaluated', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ 0: errResult({ message: 'boom' }) }) as never,
    )

    await expect(handler()).rejects.toMatchObject({ statusCode: 500 })
    expect(vi.mocked(transformExtras)).not.toHaveBeenCalled()
  })

  // Regression lock (code-reviewer suggestion): every booking-breaking query
  // (all results EXCEPT companyResult) must keep throwing 500. categories is
  // covered by SCEN-16-2; this pins the remaining four so a future edit can't
  // accidentally extend the localiza tolerance to them.
  it.each([
    ['locations', 1],
    ['cities', 3],
    ['franchises', 4],
    ['faqs', 5],
  ] as const)('regression: %s query error still throws 500', async (_label, idx) => {
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ [idx]: errResult({ message: 'boom' }) }) as never,
    )
    await expect(handler()).rejects.toMatchObject({ statusCode: 500 })
  })

  // Issue #322 PR10 (SCEN-322-K03 support): the deploy's brand code reaches
  // fetchRentacarData so the franchises query is scoped to one brand.
  it('passes the deploy brand (rentacarFranchise) to fetchRentacarData', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple() as never)

    await handler()

    expect(vi.mocked(fetchRentacarData)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetchRentacarData).mock.calls[0]?.[2]).toBe('alquilame')
  })

  it('does not retain catalog data between requests', async () => {
    vi.mocked(fetchRentacarData)
      .mockResolvedValueOnce(tuple({ 0: ok([{ id: 'FIRST' }]) }) as never)
      .mockResolvedValueOnce(tuple({ 0: ok([{ id: 'SECOND' }]) }) as never)

    await handler()
    await handler()

    expect(vi.mocked(fetchRentacarData)).toHaveBeenCalledTimes(2)
  })

  it('timestamps each returned catalog snapshot at the server fetch time', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple() as never)
    const before = Date.now()

    const result = await handler()

    expect(result.catalogFetchedAt).toEqual(expect.any(Number))
    expect(result.catalogFetchedAt as number).toBeGreaterThanOrEqual(before)
    expect(result.catalogFetchedAt as number).toBeLessThanOrEqual(Date.now())
  })

  it('SCEN-16-3: present localiza row → extras = transformExtras(row), called once', async () => {
    const companyRow = {
      extra_driver_day_price: 15000,
      baby_seat_day_price: 10000,
      wash_price: 20000,
      wash_onsite_price: 30000,
      wash_deep_price: 150000,
      wash_deep_upholstery_price: 225000,
    }
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple({ 2: ok(companyRow) }) as never)

    const result = await handler()

    expect(result.extras).toEqual({ extraDriverDayPrice: 999 })
    expect(vi.mocked(transformExtras)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transformExtras)).toHaveBeenCalledWith(companyRow)
  })
})

/**
 * Monthly struck-price anchor pilot (SCEN-M1/M2/M4).
 *
 * buildMonthlyAnchorMap is NOT mocked here: the point of these cases is that
 * real rows travel from the query result into transformCategories, which is
 * exactly the wiring a mock would hide.
 */
describe('server/api/rentacar-data.get — monthly anchors', () => {
  let handler: () => Promise<Record<string, unknown>>
  let warn: ReturnType<typeof vi.spyOn>

  const freshRow = (code: string, gross: number | string) => ({
    category_code: code,
    anchor_day_price_gross: gross,
    computed_at: new Date().toISOString(),
  })

  const anchorsArg = () => vi.mocked(transformCategories).mock.calls[0]?.[2]

  beforeEach(async () => {
    vi.clearAllMocks()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
    publicConfig = { rentacarFranchise: 'alquilame' }
    vi.stubGlobal('useRuntimeConfig', () => ({ public: publicConfig }))
    vi.stubGlobal('createError', (opts: { message?: string; statusMessage?: string }) =>
      Object.assign(new Error(opts?.message ?? opts?.statusMessage ?? 'error'), opts),
    )
    handler = (await import('../rentacar-data.get')).default as unknown as typeof handler
  })

  afterEach(() => {
    warn.mockRestore()
    vi.unstubAllGlobals()
  })

  it('SCEN-M1: pilot off (flag absent) → fetch asked NOT to read anchors, empty map, payload shape unchanged', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple() as never)

    const result = await handler()

    expect(vi.mocked(fetchRentacarData).mock.calls[0]?.[3]).toBe(false)
    expect(anchorsArg()).toEqual({})
    // Byte-identical to the pre-pilot response: same keys, same values, and no
    // anchor key smuggled in at the top level.
    expect(Object.keys(result).sort()).toEqual(
      ['branches', 'catalogFetchedAt', 'categories', 'cities', 'extras', 'faqs', 'franchiseTestimonials', 'vehicleCategories'],
    )
    expect(result.categories).toEqual(['CAT'])
  })

  it.each([
    ['empty string', ''],
    ['off', 'off'],
    ['true', 'true'],
    ['ON (wrong case)', 'ON'],
    ['boolean true', true],
  ] as const)('SCEN-M1: the flag only opens on the exact string "on" — %s keeps it closed', async (_label, value) => {
    publicConfig = { rentacarFranchise: 'alquilame', priceAnchorMonthly: value }
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple() as never)

    await handler()

    expect(vi.mocked(fetchRentacarData).mock.calls[0]?.[3]).toBe(false)
  })

  it('SCEN-M2: pilot on → anchors reach transformCategories keyed by category code', async () => {
    publicConfig = { rentacarFranchise: 'alquilame', priceAnchorMonthly: 'on' }
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ 6: ok([freshRow('GC', '280607.50'), freshRow('C', 150000)]) }) as never,
    )

    await handler()

    expect(vi.mocked(fetchRentacarData).mock.calls[0]?.[3]).toBe(true)
    expect(anchorsArg()).toEqual({ GC: 280607.5, C: 150000 })
  })

  it('SCEN-M2: the anchors are the THIRD argument — todayIso keeps its own default', async () => {
    publicConfig = { rentacarFranchise: 'alquilame', priceAnchorMonthly: 'on' }
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple({ 6: ok([freshRow('GC', 100)]) }) as never)

    await handler()

    expect(vi.mocked(transformCategories).mock.calls[0]?.[1]).toBeUndefined()
  })

  /**
   * R5, the whole point of this file: price_anchors is an accessory table. If
   * its failure ever produced a 500 like every other query above, one missing
   * grant would take the catalog — and the booking flow — of all three brands
   * down. This case is the lock on that.
   */
  it('SCEN-M4: an anchors query ERROR returns 200 with the catalog intact, warns, and drops the cap', async () => {
    publicConfig = { rentacarFranchise: 'alquilame', priceAnchorMonthly: 'on' }
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ 6: errResult({ message: 'permission denied for table price_anchors' }) }) as never,
    )

    const result = await handler()

    expect(result.categories).toEqual(['CAT'])
    expect(result.branches).toEqual(['BRANCH'])
    expect(result.faqs).toEqual(['FAQ'])
    expect(anchorsArg()).toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('price anchors unavailable')
  })

  it('SCEN-M4: unusable anchor rows (NULL gross, stale) are dropped without an error', async () => {
    publicConfig = { rentacarFranchise: 'alquilame', priceAnchorMonthly: 'on' }
    const stale = { category_code: 'C', anchor_day_price_gross: 100, computed_at: '2020-01-01T00:00:00Z' }
    vi.mocked(fetchRentacarData).mockResolvedValue(
      tuple({ 6: ok([freshRow('GC', 100), { ...freshRow('LE', 0), anchor_day_price_gross: null }, stale]) }) as never,
    )

    const result = await handler()

    expect(anchorsArg()).toEqual({ GC: 100 })
    expect(result.categories).toEqual(['CAT'])
    expect(warn).not.toHaveBeenCalled()
  })

  it('SCEN-M4: a stub anchors result (pilot off) yields an empty map, never a crash', async () => {
    vi.mocked(fetchRentacarData).mockResolvedValue(tuple({ 6: { data: null, error: null } }) as never)

    const result = await handler()

    expect(anchorsArg()).toEqual({})
    expect(result.categories).toEqual(['CAT'])
    expect(warn).not.toHaveBeenCalled()
  })
})
