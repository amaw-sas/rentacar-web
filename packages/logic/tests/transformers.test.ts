import { describe, it, expect } from 'vitest'
import { transformVehicleCategories } from '../server/utils/transformers'

function makeSupabaseCategory(overrides: Record<string, any> = {}) {
  return {
    id: 'uuid-1',
    code: 'C',
    name: 'Compacto',
    description: 'Compacto desc',
    image_url: 'https://blob.vercel-storage.com/cat-c.webp',
    passenger_count: 5,
    luggage_count: 2,
    has_ac: true,
    transmission: 'manual',
    status: 'active',
    visibility_mode: 'public',
    group_label: 'Económico',
    short_description: 'Compacto mecánico',
    long_description: 'Vehículos pequeños y ágiles...',
    tags: ['Transmisión manual', 'Capacidad: 4-5 personas'],
    category_models: [
      { name: 'Fiat Mobi', description: 'o similar', image_url: 'https://blob.vercel-storage.com/mobi.webp', is_default: true, status: 'active' },
      { name: 'Kia Picanto', description: '', image_url: 'https://blob.vercel-storage.com/picanto.webp', is_default: false, status: 'active' },
    ],
    category_pricing: [
      {
        total_coverage_unit_charge: 15000,
        monthly_1k_price: 50000,
        monthly_2k_price: 60000,
        monthly_3k_price: 70000,
        monthly_insurance_price: 25000,
        monthly_one_day_price: 80000,
        valid_from: '2025-01-01',
        valid_until: '2025-12-31',
        status: 'active',
      },
    ],
    ...overrides,
  }
}

describe('transformVehicleCategories', () => {
  it('produces a dict keyed by category code', () => {
    const rows = [makeSupabaseCategory({ code: 'C' }), makeSupabaseCategory({ code: 'F', group_label: 'Intermedio' })]
    const result = transformVehicleCategories(rows)

    expect(Object.keys(result)).toEqual(['C', 'F'])
  })

  it('maps display fields correctly', () => {
    const result = transformVehicleCategories([makeSupabaseCategory()])
    const cat = result['C']

    expect(cat.grupo).toBe('Económico')
    expect(cat.descripcion_corta).toBe('Compacto mecánico')
    expect(cat.descripcion_larga).toBe('Vehículos pequeños y ágiles...')
    expect(cat.tags).toEqual(['Transmisión manual', 'Capacidad: 4-5 personas'])
  })

  it('maps models with single image URL', () => {
    const result = transformVehicleCategories([makeSupabaseCategory()])
    const modelos = result['C'].modelos

    expect(modelos).toHaveLength(2)
    expect(modelos[0].nombre).toBe('Fiat Mobi')
    expect(modelos[0].image).toBe('https://blob.vercel-storage.com/mobi.webp')
    expect(modelos[1].nombre).toBe('Kia Picanto')
  })

  it('handles missing/empty fields gracefully', () => {
    const result = transformVehicleCategories([makeSupabaseCategory({
      group_label: '',
      short_description: '',
      long_description: '',
      tags: [],
      category_models: [],
    })])
    const cat = result['C']

    expect(cat.grupo).toBe('')
    expect(cat.descripcion_corta).toBe('')
    expect(cat.modelos).toEqual([])
    expect(cat.tags).toEqual([])
  })

  it('returns empty dict for empty input', () => {
    expect(transformVehicleCategories([])).toEqual({})
  })
})
