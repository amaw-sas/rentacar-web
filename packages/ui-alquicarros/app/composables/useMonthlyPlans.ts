// Predicados de tarifa mensual del wizard (alquicarros, marca-local).
//
// Núcleo puro y sin dependencias de Nuxt, en la forma de useReservationWizard:
// se puede probar ejecutándolo, sin montar nada.
//
// El cálculo de "qué planes de kilometraje vende esta gama" vivía inlineado en
// StepCoverage.mileagePlans y en StepVehicle.rowMonthlyBasic. carrySelection
// (issue #368 B1) necesitaba un tercero, así que aquí queda el dueño único.

// utils
import { pickPriceForDate } from '@rentacar-main/logic/utils'

// Types
import type { CategoryMonthPriceData, MonthlyMileage } from '@rentacar-main/logic/utils'

/** Un plan vendible: su clave y el precio CRUDO de la fila que se cobra. */
export interface SellablePlan {
  value: MonthlyMileage
  price: number
}

/**
 * Planes que la gama vende de verdad para esa fecha de recogida, en ORDEN DE
 * KILOMETRAJE.
 *
 * El orden importa y no es el de precio: el plan por defecto del Paso 3 sale de
 * `plans[0]`, mientras que el piso "desde $X" del Paso 2 se calcula con `Math.min`
 * sobre estos mismos precios. Son dos reglas distintas que solo divergen cuando la
 * fila viene invertida (2k por debajo de 1k) o empatada — y colapsarlas cambiaría
 * en silencio el default del Paso 3.
 *
 * El plan de 3.000 km existe en el tipo `MonthlyMileage` y en los datos, pero
 * ninguna marca lo oferta (CategoryCard lo tiene tras `v-if="false"`, y
 * categoryOffersMonthly tampoco lo cuenta), así que nunca sale de aquí. Por eso la
 * lista es explícita y no un recorrido del tipo: un `Record<MonthlyMileage, …>`
 * arrastraría la clave prohibida solo por satisfacer a TypeScript.
 *
 * Un precio no positivo significa "no se vende": el dashboard limpia a NULL y el
 * transformer lo mapea a 0.
 *
 * La FILA la elige este helper, no el llamador. Debe ser la misma que
 * `useCategory.getCategoryMonthPrice` usa para cobrar —incluida la fila `inactive`
 * de respaldo cuando ninguna activa cubre la fecha—; elegirla de otro modo haría
 * que la etiqueta mienta sobre lo que se cobra. Más allá del horizonte de tarifas
 * `pickPriceForDate` devuelve undefined y aquí sale el conjunto vacío: fail-closed
 * de #313, sin planes que ofertar.
 */
export function sellablePlans(
  prices: CategoryMonthPriceData[] | null | undefined,
  pickupDate: string | null | undefined,
): SellablePlan[] {
  const row = prices?.length ? pickPriceForDate(prices, pickupDate ?? '') : undefined
  if (!row) return []

  const OFFERED: MonthlyMileage[] = ['1k_kms', '2k_kms']

  return OFFERED.map((value) => ({ value, price: row[value] })).filter((plan) => plan.price > 0)
}
