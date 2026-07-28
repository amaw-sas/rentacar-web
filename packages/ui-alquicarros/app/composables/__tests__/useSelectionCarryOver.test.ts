/**
 * Issue #368 B1, paso 3 — `carrySelection`, el núcleo del arrastre entre gamas.
 *
 * Elegir otra gama en el Paso 2 construye una instancia FRESCA de `useCategory`, con
 * todos sus flags en el default. Hoy eso borra Seguro Total, plan de kilometraje y los
 * tres adicionales sin avisar. Esta función decide qué sobrevive y qué cae, y es pura:
 * el llamador aplica el resultado sobre la instancia nueva ANTES de asignarla al store.
 *
 * Las cinco reglas del spec, más las dos que la tabla existe para no dejar colapsar:
 *
 *   - El conjunto vendible VACÍO conserva el valor entrante y **nunca devuelve null**.
 *     `isMonthlyPriceUnavailable` (useCategory.ts:111-113) está gateado por
 *     `!!withMileage.value`: un null apaga el fail-closed de #313 y se acaba
 *     registrando `total_price: 0` sin `monthly_mileage` — el bug de la PR #308.
 *     Y además NO anuncia pérdida: no se perdió nada, se conservó el valor y el
 *     fail-closed hará su trabajo. Anunciarla pintaría un banner reclamando un plan
 *     caído justo al lado de un resumen que muestra "—".
 *
 *   - La corrección de kilometraje es "el primero en orden de KILOMETRAJE", no "el
 *     más barato". Solo divergen con la fila invertida, y colapsarlas cambiaría en
 *     silencio el default del Paso 3 (StepCoverage toma `plans[0]`).
 */
import { describe, it, expect } from 'vitest'

import { carrySelection, DEFAULT_SELECTION_FLAGS } from '../useSelectionCarryOver'

import type { SelectionFlags } from '../useSelectionCarryOver'
import type { SellablePlan } from '../useMonthlyPlans'

/** Flags de una gama con todo activado, para que cada caso apague lo suyo. */
function flags(overrides: Partial<SelectionFlags> = {}): SelectionFlags {
  return {
    withTotalCoverage: true,
    withMileage: '2k_kms',
    withExtraDriver: true,
    withBabySeat: true,
    withWash: true,
    ...overrides,
  }
}

const PLANS_AMBOS: SellablePlan[] = [
  { value: '1k_kms', price: 1_000_000 },
  { value: '2k_kms', price: 1_400_000 },
]
const PLANS_SOLO_1K: SellablePlan[] = [{ value: '1k_kms', price: 1_000_000 }]

