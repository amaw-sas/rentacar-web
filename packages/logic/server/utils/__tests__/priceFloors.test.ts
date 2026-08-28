import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildPriceFloor, PRICE_FLOOR_MAX_AGE_MS } from '../priceFloors'

const NOW = Date.parse('2026-08-28T12:00:00.000Z')
const fresh = (msAgo = 0) => new Date(NOW - msAgo).toISOString()

const row = (gross: number | string | null, over: Record<string, unknown> = {}) => ({
  category_code: 'C',
  floor_day_price_gross: gross,
  computed_at: fresh(),
  ...over,
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildPriceFloor', () => {
  it('SCEN-1: returns the cheapest usable gross floor across categories', () => {
    // The real shape as of migration 142: C is the cheapest gama.
    const floor = buildPriceFloor(
      [
        row(157_696, { category_code: 'C' }),
        row(174_796, { category_code: 'CX' }),
        row(179_296, { category_code: 'F' }),
      ],
      NOW,
    )

    expect(floor).toBe(157_696)
  })

  it('does not depend on row order', () => {
    const ascending = buildPriceFloor([row(157_696), row(258_414)], NOW)
    const descending = buildPriceFloor([row(258_414), row(157_696)], NOW)

    expect(ascending).toBe(157_696)
    expect(descending).toBe(157_696)
  })

  it('parses the numeric column PostgREST sends as a string', () => {
    expect(buildPriceFloor([row('157696.10485')], NOW)).toBeCloseTo(157_696.10485)
  })

  it.each([
    ['null gross', null],
    ['absent gross', undefined as never],
    ['zero', 0],
    ['negative', -1],
    ['non-numeric string', 'nope'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('SCEN-2: drops an unusable gross (%s)', (_label, gross) => {
    expect(buildPriceFloor([row(gross as never)], NOW)).toBeNull()
  })

  it('SCEN-2: a dropped row does not hide a usable one', () => {
    expect(buildPriceFloor([row(null), row(157_696)], NOW)).toBe(157_696)
  })

  it('keeps a floor refreshed just inside the window', () => {
    expect(
      buildPriceFloor([row(157_696, { computed_at: fresh(PRICE_FLOOR_MAX_AGE_MS - 1000) })], NOW),
    ).toBe(157_696)
  })

  it('SCEN-2: drops a floor refreshed past the window', () => {
    expect(
      buildPriceFloor([row(157_696, { computed_at: fresh(PRICE_FLOOR_MAX_AGE_MS + 1000) })], NOW),
    ).toBeNull()
  })

  it('is stricter than the monthly anchor window — a 10-day-old floor is not publishable', () => {
    const tenDays = 10 * 24 * 60 * 60 * 1000

    expect(PRICE_FLOOR_MAX_AGE_MS).toBeLessThan(14 * 24 * 60 * 60 * 1000)
    expect(buildPriceFloor([row(157_696, { computed_at: fresh(tenDays) })], NOW)).toBeNull()
  })

  it.each([
    ['missing', undefined as never],
    ['null', null],
    ['unparseable', 'ayer'],
  ])('SCEN-2: drops a row whose computed_at is %s', (_label, computedAt) => {
    expect(buildPriceFloor([row(157_696, { computed_at: computedAt })], NOW)).toBeNull()
  })

  it('treats a future computed_at as fresh — clock skew is not staleness', () => {
    expect(
      buildPriceFloor([row(157_696, { computed_at: new Date(NOW + 60_000).toISOString() })], NOW),
    ).toBe(157_696)
  })

  it('SCEN-2: returns null for anything unusable at the top level', () => {
    expect(buildPriceFloor(null, NOW)).toBeNull()
    expect(buildPriceFloor(undefined, NOW)).toBeNull()
    expect(buildPriceFloor([], NOW)).toBeNull()
    expect(buildPriceFloor('nope' as never, NOW)).toBeNull()
    expect(buildPriceFloor([null, undefined] as never, NOW)).toBeNull()
  })

  it('defaults nowMs to the current clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    expect(buildPriceFloor([row(157_696)])).toBe(157_696)
    expect(buildPriceFloor([row(157_696, { computed_at: fresh(PRICE_FLOOR_MAX_AGE_MS + 1000) })])).toBeNull()
  })
})
