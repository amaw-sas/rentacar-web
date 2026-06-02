import { describe, it, expect } from 'vitest'
import { transformCategories } from '../transformers'

// Issue #28 Ola C: transformCategories must expose visibility_mode and unwrap
// the category_city_visibility(cities(slug)) embed into allowed_cities. Guards
// the embed-shape assumption (array of { cities: { slug } | null }).

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'x',
  code: 'CX',
  name: 'Gama CX',
  description: '',
  image_url: '',
  passenger_count: 5,
  luggage_count: 2,
  has_ac: true,
  transmission: 'manual',
  status: 'active',
  visibility_mode: 'restricted',
  group_label: '',
  short_description: '',
  long_description: '',
  tags: [],
  extra_km_charge: 0,
  category_models: [],
  category_pricing: [],
  ...overrides,
})

describe('transformCategories — geo visibility (Ola C)', () => {
  it('exposes visibility_mode and unwraps category_city_visibility into city slugs', () => {
    const result = transformCategories([
      makeRow({
        category_city_visibility: [
          { cities: { slug: 'bogota' } },
          { cities: { slug: 'cali' } },
        ],
      }),
    ] as never)
    expect(result[0]!.visibility_mode).toBe('restricted')
    expect(result[0]!.allowed_cities).toEqual(['bogota', 'cali'])
  })

  it('drops pivot rows whose city is null (deleted city) without emitting undefined', () => {
    const result = transformCategories([
      makeRow({
        category_city_visibility: [
          { cities: { slug: 'bogota' } },
          { cities: null },
        ],
      }),
    ] as never)
    expect(result[0]!.allowed_cities).toEqual(['bogota'])
  })

  it('defaults to mode all and empty cities when the embed is absent', () => {
    const result = transformCategories([
      makeRow({ visibility_mode: 'all', category_city_visibility: undefined }),
    ] as never)
    expect(result[0]!.visibility_mode).toBe('all')
    expect(result[0]!.allowed_cities).toEqual([])
  })
})