describe('carrySelection — qué sobrevive al cambio de gama', () => {
  it('arrastra todo cuando la gama nueva cotiza Total y vende el mismo plan', () => {
    const result = carrySelection(flags(), {
      monthly: true,
      canQuoteTotal: true,
      sellablePlans: PLANS_AMBOS,
    })

    expect(result.flags).toEqual(flags())
    expect(result.dropped).toEqual([])
  })

  it('el Seguro Total que la gama nueva no cotiza cae y se anuncia', () => {
    // SCEN-368B1-02. `canQuoteTotal` ya es el predicado consciente del mensual:
    // aquí llega false, que en regular significa "sin cargo diario aplicable".
    const result = carrySelection(flags(), {
      monthly: false,
      canQuoteTotal: false,
      sellablePlans: [],
    })

    expect(result.flags.withTotalCoverage).toBe(false)
    expect(result.dropped).toEqual(['seguroTotal'])
  })

  it('el plan de kilometraje que la gama nueva no vende cae al vendible y se anuncia', () => {
    // SCEN-368B1-03: la gama B solo vende 1.000 km.
    const result = carrySelection(flags({ withMileage: '2k_kms' }), {
      monthly: true,
      canQuoteTotal: true,
      sellablePlans: PLANS_SOLO_1K,
    })

    expect(result.flags.withMileage).toBe('1k_kms')
    expect(result.dropped).toEqual(['kilometraje'])
  })

  it('corrige al primero en orden de KILOMETRAJE, no al más barato', () => {
    // Fila invertida: 2k por debajo de 1k. "El más barato" daría 2k y cambiaría en
    // silencio el default del Paso 3, que sale de `plans[0]`.
    const invertidos: SellablePlan[] = [
      { value: '1k_kms', price: 1_400_000 },
      { value: '2k_kms', price: 900_000 },
    ]

    const result = carrySelection(flags({ withMileage: '3k_kms' }), {
      monthly: true,
      canQuoteTotal: true,
      sellablePlans: invertidos,
    })

    expect(result.flags.withMileage).toBe('1k_kms')
  })

  it('con el conjunto vendible VACÍO conserva el valor entrante y NO anuncia nada', () => {
    // SCEN-368B1-12: más allá del horizonte de tarifas no hay fila, así que no hay
    // planes. Devolver null apagaría el fail-closed de #313 (PR #308).
    const result = carrySelection(flags({ withMileage: '2k_kms' }), {
      monthly: true,
      canQuoteTotal: true,
      sellablePlans: [],
    })

    expect(result.flags.withMileage).not.toBeNull()
    expect(result.flags.withMileage).toBe('2k_kms')
    expect(result.dropped).toEqual([])
  })

  it('los tres adicionales sobreviven aunque caiga todo lo demás', () => {
    // SCEN-368B1-04. No dependen de la tarifa de la gama: son cargos aparte.
    const result = carrySelection(flags(), {
      monthly: true,
      canQuoteTotal: false,
      sellablePlans: PLANS_SOLO_1K,
    })

    expect(result.flags.withExtraDriver).toBe(true)
    expect(result.flags.withBabySeat).toBe(true)
    expect(result.flags.withWash).toBe(true)
    expect(result.dropped).toEqual(['seguroTotal', 'kilometraje'])
  })

  it('en reserva REGULAR no toca ni anuncia el kilometraje', () => {
    // Una gama puede traer `month_prices` aunque el alquiler sea de 7 días. Corregir
    // ahí anunciaría la pérdida de un plan que el usuario nunca eligió.
    const result = carrySelection(flags({ withMileage: '2k_kms' }), {
      monthly: false,
      canQuoteTotal: true,
      sellablePlans: PLANS_SOLO_1K,
    })

    expect(result.flags.withMileage).toBe('2k_kms')
    expect(result.dropped).toEqual([])
  })

  it('sin selección previa devuelve los defaults y no anuncia nada', () => {
    // SCEN-368B1-07: no hay nada que arrastrar ni que anunciar. Los defaults son los
    // de useCategory.ts:72-76, que es lo que la instancia nueva ya trae.
    const result = carrySelection(null, {
      monthly: true,
      canQuoteTotal: false,
      sellablePlans: PLANS_SOLO_1K,
    })

    expect(result.flags).toEqual(DEFAULT_SELECTION_FLAGS)
    expect(result.dropped).toEqual([])
  })

  it('los defaults son exactamente los de useCategory', () => {
    // Si logic cambiara alguno, el arrastre "sin previo" dejaría de ser un no-op y
    // esta tabla es el único sitio donde eso se ve.
    expect(DEFAULT_SELECTION_FLAGS).toEqual({
      withTotalCoverage: false,
      withMileage: '1k_kms',
      withExtraDriver: false,
      withBabySeat: false,
      withWash: false,
    })
  })

  it('no muta el objeto de flags entrante', () => {
    // El llamador captura los flags de la instancia VIEJA; si carrySelection los
    // mutara, el tracking de la selección anterior mediría el estado corregido.
    const prev = flags({ withMileage: '2k_kms' })
    const snapshot = { ...prev }

    carrySelection(prev, { monthly: true, canQuoteTotal: false, sellablePlans: PLANS_SOLO_1K })

    expect(prev).toEqual(snapshot)
  })
})
