import type BranchData from './types/data/BranchData';

/**
 * Issue #129: the pickup branch MUST belong to the page's city. A search URL like
 * `/barranquilla/.../lugar-recogida/armenia-aeropuerto/...` renders Barranquilla but
 * searches Armenia's inventory — a data-integrity defect visible to the user.
 *
 * Pure decision (the effect — navigateTo/createMessage — stays in the brand middleware):
 * given the resolved pickup/return branches, the page city, and the city's default branch
 * (looked up by the caller via the store), return the corrected slug params, or `null`
 * when no correction is needed.
 *
 * Invariant: only the pickup must match the city. The return may be elsewhere (one-way /
 * traslado is valid by design), so a legitimate one-way — which always has a valid in-city
 * pickup — returns `null` on the first line and is never touched. When the *pickup* is
 * foreign the return is realigned to the city **only when it mirrors the foreign pickup's
 * city** — the echo case of the bug (`armenia` pickup + `armenia` return under a Barranquilla
 * page), which a Barranquilla round-trip clearly satisfies. A return in any *other* city —
 * including a third valid city (`armenia` pickup + `medellin` return) — is preserved, so the
 * user's distinct return intent is never silently dropped.
 *
 * Loop-safe by construction: only the city tier is used (never a global `bogota` fallback),
 * so the returned branch satisfies `.city === cityContext`. Re-evaluating the corrected URL
 * yields `null` → the middleware cannot redirect-loop.
 */
export function resolveCityBranchCorrection(
  pickupBranch: BranchData,
  returnBranch: BranchData,
  cityContext: string,
  cityBranch: BranchData | undefined,
): { lugar_recogida: string; lugar_devolucion?: string } | null {
  // Pickup already in the page city → nothing to fix (one-way preserved).
  if (pickupBranch.city === cityContext) return null;
  // No resolvable in-city branch (or its slug not yet computed) → can't correct
  // safely; pass through (degraded, never a crash or a param=undefined URL).
  if (!cityBranch?.slug) return null;

  const correction: { lugar_recogida: string; lugar_devolucion?: string } = {
    lugar_recogida: cityBranch.slug,
  };
  // Foreign pickup: realign the return too only when it mirrors the foreign pickup
  // (the echo case) — never clobber a return pointing at a distinct, valid city.
  if (returnBranch.city === pickupBranch.city) {
    correction.lugar_devolucion = cityBranch.slug;
  }
  return correction;
}
