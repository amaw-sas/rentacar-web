import type { CategoryType } from './types/type/CategoryType'

// Transitional fallback (issue #28 Ola B2): reproduces the gamas the web
// hardcoded before the dashboard exposed `picoyplaca_exempt`. Used ONLY when a
// category arrives without the column (null/undefined) — i.e. before the
// migration is applied/backfilled in the Supabase the web reads. Removed in
// Ola D once the column is the sole source of truth.
const EXEMPT_FALLBACK: readonly CategoryType[] = ['FU', 'FL', 'GL', 'LY', 'LP', 'LU']

/**
 * Decides whether a category is exempt from pico y placa (`true` → the web
 * renders the "sin pico y placa" badge), derived from the dashboard column
 * with a transitional fallback to the legacy hardcoded list.
 *
 * The column is authoritative: an explicit `true`/`false` always wins over the
 * fallback, so operations can both grant and revoke exemption from the
 * dashboard. Only a missing value (`null`/`undefined`, before the column is
 * backfilled) falls back to the hardcoded gamas, preserving today's behavior.
 */
export function resolvePicoyPlacaExempt(
  picoyplacaExempt: boolean | null | undefined,
  categoryCode: CategoryType | null | undefined,
): boolean {
  if (picoyplacaExempt != null) return picoyplacaExempt
  return categoryCode ? EXEMPT_FALLBACK.includes(categoryCode) : false
}
