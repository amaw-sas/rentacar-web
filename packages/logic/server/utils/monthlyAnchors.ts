/**
 * Monthly struck-price anchor: the p95 of what the category really quotes for
 * one day, WITH tax and IVA, so it is comparable with
 * `category_pricing.monthly_one_day_price` (which includes them). The client
 * caps the struck monthly price at this figure — see applyMonthlyAnchorCap.
 *
 * Everything here fails open: a row this module rejects simply produces no cap,
 * and the customer sees today's `one_day_price`. That is the whole reason the
 * dashboard column is nullable — the daily anchor must not depend on the
 * quality of the tax fields.
 */

/**
 * A refresh older than this is not trusted. The dashboard cron refreshes the
 * anchors weekly, so two missed runs are still inside the window; a table that
 * silently stopped refreshing falls out of it and the cap disappears instead of
 * quietly striking prices against months-old market data.
 */
export const MONTHLY_ANCHOR_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

export interface MonthlyAnchorRow {
  category_code?: string | null
  anchor_day_price_gross?: number | string | null
  computed_at?: string | null
}

/**
 * Indexes usable anchors by category code. Rejects (silently, by design):
 * NULL/absent gross — the column is nullable when no quote of the gama carried
 * derivable taxes; non-finite or <= 0 gross; a missing or unparseable
 * `computed_at`; and anything refreshed longer ago than
 * MONTHLY_ANCHOR_MAX_AGE_MS.
 *
 * `anchor_day_price_gross` arrives from PostgREST as a string on `numeric`
 * columns, so it goes through Number() rather than being trusted as a number.
 *
 * Codes are upper-cased and trimmed to match `CategoryData.id`. On duplicate
 * codes the first row wins — the table is keyed by (franchise, category_code)
 * and the caller filters by franchise, so a duplicate means a data problem, not
 * a choice to make here.
 *
 * A `computed_at` in the future (clock skew between the dashboard and this
 * deploy) counts as fresh: skew is not staleness.
 */
export function buildMonthlyAnchorMap(
  rows: MonthlyAnchorRow[] | null | undefined,
  nowMs: number = Date.now(),
): Record<string, number> {
  const map: Record<string, number> = {}
  if (!Array.isArray(rows)) return map

  for (const row of rows) {
    const code = typeof row?.category_code === 'string' ? row.category_code.trim().toUpperCase() : ''
    if (!code || code in map) continue

    const gross = Number(row?.anchor_day_price_gross)
    if (!Number.isFinite(gross) || gross <= 0) continue

    const computedAtMs = Date.parse(String(row?.computed_at ?? ''))
    if (!Number.isFinite(computedAtMs)) continue
    if (nowMs - computedAtMs > MONTHLY_ANCHOR_MAX_AGE_MS) continue

    map[code] = gross
  }

  return map
}
