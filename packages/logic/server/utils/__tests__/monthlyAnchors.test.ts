import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildMonthlyAnchorMap, MONTHLY_ANCHOR_MAX_AGE_MS } from '../monthlyAnchors'

/**
 * Monthly struck-price anchor (SCEN-M2/M4). Every rejection path here is a
 * fail-open: no entry in the map means no cap means the customer sees today's
 * one_day_price. Nothing in this module may throw on bad data — the row comes
 * from an accessory table that must never be able to break the catalog.
 */

const NOW = Date.parse('2026-07-27T12:00:00.000Z')
const fresh = (msAgo = 0) => new Date(NOW - msAgo).toISOString()

afterEach(() => {
  vi.useRealTimers()
})

describe('buildMonthlyAnchorMap', () => {
  it('SCEN-M2: indexes a fresh anchor by category code', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: 280607.5, computed_at: fresh() }],
      NOW,
    )
    expect(map).toEqual({ GC: 280607.5 })
  })

  it('accepts the string PostgREST returns for a numeric column', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: '280607.50', computed_at: fresh() }],
      NOW,
    )
    expect(map.GC).toBe(280607.5)
  })

  it('normalises the code (trim + upper) so it matches CategoryData.id', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: '  gc ', anchor_day_price_gross: 100, computed_at: fresh() }],
      NOW,
    )
    expect(map).toEqual({ GC: 100 })
  })

  it('SCEN-M4: drops a NULL gross (the column is nullable on purpose)', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: null, computed_at: fresh() }],
      NOW,
    )
    expect(map).toEqual({})
  })

  it.each([
    ['zero', 0],
    ['negative', -100],
    ['non-numeric string', 'abc'],
    ['empty string', ''],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['undefined', undefined],
  ] as const)('SCEN-M4: drops a %s gross', (_label, gross) => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: gross as never, computed_at: fresh() }],
      NOW,
    )
    expect(map).toEqual({})
  })

  it('keeps an anchor refreshed just inside the staleness window', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: fresh(MONTHLY_ANCHOR_MAX_AGE_MS - 1000) }],
      NOW,
    )
    expect(map).toEqual({ GC: 100 })
  })

  it('SCEN-M4: drops an anchor past the staleness window (a stopped cron stops capping)', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: fresh(MONTHLY_ANCHOR_MAX_AGE_MS + 1000) }],
      NOW,
    )
    expect(map).toEqual({})
  })

  it('SCEN-M4: drops a row with a missing or unparseable computed_at', () => {
    expect(buildMonthlyAnchorMap([{ category_code: 'GC', anchor_day_price_gross: 100 }], NOW)).toEqual({})
    expect(
      buildMonthlyAnchorMap([{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: 'ayer' }], NOW),
    ).toEqual({})
    expect(
      buildMonthlyAnchorMap([{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: null }], NOW),
    ).toEqual({})
  })

  it('treats a future computed_at as fresh — clock skew is not staleness', () => {
    const map = buildMonthlyAnchorMap(
      [{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: new Date(NOW + 60_000).toISOString() }],
      NOW,
    )
    expect(map).toEqual({ GC: 100 })
  })

  it('drops rows with no usable code and keeps the rest of the batch', () => {
    const map = buildMonthlyAnchorMap(
      [
        { category_code: null, anchor_day_price_gross: 100, computed_at: fresh() },
        { category_code: '   ', anchor_day_price_gross: 100, computed_at: fresh() },
        { category_code: 'C', anchor_day_price_gross: 90, computed_at: fresh() },
      ],
      NOW,
    )
    expect(map).toEqual({ C: 90 })
  })

  it('keeps the FIRST row on a duplicate code', () => {
    const map = buildMonthlyAnchorMap(
      [
        { category_code: 'GC', anchor_day_price_gross: 100, computed_at: fresh() },
        { category_code: 'gc', anchor_day_price_gross: 999, computed_at: fresh() },
      ],
      NOW,
    )
    expect(map).toEqual({ GC: 100 })
  })

  it('SCEN-M4: returns an empty map for null/undefined/non-array input without throwing', () => {
    expect(buildMonthlyAnchorMap(null, NOW)).toEqual({})
    expect(buildMonthlyAnchorMap(undefined, NOW)).toEqual({})
    expect(buildMonthlyAnchorMap([], NOW)).toEqual({})
    expect(buildMonthlyAnchorMap('nope' as never, NOW)).toEqual({})
    expect(buildMonthlyAnchorMap([null, undefined] as never, NOW)).toEqual({})
  })

  it('defaults nowMs to the current clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    expect(
      buildMonthlyAnchorMap([{ category_code: 'GC', anchor_day_price_gross: 100, computed_at: fresh() }]),
    ).toEqual({ GC: 100 })
    expect(
      buildMonthlyAnchorMap([
        { category_code: 'GC', anchor_day_price_gross: 100, computed_at: fresh(MONTHLY_ANCHOR_MAX_AGE_MS + 1000) },
      ]),
    ).toEqual({})
  })

  it('the staleness window is 14 days (two missed weekly refreshes)', () => {
    expect(MONTHLY_ANCHOR_MAX_AGE_MS).toBe(14 * 24 * 60 * 60 * 1000)
  })
})
