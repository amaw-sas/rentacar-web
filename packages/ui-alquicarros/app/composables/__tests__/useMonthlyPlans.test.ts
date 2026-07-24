/**
 * Issue #368 B1, paso 1 — `sellablePlans`, el conjunto de planes de kilometraje
 * que una gama realmente vende para una fecha de recogida.
 *
 * El cálculo vivía inlineado en dos sitios (`StepCoverage.mileagePlans` y
 * `StepVehicle.rowMonthlyBasic`) y `carrySelection` necesitaba un tercero. Este
 * es el dueño único.
 *
 * Dos invariantes que la extracción puede colapsar sin romper ningún test que ya
 * exista, y que por eso se fijan aquí:
 *
 *   1. El orden es por KILOMETRAJE, no por precio. El plan por defecto del Paso 3
 *      sale de `plans[0]`, mientras que el piso "desde $X" del Paso 2 se elige con
 *      `Math.min`. Son reglas distintas y solo divergen en dos entradas: fila
 *      invertida y empate.
 *   2. La fila la elige el helper con `pickPriceForDate`, no el llamador — debe ser
 *      la MISMA que `useCategory.getCategoryMonthPrice` usa para cobrar, incluida
 *      la fila `inactive` de respaldo. Elegirla de otro modo haría que la etiqueta
 *      mienta sobre lo que se cobra.
 *
 * Ejecución real, no regex sobre fuente: es una función pura.
 */
import { describe, it, expect } from 'vitest'

import { canQuoteTotalCoverageFor, sellablePlans } from '../useMonthlyPlans'

import type { CategoryMonthPriceData } from '@rentacar-main/logic/utils'

/** Fila de precios mensuales con lo mínimo que el helper mira. */
function row(overrides: Partial<CategoryMonthPriceData> = {}): CategoryMonthPriceData {
  return {
    '1k_kms': 1_000_000,
    '2k_kms': 1_400_000,
    '3k_kms': 0,
    init_date: '2026-01-01',
    end_date: '2026-12-31',
    total_insurance_price: 200_000,
    one_day_price: 0,
    status: 'active',
    ...overrides,
  } as CategoryMonthPriceData
}

const PICKUP = '2026-07-10'

describe('sellablePlans — qué planes vende la gama', () => {
  it('devuelve 1k y 2k en orden de kilometraje con los precios de la fila', () => {
    expect(sellablePlans([row()], PICKUP)).toEqual([
      { value: '1k_kms', price: 1_000_000 },
      { value: '2k_kms', price: 1_400_000 },
    ])
  })

  it('con la fila INVERTIDA (2k más barato que 1k) sigue devolviendo 1k primero', () => {
    // Aquí es donde "primer vendible en orden de km" y "el más barato" divergen.
    // El default del Paso 3 debe seguir siendo 1k; el piso "desde" lo calcula el
    // llamador con Math.min sobre estos mismos precios.
    const plans = sellablePlans([row({ '1k_kms': 1_400_000, '2k_kms': 900_000 })], PICKUP)

    expect(plans.map((p) => p.value)).toEqual(['1k_kms', '2k_kms'])
    expect(Math.min(...plans.map((p) => p.price))).toBe(900_000)
  })

  it('con EMPATE de precio también devuelve 1k primero', () => {
    // Un `reduce` con `<=` buscando "el más barato" se iría a 2k aquí.
    const plans = sellablePlans([row({ '1k_kms': 1_000_000, '2k_kms': 1_000_000 })], PICKUP)

    expect(plans[0]?.value).toBe('1k_kms')
  })

  it('omite el plan cuyo precio no es positivo', () => {
    expect(sellablePlans([row({ '2k_kms': 0 })], PICKUP).map((p) => p.value)).toEqual(['1k_kms'])
    expect(sellablePlans([row({ '1k_kms': 0 })], PICKUP).map((p) => p.value)).toEqual(['2k_kms'])
  })

  it('devuelve el conjunto VACÍO cuando ningún plan es vendible', () => {
    expect(sellablePlans([row({ '1k_kms': 0, '2k_kms': 0 })], PICKUP)).toEqual([])
  })

  it('nunca oferta 3k, ni siquiera con precio positivo', () => {
    // Ninguna marca lo vende: CategoryCard lo tiene tras `v-if="false"` y
    // categoryOffersMonthly tampoco lo cuenta. El tipo MonthlyMileage incluye
    // "3k_kms", así que un mapa Record<MonthlyMileage, …> lo arrastraría solo.
    const plans = sellablePlans([row({ '3k_kms': 2_000_000 })], PICKUP)

    expect(plans.map((p) => p.value)).not.toContain('3k_kms')
  })

  it('sin filas o sin fecha devuelve vacío', () => {
    expect(sellablePlans([], PICKUP)).toEqual([])
    expect(sellablePlans([row()], '')).toEqual([])
  })

  it('usa la fila INACTIVE de respaldo cuando ninguna activa cubre la fecha', () => {
    // Misma selección que useCategory usa para cobrar (regla 2 de pickPriceForDate).
    // Sustituye a la aserción de fuente que solo comprobaba que el nombre
    // `pickPriceForDate` apareciera en el componente.
    const legacy = row({
      status: 'inactive',
      init_date: '2025-01-01',
      end_date: '2025-12-31',
      '1k_kms': 700_000,
      '2k_kms': 950_000,
    })
    const activeElsewhere = row({ init_date: '2027-01-01', end_date: '2027-12-31' })

    expect(sellablePlans([activeElsewhere, legacy], '2026-03-15')).toEqual([
      { value: '1k_kms', price: 700_000 },
      { value: '2k_kms', price: 950_000 },
    ])
  })

  it('devuelve vacío más allá del horizonte de tarifas', () => {
    // pickPriceForDate falla cerrado (#313): sin fila no hay planes que ofertar.
    expect(sellablePlans([row({ init_date: '2026-01-01', end_date: '2026-12-31' })], '2027-06-01'))
      .toEqual([])
  })
})

