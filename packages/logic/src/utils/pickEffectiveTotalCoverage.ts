/**
 * Returns the per-day total coverage charge to use in price calculations,
 * floored at the basic coverage charge. Prevents "Seguro Total" from
 * rendering cheaper than "Seguro Básico" when Supabase's
 * category_pricing.total_coverage_unit_charge is seeded below the basic
 * charge that the availability API returns.
 *
 * A triggered floor is a symptom, not a fix — resolve the underlying data
 * in Supabase so this safeguard stays dormant.
 */
export function pickEffectiveTotalCoverageUnitCharge(
  totalCoverageUnitCharge: number,
  coverageUnitCharge: number,
): number {
  return Math.max(totalCoverageUnitCharge, coverageUnitCharge)
}
