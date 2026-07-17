import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'

const toMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`)

/**
 * Picks the "Seguro Total" per-day charge that applies to a given pickup date.
 *
 * Uses the SAME date criterion as `pickPriceForDate` rule 1: an `active` row
 * whose validity range contains the pickup date; on overlaps, the most recent
 * `init_date` wins. It deliberately does NOT inherit the other fallbacks:
 *
 *   - No inactive (legacy) fallback: a retired pricing row must never quote a
 *     coverage upgrade (issue #322 PR10 — the legacy rows carry charges less
 *     than half the current rate).
 *   - No season-low fallback: quoting an out-of-range season's coverage would
 *     charge a price that does not apply to the reservation dates.
 *
 * Returns `null` when no active row applies to the date (or the row carries no
 * charge). Callers must treat `null` as "coverage cannot be quoted" and omit
 * the Seguro Total option visibly instead of rendering a wrong price.
 */
export function pickTotalCoverageChargeForDate(
  prices: CategoryMonthPriceData[] | null | undefined,
  pickupDate: string,
): number | null {
  if (!pickupDate || !Array.isArray(prices) || prices.length === 0) return null

  const pickupMs = toMs(pickupDate)
  if (Number.isNaN(pickupMs)) return null

  const applicable = prices
    .filter((p) => {
      if (p.status !== 'active') return false
      const initMs = toMs(p.init_date)
      const endMs = p.end_date ? toMs(p.end_date) : Number.POSITIVE_INFINITY
      return initMs <= pickupMs && pickupMs <= endMs
    })
    .sort((a, b) => b.init_date.localeCompare(a.init_date))

  const charge = applicable[0]?.total_coverage_unit_charge
  if (charge == null || Number.isNaN(Number(charge))) return null
  return Number(charge)
}
