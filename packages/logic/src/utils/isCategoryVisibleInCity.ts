import type { CategoryType } from './types/type/CategoryType'

// Transitional legacy fallback (issue #28 Ola C): the web's hardcoded geo rules,
// kept as an ADDITIONAL constraint (AND) because visibility_mode is NOT NULL
// DEFAULT 'all' — a not-yet-backfilled category reads 'all', so the data alone
// can't reproduce today's restrictions. Removed in Ola D, leaving only the data.
const BOGOTA_BRANCHES: readonly string[] = ['AABOT', 'ACBOT', 'ACBEX', 'ACBNN', 'ACBOJ']
const BOGOTA_ONLY: readonly CategoryType[] = ['FU', 'FL', 'GL']
const CX_CITIES: readonly string[] = ['barranquilla', 'bogota', 'bucaramanga', 'cali', 'cartagena', 'medellin', 'santa-marta']
const GY_CITIES: readonly string[] = ['barranquilla', 'bogota', 'bucaramanga', 'cali', 'cartagena', 'medellin', 'santa-marta', 'soledad']

// Replicates the three current hardcoded filters exactly, including their
// "no location selected → don't hide" guards. FU/FL/GL stay branch-based here
// (equivalent to city=bogota per O1) so the transition is byte-for-byte.
function legacyGeoAllows(
  categoryCode: CategoryType,
  pickupCity: string | null | undefined,
  pickupBranchCode: string | null | undefined,
): boolean {
  if (BOGOTA_ONLY.includes(categoryCode)) {
    return pickupBranchCode ? BOGOTA_BRANCHES.includes(pickupBranchCode) : true
  }
  if (categoryCode === 'CX') {
    return pickupCity ? CX_CITIES.includes(pickupCity) : true
  }
  if (categoryCode === 'GY') {
    return pickupCity ? GY_CITIES.includes(pickupCity) : true
  }
  return true
}

// Data path: a 'restricted' category is visible only in its whitelisted cities;
// 'all' (or anything non-restricted) imposes no data constraint. No pickup city
// → no data constraint (mirrors the legacy guards).
function dataGeoAllows(
  visibilityMode: string | null | undefined,
  allowedCities: readonly string[] | null | undefined,
  pickupCity: string | null | undefined,
): boolean {
  if (visibilityMode !== 'restricted') return true
  if (!pickupCity) return true
  const cities = allowedCities ?? []
  // Restricted but with no whitelist yet (mode flipped before the city rows
  // land, or a partial backfill) must NOT hide the category nationwide — fail
  // open and let the legacy AND-term govern. During the transition the data can
  // only ADD constraints once it actually carries cities; it never erases a
  // category by being half-configured.
  if (cities.length === 0) return true
  return cities.includes(pickupCity)
}

/**
 * Decides whether a category is offered at the selected pickup location,
 * derived from the dashboard's visibility_mode + category_city_visibility
 * (issue #28 Ola C), combined with the legacy hardcoded rules as a transitional
 * AND-constraint.
 *
 * `visible = dataGeoAllows AND legacyGeoAllows`. Because visibility_mode is
 * NOT NULL DEFAULT 'all', a not-yet-backfilled category reads 'all' and is held
 * back only by legacyGeoAllows (preserving today). Once backfilled, both agree.
 * A new category marked 'restricted' in the dashboard — not in any legacy list —
 * is constrained by the data alone. Ola D removes the legacy term.
 */
export function isCategoryVisibleInCity(
  visibilityMode: string | null | undefined,
  allowedCities: readonly string[] | null | undefined,
  categoryCode: CategoryType,
  pickupCity: string | null | undefined,
  pickupBranchCode: string | null | undefined,
): boolean {
  return (
    dataGeoAllows(visibilityMode, allowedCities, pickupCity) &&
    legacyGeoAllows(categoryCode, pickupCity, pickupBranchCode)
  )
}
