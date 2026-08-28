/**
 * Publishable price floor: the p05 of what a category really quotes for one
 * day, WITH tax and IVA, straight from `price_floors` (migration 142).
 *
 * This is the mirror image of monthlyAnchors. The anchor is a p95 and caps a
 * struck-through price; this is a p05 and feeds the home `<title>`'s "desde"
 * claim. They share a table shape and a fiscal factor on purpose, and they fail
 * in opposite directions: dropping an anchor only removes a discount badge,
 * whereas dropping a floor removes a public price promise. Hence the tighter
 * staleness window below.
 */

/**
 * A refresh older than this is not trusted. `price-floors-refresh-daily`
 * (pg_cron, `30 8 * * *`) rewrites the table DAILY, so this window tolerates
 * six missed runs.
 *
 * Deliberately far stricter than MONTHLY_ANCHOR_MAX_AGE_MS (14 days): that one
 * guards a decorative strike-through, this one guards a number we publish to
 * Google as the cheapest day we sell. A frozen floor is exactly the failure
 * this replaces — the `$220.000` claim was wrong precisely because nothing ever
 * re-derived it.
 */
export const PRICE_FLOOR_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface PriceFloorRow {
  category_code?: string | null
  floor_day_price_gross?: number | string | null
  computed_at?: string | null
}

/**
 * Reduces the per-category rows to the single cheapest usable gross floor, or
 * `null` when none qualifies. One number and not a map because the only
 * consumer is the home metadata claim, which says "desde" — the floor of the
 * whole catalog, not of a gama the visitor has not picked yet.
 *
 * Rejects (silently, by design): NULL/absent gross — the column is nullable
 * whenever no fiscal factor was usable; non-finite or <= 0 gross; a missing or
 * unparseable `computed_at`; and anything refreshed longer ago than
 * PRICE_FLOOR_MAX_AGE_MS.
 *
 * `floor_day_price_gross` arrives from PostgREST as a string on `numeric`
 * columns, so it goes through Number() rather than being trusted as a number.
 *
 * A `computed_at` in the future (clock skew between the cron and this deploy)
 * counts as fresh: skew is not staleness. Same call as buildMonthlyAnchorMap.
 */
export function buildPriceFloor(
  rows: PriceFloorRow[] | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!Array.isArray(rows)) return null

  let floor: number | null = null

  for (const row of rows) {
    const gross = Number(row?.floor_day_price_gross)
    if (!Number.isFinite(gross) || gross <= 0) continue

    const computedAtMs = Date.parse(String(row?.computed_at ?? ''))
    if (!Number.isFinite(computedAtMs)) continue
    if (nowMs - computedAtMs > PRICE_FLOOR_MAX_AGE_MS) continue

    if (floor === null || gross < floor) floor = gross
  }

  return floor
}
