import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'

const toMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`)

// Only the 1k and 2k mileage plans are sellable monthly — the reservation UI
// offers those two (CategoryCard mileage select), and useTariffs.buildTariffs
// derives "offered monthly" the same way. A row priced only on 3k_kms has no
// selectable monthly plan, so it does not count as offering monthly.
const hasPositiveMonthlyPrice = (price: CategoryMonthPriceData): boolean =>
  price['1k_kms'] > 0 || price['2k_kms'] > 0

/**
 * Decides whether a category is offered for monthly rental, derived from its
 * pricing instead of a hardcoded category list (issue #28, Ola A).
 *
 * The dashboard models "not offered monthly" as `monthly_*_price = NULL`
 * (mig. 042), which the payload transformer surfaces as `month_prices` rows
 * with all mileage prices at 0. A category offers monthly when the row that
 * applies to the pickup date carries at least one positive 1k/2k price.
 *
 * Row selection is deliberately date-aware but money-safe:
 *
 *   1. If an `active` row's validity range contains the pickup date, that row
 *      is authoritative — its price is exactly what the customer would pay for
 *      those dates (same rule `pickPriceForDate` uses to display the price).
 *      A $0 in-range row therefore correctly excludes the category (e.g. a
 *      gama whose monthly was discontinued for that season).
 *   2. Otherwise — no in-range active row, because the pickup date is outside
 *      every configured range or is missing/invalid — fall back to "does any
 *      active row carry a positive monthly price?". This avoids excluding a
 *      genuinely-monthly category on the strength of a single off-season $0
 *      row that an out-of-range fallback would otherwise select, and avoids
 *      mass-excluding everything when the date is absent.
 *
 * When several active rows contain the date (overlapping ranges) the most
 * recent `init_date` wins, matching `pickPriceForDate`.
 */
export function categoryOffersMonthly(
  prices: CategoryMonthPriceData[],
  pickupDate: string,
): boolean {
  const pickupMs = pickupDate ? toMs(pickupDate) : Number.NaN

  if (!Number.isNaN(pickupMs)) {
    const inRange = prices
      .filter((p) => {
        if (p.status !== 'active') return false
        const initMs = toMs(p.init_date)
        const endMs = p.end_date ? toMs(p.end_date) : Number.POSITIVE_INFINITY
        return initMs <= pickupMs && pickupMs <= endMs
      })
      .sort((a, b) => b.init_date.localeCompare(a.init_date))

    const mostRecentInRange = inRange[0]
    if (mostRecentInRange) return hasPositiveMonthlyPrice(mostRecentInRange)
  }

  return prices.some((p) => p.status === 'active' && hasPositiveMonthlyPrice(p))
}
