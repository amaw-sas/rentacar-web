import type CategoryMonthPriceData from './types/data/CategoryMonthPriceData'
import type CategoryAvailabilityData from './types/data/CategoryAvailabilityData'

const toMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`)

/**
 * Fuente única del predicado de horizonte de tarifas (issue #313).
 *
 * Devuelve `true` cuando `pickupDate` cae MÁS ALLÁ del `end_date` máximo de
 * TODAS las filas de pricing (cualquier `status`) — el caso donde no existe
 * ningún respaldo legítimo para cotizar y fabricar un precio es el riesgo que
 * señala la auditoría (tarifas 2027 sin cargar).
 *
 * NO es lo mismo que un hueco DENTRO del horizonte (falta un mes intermedio):
 * ese caso lo cubre a propósito el fallback de `pickPriceForDate` (PR #308).
 *
 * Reglas de borde:
 *   - Una fila ACTIVE con `end_date` vacío = tarifa vigente sin expiración =
 *     horizonte infinito → nunca excedido. Una fila INACTIVE open-ended NO
 *     extiende el horizonte vendible: es legacy, no una tarifa vigente, y
 *     dejarla conceder horizonte infinito reabriría el fallback silencioso que
 *     este fix cierra (se ignora en el cálculo del max).
 *   - `pickup` igual al max `end_date` NO está excedido (rango inclusivo).
 *   - `pickup` anterior a todo el dato NO cuenta como excedido (lo cubren las
 *     reglas de selección existentes; aquí solo importa el extremo superior).
 *   - `prices` vacío o `pickupDate` inválido/ausente → `false` (el camino
 *     `undefined` de `pickPriceForDate` ya maneja esos casos).
 *   - `prices` NO vacío pero sin ningún horizonte legítimo (todas las fechas
 *     corruptas, o solo filas inactive open-ended) → fail-CLOSED (`true`): con
 *     datos sin horizonte confiable, fabricar un precio es el mayor riesgo.
 */
export function isBeyondPricingHorizon(
  prices: CategoryMonthPriceData[],
  pickupDate: string,
): boolean {
  if (prices.length === 0) return false

  const pickupMs = toMs(pickupDate)
  if (Number.isNaN(pickupMs)) return false

  let maxEndMs = Number.NEGATIVE_INFINITY
  for (const p of prices) {
    if (!p.end_date) {
      // Solo una tarifa ACTIVE sin fin concede horizonte infinito.
      if (p.status === 'active') return false
      continue // inactive open-ended → no extiende el horizonte
    }
    const endMs = toMs(p.end_date)
    if (Number.isNaN(endMs)) continue
    if (endMs > maxEndMs) maxEndMs = endMs
  }

  // No hay horizonte legítimo (datos corruptos o solo inactive open-ended) y sí
  // hay filas → fail-closed. `prices` vacío ya salió arriba con `false`.
  if (maxEndMs === Number.NEGATIVE_INFINITY) return true

  return pickupMs > maxEndMs
}

/**
 * Nivel flujo (banner por marca): ¿TODAS las categorías renderizables caen más
 * allá del horizonte de tarifas para el pickup? (el caso 2027 del audit).
 * Excluye el centinela "unable" (`estimatedTotalAmount === 999999999`). Fuente
 * única compartida por las secciones de categorías de cada marca — evita
 * reimplementar el gate del banner y los tipos estructurales inline.
 *
 * El gate reactivo de reserva mensual (`haveMonthlyReservation`) vive en el
 * componente: aquí solo se decide sobre el horizonte de los datos.
 */
export function allRenderableBeyondHorizon(
  categories: CategoryAvailabilityData[],
  pickupDate: string,
): boolean {
  const available = categories.filter((c) => c.estimatedTotalAmount !== 999999999)
  return (
    available.length > 0 &&
    available.every((c) => isBeyondPricingHorizon(c.categoryMonthPrices ?? [], pickupDate))
  )
}
