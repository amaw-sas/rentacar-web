import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'

/**
 * Cheapest ACTIVE monthly 1.000 km rate = the low-season 1k floor.
 *
 * Mirrors the `seasonLow` rule documented in server/utils/transformers.ts: the
 * lowest `1k_kms` among `active` rows (tie-break: most recent `init_date`), which
 * is exactly what "temporada baja, plan 1.000 km" resolves to. Season is derived
 * from the min/max of active rows, not a DB flag.
 *
 * Returns `undefined` when no active row carries a positive monthly rate, so the
 * caller omits the price rather than showing $0 or a fabricated figure.
 */
export function lowSeasonMonthly1k(
  prices: CategoryMonthPriceData[],
): number | undefined {
  return prices
    .filter((p) => p.status === 'active' && p['1k_kms'] > 0)
    .sort((a, b) => {
      const delta = a['1k_kms'] - b['1k_kms']
      if (delta !== 0) return delta
      return b.init_date.localeCompare(a.init_date)
    })[0]?.['1k_kms']
}

/**
 * Daily figure advertised for 30-day low-season rentals: the low-season 1.000 km
 * monthly rate prorated over 30 days (`Math.round`). This is the same derivation
 * `useTariffs.toPlan` uses (`daily = round(monthly / 30)`).
 *
 * Returns `undefined` when no active row carries a positive monthly rate.
 */
export function lowSeasonDailyFrom30(
  prices: CategoryMonthPriceData[],
): number | undefined {
  const monthly = lowSeasonMonthly1k(prices)
  return monthly === undefined ? undefined : Math.round(monthly / 30)
}
