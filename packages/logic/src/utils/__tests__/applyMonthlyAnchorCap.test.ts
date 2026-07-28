import { describe, it, expect } from 'vitest'
import { applyMonthlyAnchorCap } from '../applyMonthlyAnchorCap'

/**
 * SCEN-M2 (the cap bites), SCEN-M3 (min keeps an honest one_day_price) and
 * SCEN-M4 (anything unusable fails open). The invariant across every case:
 * the result is never ABOVE the one_day_price the customer sees today.
 */
describe('applyMonthlyAnchorCap', () => {
  it('SCEN-M2: caps an inflated one_day_price at the anchor (the GC case)', () => {
    expect(applyMonthlyAnchorCap(550_000, 280_607)).toBe(280_607)
  })

  it('SCEN-M3: keeps a one_day_price already at or below the anchor (the GY case)', () => {
    expect(applyMonthlyAnchorCap(550_000, 600_000)).toBe(550_000)
    expect(applyMonthlyAnchorCap(550_000, 550_000)).toBe(550_000)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['zero', 0],
    ['negative', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ] as const)('SCEN-M4: fails open on a %s anchor — one_day_price untouched', (_label, anchor) => {
    expect(applyMonthlyAnchorCap(550_000, anchor)).toBe(550_000)
  })

  it('SCEN-M5: returns a non-positive one_day_price unchanged (no anchor invents a price)', () => {
    expect(applyMonthlyAnchorCap(0, 280_607)).toBe(0)
    expect(applyMonthlyAnchorCap(-10, 280_607)).toBe(-10)
  })

  it('preserves NaN rather than substituting the anchor for a broken price', () => {
    expect(applyMonthlyAnchorCap(Number.NaN, 280_607)).toBeNaN()
  })

  it('is exact on decimals — no rounding sneaks into a displayed price', () => {
    expect(applyMonthlyAnchorCap(550_000, 280_607.49)).toBe(280_607.49)
  })

  it('never returns more than the one_day_price, for any anchor', () => {
    const prices = [1, 1000, 550_000, 1e9]
    const anchors = [null, undefined, -5, 0, 0.5, 999, 550_000, 1e12, Number.NaN]
    for (const price of prices) {
      for (const anchor of anchors) {
        expect(applyMonthlyAnchorCap(price, anchor as number | null | undefined)).toBeLessThanOrEqual(price)
      }
    }
  })

  it('is pure: same inputs, same output, no shared state', () => {
    expect(applyMonthlyAnchorCap(550_000, 280_607)).toBe(applyMonthlyAnchorCap(550_000, 280_607))
  })
})
