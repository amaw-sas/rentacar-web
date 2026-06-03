/**
 * Decides whether a category is exempt from pico y placa (`true` → the web
 * renders the "sin pico y placa" badge), derived solely from the dashboard
 * column `picoyplaca_exempt` (issue #28).
 *
 * The column is the single source of truth: operations grant or revoke exemption
 * from the dashboard. An absent value (`null`/`undefined` — a stale cache or a
 * not-yet-saved category) means not exempt; there is no hardcoded fallback list.
 */
export function resolvePicoyPlacaExempt(
  picoyplacaExempt: boolean | null | undefined,
): boolean {
  return picoyplacaExempt ?? false
}
