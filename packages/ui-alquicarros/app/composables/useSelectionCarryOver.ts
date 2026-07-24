// Arrastre de la selección entre gamas (alquicarros, marca-local — issue #368 B1).
//
// Núcleo puro y sin dependencias de Nuxt, en la forma de useReservationWizard: se
// prueba ejecutándolo, sin montar nada.
//
// Elegir otra gama en el Paso 2 construye una instancia FRESCA de `useCategory`, con
// todos sus flags en el default (useCategory.ts:72-76). Sin arrastre eso borra el
// Seguro Total, el plan de kilometraje y los tres adicionales que el usuario ya había
// elegido, sin decirlo.

// Types
import type { MonthlyMileage } from '@rentacar-main/logic/utils'
import type { SellablePlan } from './useMonthlyPlans'

/** Lo que el usuario eligió sobre una gama y puede sobrevivir a cambiarla. */
export interface SelectionFlags {
  withTotalCoverage: boolean
  withMileage: MonthlyMileage | null
  withExtraDriver: boolean
  withBabySeat: boolean
  withWash: boolean
}

/** Qué se perdió al cambiar de gama, en el orden en que el aviso lo nombra. */
export type CarryDropped = 'seguroTotal' | 'kilometraje'

/** Lo que la gama NUEVA permite. `canQuoteTotal` es el predicado consciente del mensual. */
export interface CarryContext {
  monthly: boolean
  canQuoteTotal: boolean
  sellablePlans: SellablePlan[]
}

export interface CarryResult {
  flags: SelectionFlags
  dropped: CarryDropped[]
}

/**
 * Los defaults de `useCategory.ts:72-76`, que es lo que una instancia recién
 * construida ya trae. Duplicados aquí a propósito: `useCategory` los expone como
 * refs vivos dentro de una instancia, y este núcleo es puro.
 */
export const DEFAULT_SELECTION_FLAGS: SelectionFlags = {
  withTotalCoverage: false,
  withMileage: '1k_kms',
  withExtraDriver: false,
  withBabySeat: false,
  withWash: false,
}

/**
 * Qué sobrevive al cambio de gama y qué cae.
 *
 * Puro y sin mutar `prev`: el llamador captura los flags de la instancia vieja, aplica
 * el resultado sobre la nueva y solo entonces la asigna al store. Ese orden es
 * load-bearing —el watcher de derivación de `ReservationWizard.vue:129-142` es
 * `flush: 'sync'`— y su porqué está escrito desde antes en
 * `CategorySelectionSection.vue:635-636`.
 *
 * Reglas:
 *
 *   - `withTotalCoverage` sobrevive si la gama nueva puede cotizarlo. `canQuoteTotal`
 *     tiene que venir del predicado consciente del mensual, no del
 *     `canQuoteTotalCoverage` crudo: en mensual el cobro sale de la fila del mes y no
 *     del cargo diario, así que el crudo tiraría el Seguro Total en gamas mensuales
 *     que sí lo venden y anunciaría una pérdida que no ocurrió.
 *
 *   - `withMileage` solo se toca en mensual. Sobrevive si la gama nueva vende ese
 *     plan; si no, cae al primero en ORDEN DE KILOMETRAJE — que es de donde
 *     `StepCoverage` saca su default (`plans[0]`), y no coincide con "el más barato"
 *     cuando la fila viene invertida.
 *
 *   - Con el conjunto vendible vacío conserva el valor entrante y **nunca devuelve
 *     null**: `isMonthlyPriceUnavailable` está gateado por `!!withMileage.value`
 *     (`useCategory.ts:111-113`), así que un null apaga el fail-closed de #313 y se
 *     acaba registrando `total_price: 0` sin `monthly_mileage` (bug de la PR #308).
 *     Tampoco anuncia: no se perdió nada, y el fail-closed ya pinta "—".
 *
 *   - Los tres adicionales sobreviven siempre. Son cargos aparte de la tarifa.
 *
 * Con `prev === null` devuelve los defaults y no anuncia nada. No corrige el
 * kilometraje ahí, y es seguro: sin gama previa el usuario no puede estar por delante
 * del Paso 3 —la red de seguridad de `ReservationWizard.vue:339-349` baja
 * `maxReachedStep` a 2 en cuanto la búsqueda asienta sin gama usable—, así que el
 * watcher correctivo de `StepCoverage` lo alcanza igual.
 */
export function carrySelection(prev: SelectionFlags | null, ctx: CarryContext): CarryResult {
  if (!prev) return { flags: { ...DEFAULT_SELECTION_FLAGS }, dropped: [] }

  const dropped: CarryDropped[] = []

  const totalFalls = prev.withTotalCoverage && !ctx.canQuoteTotal
  if (totalFalls) dropped.push('seguroTotal')

  let withMileage = prev.withMileage
  if (ctx.monthly && ctx.sellablePlans.length > 0) {
    const sold = ctx.sellablePlans.some((plan) => plan.value === withMileage)
    if (!sold) {
      withMileage = ctx.sellablePlans[0]!.value
      dropped.push('kilometraje')
    }
  }

  return {
    flags: {
      withTotalCoverage: prev.withTotalCoverage && ctx.canQuoteTotal,
      withMileage,
      withExtraDriver: prev.withExtraDriver,
      withBabySeat: prev.withBabySeat,
      withWash: prev.withWash,
    },
    dropped,
  }
}
