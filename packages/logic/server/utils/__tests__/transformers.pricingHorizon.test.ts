/**
 * Issue #313 SCEN-7/8 — señal server-side proactiva.
 *
 * En cada rebuild del cache de rentacar-data, si el max `valid_until` global de
 * las tarifas mensuales está a menos de 60 días, se emite un warning en logs de
 * Vercel para que operación cargue nuevas tarifas ANTES de que el horizonte se
 * agote. Una fila con `valid_until` NULL/vacío = horizonte infinito → nunca avisa.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { warnIfPricingHorizonNear, transformCategories } from '../transformers'

const NOW = new Date('2026-07-17T00:00:00Z')

// Fila de pricing mínima; solo importa valid_until + status para el horizonte.
function pricing(valid_until: string | null, status: 'active' | 'inactive' = 'active') {
  return {
    total_coverage_unit_charge: 27500,
    monthly_1k_price: 3_000_000,
    monthly_2k_price: 3_500_000,
    monthly_3k_price: 4_000_000,
    monthly_insurance_price: 476_000,
    monthly_one_day_price: 220_000,
    valid_from: '2026-01-01',
    valid_until,
    status,
  }
}

// SupabaseCategory mínima con solo el pricing (el helper solo lee category_pricing).
// Nota: `.map((v) => pricing(v))`, NO `.map(pricing)` — map pasa el índice como
// 2º arg, que sobrescribiría el `status` (default 'active').
function category(...validUntils: (string | null)[]) {
  return {
    code: 'C',
    category_pricing: validUntils.map((v) => pricing(v)),
  } as unknown as Parameters<typeof warnIfPricingHorizonNear>[0][number]
}

describe('warnIfPricingHorizonNear (SCEN-7/8)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('SCEN-7: max valid_until a menos de 60 días → emite warning con fecha y días', () => {
    // max = 2026-08-16 ≈ 30 días desde NOW
    warnIfPricingHorizonNear([category('2026-06-30', '2026-08-16')], NOW)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const msg = String(warnSpy.mock.calls[0]![0])
    expect(msg).toContain('[pricing-horizon]')
    expect(msg).toContain('2026-08-16')
    expect(msg).toMatch(/30 days/)
  })

  it('SCEN-8: max valid_until a más de 60 días → sin warning', () => {
    // max = 2026-10-15 ≈ 90 días desde NOW
    warnIfPricingHorizonNear([category('2026-10-15')], NOW)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('SCEN-8: una fila ACTIVE valid_until NULL = horizonte infinito → sin warning aunque otra esté vencida', () => {
    warnIfPricingHorizonNear([category('2025-01-01', null)], NOW)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('una fila INACTIVE open-ended NO silencia el warning de una categoría por expirar', () => {
    // bounded active vencida (2026-08-16, ~30d) + legacy inactive open-ended.
    const cat = {
      code: 'C',
      category_pricing: [pricing('2026-08-16', 'active'), pricing(null, 'inactive')],
    } as unknown as Parameters<typeof warnIfPricingHorizonNear>[0][number]
    warnIfPricingHorizonNear([cat], NOW)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('borde: sin filas de pricing → sin warning ni crash', () => {
    expect(() => warnIfPricingHorizonNear([category()], NOW)).not.toThrow()
    expect(() => warnIfPricingHorizonNear([], NOW)).not.toThrow()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('el umbral por defecto (60 días) aplica cuando el horizonte ya venció', () => {
    warnIfPricingHorizonNear([category('2025-12-31')], NOW)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('SCEN-7 integración: transformCategories dispara el warning con datos vencidos', () => {
    // valid_until 2020 siempre está < hoy+60d, sea cual sea la fecha real de CI.
    transformCategories([
      {
        code: 'C',
        name: 'Gama C',
        description: '',
        image_url: '',
        category_models: [],
        category_pricing: [pricing('2020-12-31')],
      } as unknown as Parameters<typeof transformCategories>[0][number],
    ])
    expect(warnSpy).toHaveBeenCalled()
    expect(String(warnSpy.mock.calls[0]![0])).toContain('[pricing-horizon]')
  })
})
