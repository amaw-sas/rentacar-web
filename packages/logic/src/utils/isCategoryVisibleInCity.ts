/**
 * Decides whether a category is offered at the selected pickup city, derived
 * solely from the dashboard's visibility_mode + category_city_visibility
 * (issue #28). A `'restricted'` category is visible only in its whitelisted
 * cities; any other mode (`'all'`) imposes no geographic constraint. With no
 * pickup city resolved yet, nothing is hidden.
 *
 * Fail-open guard: a `'restricted'` category with an empty whitelist stays
 * visible nationwide. A half-configured restriction (mode flipped before the
 * city rows land) must never silently delist a sellable category — operators
 * must populate cities for a restriction to take effect.
 */
export function isCategoryVisibleInCity(
  visibilityMode: string | null | undefined,
  allowedCities: readonly string[] | null | undefined,
  pickupCity: string | null | undefined,
): boolean {
  if (visibilityMode !== 'restricted') return true
  if (!pickupCity) return true
  const cities = allowedCities ?? []
  if (cities.length === 0) return true // fail open: restricted-but-unbackfilled never delists nationwide
  return cities.includes(pickupCity)
}
