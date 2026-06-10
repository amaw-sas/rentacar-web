import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'

/**
 * Picks the representative "from" daily rate for a category landing page: the
 * cheapest positive `one_day_price` among `active` rows.
 *
 * Date-free by design. A city landing page has no pickup date, so any date we
 * could pass would be arbitrary. "Desde $X/día" semantics mean a floor, so the
 * lowest active daily rate is the honest representative. Being date-free also
 * makes selection deterministic — server and client renders produce the same
 * price, with no hydration mismatch in the JSON-LD.
 *
 * Returns `undefined` when no `active` row carries a positive `one_day_price`
 * (e.g. a category with no monthly plan, modeled as `one_day_price = 0`), so the
 * caller omits the offer rather than publishing a fabricated or $0 price.
 *
 * This is deliberately NOT `pickPriceForDate`: it never touches the temporal
 * season rules (which can fall back to a $0 season-low row for an out-of-range
 * date). It only selects the lowest active daily rate.
 */
export function pickRepresentativeDailyPrice(
  prices: CategoryMonthPriceData[],
): CategoryMonthPriceData | undefined {
  return prices
    .filter((p) => p.status === 'active' && p.one_day_price > 0)
    .sort((a, b) => {
      const delta = a.one_day_price - b.one_day_price
      if (delta !== 0) return delta
      // tie-break: most recent init_date wins, mirroring pickPriceForDate
      return b.init_date.localeCompare(a.init_date)
    })[0]
}
