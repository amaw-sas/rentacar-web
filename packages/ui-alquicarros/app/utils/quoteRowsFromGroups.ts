import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

/**
 * Filas del Paso 2 para «Copiar cotización»: todos los segmentos (también los
 * cerrados), en el orden de `groupBySegment`, un código una sola vez y sin los
 * códigos que no tienen fila.
 */
export function quoteRowsFromGroups(
  groups: ReadonlyArray<{ codes: readonly string[] }>,
  rowByCode: ReadonlyMap<string, CategoryAvailabilityData>,
): CategoryAvailabilityData[] {
  const seen = new Set<string>()
  const rows: CategoryAvailabilityData[] = []
  for (const group of groups) {
    for (const code of group.codes) {
      if (seen.has(code)) continue
      seen.add(code)
      const row = rowByCode.get(code)
      if (row) rows.push(row)
    }
  }
  return rows
}
