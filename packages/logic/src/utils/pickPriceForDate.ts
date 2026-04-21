import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'

const toMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`)

const distanceToRange = (pickupMs: number, initIso: string, endIso: string): number => {
  const init = toMs(initIso)
  const end = endIso ? toMs(endIso) : Number.POSITIVE_INFINITY
  if (pickupMs < init) return init - pickupMs
  if (pickupMs > end) return pickupMs - end
  return 0
}

/**
 * Picks the monthly pricing row that applies to a given pickup date.
 *
 * Rules (per business spec):
 *   1. Prefer an `active` row whose validity range contains pickup date.
 *      If multiple match, the one with the most recent `init_date` wins
 *      (treated as "more specific / newer").
 *   2. If none match, fall back to the inactive (legacy) row whose validity
 *      range is closest in time to pickup date.
 *   3. If there is no legacy row either, fall back to the cheapest active
 *      row (season-low). Ties are broken by most recent `init_date`. This
 *      prevents categories with no `inactive` row from rendering as $0 when
 *      pickup falls outside every active range.
 *   4. Returns undefined when prices is empty or pickup is missing.
 */
export function pickPriceForDate(
  prices: CategoryMonthPriceData[],
  pickupDate: string,
): CategoryMonthPriceData | undefined {
  if (!pickupDate || prices.length === 0) return undefined

  const pickupMs = toMs(pickupDate)
  if (Number.isNaN(pickupMs)) return undefined

  const actives = prices.filter((p) => p.status === 'active')

  const activeMatch = actives
    .filter((p) => {
      const initMs = toMs(p.init_date)
      const endMs = p.end_date ? toMs(p.end_date) : Number.POSITIVE_INFINITY
      return initMs <= pickupMs && pickupMs <= endMs
    })
    .sort((a, b) => b.init_date.localeCompare(a.init_date))

  if (activeMatch.length > 0) return activeMatch[0]

  const legacy = prices
    .filter((p) => p.status === 'inactive')
    .map((p) => ({ p, dist: distanceToRange(pickupMs, p.init_date, p.end_date) }))
    .sort((a, b) => a.dist - b.dist)

  if (legacy.length > 0) return legacy[0].p

  const seasonLow = actives
    .slice()
    .sort((a, b) => {
      const delta = a['1k_kms'] - b['1k_kms']
      if (delta !== 0) return delta
      return b.init_date.localeCompare(a.init_date)
    })

  return seasonLow[0]
}