/**
 * Issue #368 B1, paso 2 — `canQuoteTotalCoverageFor`.
 *
 * Réplica ejecutable de la regla que hoy vive inlineada en
 * `StepCoverage.vue:143-146`: en mensual el Seguro Total se cobra con
 * `total_insurance_price` de la fila del mes, así que no depende del cargo DIARIO;
 * en regular se cotiza con `totalCoverageUnitCharge`, y si `useCategory` no lo
 * tiene la card se omite (fallo visible en vez de cotizar un upgrade $0).
 *
 * `carrySelection` (paso 3) necesita la misma regla para decidir si
 * `withTotalCoverage` sobrevive al cambio de gama; duplicarla sería tener dos
 * respuestas a la misma pregunta en la misma pantalla.
 */
describe('canQuoteTotalCoverageFor — si la card de Seguro Total puede cotizarse', () => {
  it('en MENSUAL cotiza aunque la gama no tenga cargo diario de Total', () => {
    // Es la entrada de SCEN-368B1-02: el cobro sale de la fila del mes.
    expect(canQuoteTotalCoverageFor({ canQuoteTotalCoverage: false }, true)).toBe(true)
  })

  it('en REGULAR cotiza solo si la gama trae el cargo diario', () => {
    expect(canQuoteTotalCoverageFor({ canQuoteTotalCoverage: true }, false)).toBe(true)
  })

  it('en REGULAR con `canQuoteTotalCoverage: false` NO cotiza', () => {
    // No es redundante con el caso de categoría nula: el sentido del `=== true`
    // estricto es que `false` y `undefined` den ambos falso, y este es el `false`.
    expect(canQuoteTotalCoverageFor({ canQuoteTotalCoverage: false }, false)).toBe(false)
  })

  it('en REGULAR sin categoría NO cotiza', () => {
    // Lo que ve el watcher de StepCoverage:149-156 en el primer montaje, antes de
    // que la selección exista. `undefined` por la vía del optional chaining.
    expect(canQuoteTotalCoverageFor(null, false)).toBe(false)
    expect(canQuoteTotalCoverageFor(undefined, false)).toBe(false)
    expect(canQuoteTotalCoverageFor({}, false)).toBe(false)
  })

  it('en MENSUAL sin categoría sigue cotizando (el mensual decide antes de mirarla)', () => {
    // Preserva el comportamiento actual: `haveMonthlyReservation` corta primero.
    expect(canQuoteTotalCoverageFor(null, true)).toBe(true)
  })
})
