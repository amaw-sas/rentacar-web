/**
 * Reading order for the search-results list, mirroring the chat's ordering:
 * group by vehicle class (compacto → sedán → camioneta), then by transmission
 * within the class (mecánico → híbrido → automático), and finally by price
 * (applied by the caller as a tiebreak).
 *
 * Ranked by the stable Localiza gama CODE — a code's class and transmission are
 * intrinsic and don't change with label wording, so this never drifts when a
 * short_description is edited. Validated against the official Localiza 2026
 * catalog. A code not in the map falls in the middle so a new gama still shows
 * (then ordered by price) instead of vanishing.
 */

const CLASS_RANK = { compacto: 0, sedan: 1, camioneta: 2 } as const;

// code → [class, transmissionRank] where transmissionRank: 0 mecánico, 0.5 híbrido, 1 automático
const CATEGORY_CLASS_TRANS: Record<string, [keyof typeof CLASS_RANK, number]> = {
  C: ['compacto', 0], CX: ['compacto', 1],
  F: ['sedan', 0], FL: ['sedan', 0], FX: ['sedan', 1], FU: ['sedan', 1],
  G4: ['camioneta', 0], GY: ['camioneta', 0.5], LU: ['camioneta', 0.5],
  GC: ['camioneta', 1], GL: ['camioneta', 1], LE: ['camioneta', 1],
};

/** Lower = earlier in the list. Class × 2 + transmission keeps the buckets ordered. */
export function categoryReadingRank(code: string): number {
  const entry = CATEGORY_CLASS_TRANS[(code || '').toUpperCase()];
  if (!entry) return CLASS_RANK.sedan * 2 + 0.5; // unknown → middle, stays visible
  const [klass, trans] = entry;
  return CLASS_RANK[klass] * 2 + trans;
}
