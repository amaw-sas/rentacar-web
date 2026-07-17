/**
 * Issue #313 — fail-closed más allá del horizonte de datos de tarifas.
 *
 * `isBeyondPricingHorizon` es la ÚNICA definición del predicado de horizonte:
 * responde si un pickup cae más allá de TODO el dato de pricing cargado, en cuyo
 * caso no existe ningún respaldo legítimo para cotizar (el caso 2027 del audit).
 * Distinto de un hueco DENTRO del horizonte, que el fallback de pickPriceForDate
 * cubre a propósito (PR #308).
 *
 * SCEN-3 (holdout) y los bordes del predicado.
 */
import { describe, it, expect } from 'vitest'
import { isBeyondPricingHorizon, allRenderableBeyondHorizon } from '../pricingHorizon'
import type CategoryMonthPriceData from '../types/data/CategoryMonthPriceData'
import type CategoryAvailabilityData from '../types/data/CategoryAvailabilityData'

function row(
  init_date: string,
  end_date: string,
  status: 'active' | 'inactive' = 'active',
): CategoryMonthPriceData {
  return {
    '1k_kms': 1_000_000,
    '2k_kms': 1_500_000,
    '3k_kms': 2_000_000,
    init_date,
    end_date,
    total_insurance_price: 100_000,
    one_day_price: 90_000,
    status,
  }
}

describe('isBeyondPricingHorizon', () => {
  it('SCEN-1 base: pickup posterior al max end_date de TODAS las filas → true', () => {
    const prices = [
      row('2026-01-01', '2026-06-30'),
      row('2026-07-01', '2026-12-31'),
      row('2025-01-01', '2025-12-31', 'inactive'),
    ]
    // max end_date global = 2026-12-31
    expect(isBeyondPricingHorizon(prices, '2027-01-01')).toBe(true)
  })

  it('borde: pickup igual al max end_date NO está excedido → false', () => {
    const prices = [row('2026-07-01', '2026-12-31')]
    expect(isBeyondPricingHorizon(prices, '2026-12-31')).toBe(false)
  })

  it('SCEN-3: cualquier fila open-ended (end_date vacío) = horizonte infinito → false', () => {
    const prices = [
      row('2026-01-01', '2026-12-31'),
      row('2026-07-01', ''), // open-ended
    ]
    expect(isBeyondPricingHorizon(prices, '2099-01-01')).toBe(false)
  })

  it('borde: pickup ANTERIOR a todo el dato no cuenta como excedido → false', () => {
    const prices = [row('2026-07-01', '2026-12-31')]
    expect(isBeyondPricingHorizon(prices, '2020-01-01')).toBe(false)
  })

  it('borde: prices vacío → false', () => {
    expect(isBeyondPricingHorizon([], '2027-01-01')).toBe(false)
  })

  it('borde: pickupDate inválido o vacío → false', () => {
    const prices = [row('2026-07-01', '2026-12-31')]
    expect(isBeyondPricingHorizon(prices, '')).toBe(false)
    expect(isBeyondPricingHorizon(prices, 'not-a-date')).toBe(false)
  })

  it('el max se calcula sobre TODAS las filas acotadas incl. inactive', () => {
    const prices = [
      row('2026-01-01', '2026-06-30', 'active'),
      row('2026-07-01', '2027-06-30', 'inactive'), // inactive acotada extiende el horizonte
    ]
    expect(isBeyondPricingHorizon(prices, '2027-03-01')).toBe(false)
    expect(isBeyondPricingHorizon(prices, '2027-07-01')).toBe(true)
  })

  it('HIGH: una fila INACTIVE open-ended NO concede horizonte infinito (fail-closed)', () => {
    // Tarifas active acotadas a 2026-12-31 + una legacy inactive sin fin. Un
    // pickup 2027 debe seguir excediendo el horizonte: la inactive open-ended no
    // es una tarifa vigente y no puede reabrir el fallback silencioso.
    const prices = [
      row('2026-07-01', '2026-12-31', 'active'),
      row('2020-01-01', '', 'inactive'), // legacy open-ended
    ]
    expect(isBeyondPricingHorizon(prices, '2027-01-01')).toBe(true)
    // dentro del horizonte activo sigue sin exceder
    expect(isBeyondPricingHorizon(prices, '2026-08-01')).toBe(false)
  })

  it('una fila ACTIVE open-ended junto a inactive open-ended SÍ concede infinito', () => {
    const prices = [
      row('2026-01-01', '', 'active'), // tarifa vigente sin expiración
      row('2020-01-01', '', 'inactive'),
    ]
    expect(isBeyondPricingHorizon(prices, '2099-01-01')).toBe(false)
  })

  it('MEDIUM: filas con fechas todas corruptas (no vacías) → fail-closed (true)', () => {
    const prices = [row('2026-01-01', 'TBD'), row('2026-02-01', '2027-13-45')]
    expect(isBeyondPricingHorizon(prices, '2026-06-01')).toBe(true)
  })

  it('solo filas inactive open-ended (sin active) → fail-closed (true)', () => {
    const prices = [row('2020-01-01', '', 'inactive'), row('2019-01-01', '', 'inactive')]
    expect(isBeyondPricingHorizon(prices, '2026-06-01')).toBe(true)
  })
})

function category(
  monthPrices: CategoryMonthPriceData[],
  estimatedTotalAmount = 800_000,
): CategoryAvailabilityData {
  return { categoryMonthPrices: monthPrices, estimatedTotalAmount } as CategoryAvailabilityData
}

const bounded = [row('2026-07-01', '2026-12-31')] // horizonte = 2026-12-31

describe('allRenderableBeyondHorizon (nivel flujo — banner)', () => {
  it('todas las categorías más allá del horizonte → true', () => {
    const cats = [category(bounded), category(bounded)]
    expect(allRenderableBeyondHorizon(cats, '2027-06-01')).toBe(true)
  })

  it('SCEN-4b: horizontes divergentes (una dentro) → false (sin banner de flujo)', () => {
    const withinRows = [row('2026-01-01', '')] // open-ended → nunca excede
    const cats = [category(bounded), category(withinRows)]
    // pickup 2027: la primera excede, la segunda no → NO todas exceden
    expect(allRenderableBeyondHorizon(cats, '2027-06-01')).toBe(false)
  })

  it('todas dentro del horizonte → false', () => {
    const cats = [category(bounded), category(bounded)]
    expect(allRenderableBeyondHorizon(cats, '2026-08-01')).toBe(false)
  })

  it('ignora las categorías centinela "unable" (999999999)', () => {
    // única renderizable (no-centinela) está más allá → true; el centinela no cuenta
    const cats = [category(bounded, 999999999), category(bounded)]
    expect(allRenderableBeyondHorizon(cats, '2027-06-01')).toBe(true)
  })

  it('sin categorías renderizables (todas centinela o vacío) → false', () => {
    expect(allRenderableBeyondHorizon([category(bounded, 999999999)], '2027-06-01')).toBe(false)
    expect(allRenderableBeyondHorizon([], '2027-06-01')).toBe(false)
  })
})
