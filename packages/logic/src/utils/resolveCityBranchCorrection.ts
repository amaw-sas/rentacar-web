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
 * foreign the whole URL is corrupt, so the return is realigned to the city too **only if it
 * is also foreign** (a deliberate Barranquilla→Medellín one-way under a Barranquilla page
 * keeps its Medellín return).
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
  // Foreign pickup ⇒ corrupt URL: realign the return too, but only when it is
  // also foreign — never clobber a legitimate cross-city return.
  if (returnBranch.city !== cityContext) {
    correction.lugar_devolucion = cityBranch.slug;
  }
  return correction;
}
