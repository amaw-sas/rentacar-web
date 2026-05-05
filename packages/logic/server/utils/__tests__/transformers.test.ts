import { describe, it, expect } from 'vitest'
import { transformCategories, transformBranches, transformExtras, transformCities, transformVehicleCategories } from '../transformers'

describe('transformCategories', () => {
  it('maps Supabase category to CategoryData interface', () => {
    const input = [{
      id: 'uuid-1',
      code: 'C',
      name: 'Gama C Económico Mecánico',
      description: '5 pasajeros, 2 equipajes, mecánico',
      image_url: 'https://example.com/c.webp',
      passenger_count: 5,
      luggage_count: 2,
      has_ac: true,
      transmission: 'manual',
      status: 'active',
      visibility_mode: 'all',
      category_models: [
        { name: 'Fiat Mobi 1.0', description: 'o similar', image_url: 'https://example.com/mobi.webp', is_default: true, status: 'active' },
        { name: 'Renault Kwid 1.0', description: 'o similar', image_url: 'https://example.com/kwid.webp', is_default: false, status: 'active' },
      ],
      category_pricing: [
        {
          total_coverage_unit_charge: 27500,
          monthly_1k_price: 3865990,
          monthly_2k_price: 3865990,
          monthly_3k_price: 4323990,
          monthly_insurance_price: 476000,
          monthly_one_day_price: 220000,
          valid_from: '2024-01-15',
          valid_until: '2025-12-30',
          status: 'active',
        },
      ],
    }]

    const result = transformCategories(input)

    expect(result).toHaveLength(1)
    const cat = result[0]
    expect(cat.id).toBe('C')
    expect(cat.identification).toBe('C')
    expect(cat.name).toBe('Gama C')
    expect(cat.category).toBe('Gama C Económico Mecánico')
    expect(cat.description).toBe('5 pasajeros, 2 equipajes, mecánico')
    expect(cat.image).toBe('https://example.com/c.webp')
    expect(cat.ad).toBe('')
    expect(cat.total_coverage_unit_charge).toBe(27500)

    expect(cat.models).toHaveLength(2)
    expect(cat.models[0]).toEqual({
      name: 'Fiat Mobi 1.0',
      image: 'https://example.com/mobi.webp',
      description: 'o similar',
      default: true,
    })

    expect(cat.month_prices).toHaveLength(1)
    expect(cat.month_prices[0]).toEqual({
      '1k_kms': 3865990,
      '2k_kms': 3865990,
      '3k_kms': 4323990,
      init_date: '2024-01-15',
      end_date: '2025-12-30',
      total_insurance_price: 476000,
      one_day_price: 220000,
      status: 'active',
    })
  })

  it('handles null pricing values with defaults', () => {
    const input = [{
      id: 'uuid-2',
      code: 'FU',
      name: 'Gama FU Sedán Automático',
      description: 'Sin pico y placa',
      image_url: '',
      passenger_count: 5,
      luggage_count: 2,
      has_ac: true,
      transmission: 'automatic',
      status: 'active',
      visibility_mode: 'all',
      category_models: [],
      category_pricing: [{
        total_coverage_unit_charge: 34000,
        monthly_1k_price: null,
        monthly_2k_price: null,
        monthly_3k_price: null,
        monthly_insurance_price: null,
        monthly_one_day_price: 340000,
        valid_from: '2024-01-15',
        valid_until: '2025-12-30',
        status: 'active',
      }],
    }]

    const result = transformCategories(input)
    const prices = result[0].month_prices[0]
    expect(prices['1k_kms']).toBe(0)
    expect(prices['2k_kms']).toBe(0)
    expect(prices['3k_kms']).toBe(0)
    expect(prices.total_insurance_price).toBe(0)
    expect(prices.one_day_price).toBe(340000)
    expect(prices.status).toBe('active')
  })

  it('passes through inactive pricing rows so the client can use them as fallback', () => {
    const input = [{
      id: 'uuid-3',
      code: 'G4',
      name: 'Gama G4',
      description: '',
      image_url: '',
      passenger_count: 5,
      luggage_count: 2,
      has_ac: true,
      transmission: 'manual',
      status: 'active',
      visibility_mode: 'all',
      category_models: [],
      category_pricing: [
        { total_coverage_unit_charge: 40000, monthly_1k_price: 7144990, monthly_2k_price: 7144990, monthly_3k_price: 8141990, monthly_insurance_price: 595000, monthly_one_day_price: 550000, valid_from: '2024-01-15', valid_until: '2025-12-30', status: 'active' },
        { total_coverage_unit_charge: 35000, monthly_1k_price: 6000000, monthly_2k_price: 6000000, monthly_3k_price: 7000000, monthly_insurance_price: 500000, monthly_one_day_price: 500000, valid_from: '2023-01-01', valid_until: '2023-12-31', status: 'inactive' },
      ],
    }]

    const result = transformCategories(input)
    expect(result[0].month_prices).toHaveLength(2)
    expect(result[0].month_prices.find(p => p.status === 'inactive')).toBeDefined()
    // total_coverage_unit_charge prefers active rows
    expect(result[0].total_coverage_unit_charge).toBe(40000)
  })

  // Inactive models must NOT reach the public site. Reservation history still
  // points at them in DB (see localiza fleet update policy: rule 2 — no delete,
  // only deactivate), but `rentacar-web` consumers should see only the current
  // catalog. Filter happens here because Supabase RLS exposes all rows to anon.
  it('excludes inactive category_models from public payload', () => {
    const input = [{
      id: 'uuid-f', code: 'F', name: 'Gama F Sedán Mecánico', description: '',
      image_url: '', passenger_count: 5, luggage_count: 2, has_ac: true,
      transmission: 'manual', status: 'active', visibility_mode: 'all',
      category_models: [
        { name: 'Renault Logan 1.6', description: '', image_url: '', is_default: true, status: 'active' },
        { name: 'Gol Trendline 1.6', description: '', image_url: '', is_default: false, status: 'inactive' },
        { name: 'Hyundai Accent 1.6', description: '', image_url: '', is_default: false, status: 'inactive' },
      ],
      category_pricing: [],
    }]

    const result = transformCategories(input)
    const names = result[0].models.map((m) => m.name)
    expect(names).toEqual(['Renault Logan 1.6'])
    expect(names).not.toContain('Gol Trendline 1.6')
    expect(names).not.toContain('Hyundai Accent 1.6')
  })

  // Resilience: a category with zero active models still renders (placeholder),
  // it MUST NOT disappear from the listing. This is why the filter lives in
  // the transformer instead of an `!inner` join in the SELECT.
  it('keeps the category visible even if every model is inactive', () => {
    const input = [{
      id: 'uuid-x', code: 'X', name: 'Gama X', description: '',
      image_url: '', passenger_count: 5, luggage_count: 2, has_ac: true,
      transmission: 'manual', status: 'active', visibility_mode: 'all',
      category_models: [
        { name: 'Old Model A', description: '', image_url: '', is_default: false, status: 'inactive' },
      ],
      category_pricing: [],
    }]

    const result = transformCategories(input)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('X')
    expect(result[0].models).toEqual([])
  })
})

describe('transformVehicleCategories', () => {
  it('excludes inactive models from modelos array (mirror of transformCategories filter)', () => {
    const input = [{
      id: 'uuid-f', code: 'F', name: 'Gama F Sedán Mecánico', description: '',
      image_url: '', passenger_count: 5, luggage_count: 2, has_ac: true,
      transmission: 'manual', status: 'active', visibility_mode: 'all',
      group_label: 'Sedán', short_description: 'corta', long_description: 'larga', tags: ['economy'],
      category_models: [
        { name: 'Renault Logan 1.6', description: '', image_url: 'logan.webp', is_default: true, status: 'active' },
        { name: 'Gol Trendline 1.6', description: '', image_url: 'gol.webp', is_default: false, status: 'inactive' },
      ],
      category_pricing: [],
    }]

    const result = transformVehicleCategories(input)
    expect(result.F.modelos.map((m) => m.nombre)).toEqual(['Renault Logan 1.6'])
  })
})

describe('transformBranches', () => {
  it('prefers cities.slug (canonical) over legacy city text', () => {
    const input = [
      { id: 'uuid-a', code: 'AABOT', name: 'Bogotá Aeropuerto', city: 'Bogotá', slug: 'bogota-aeropuerto', schedule: { display: 'Lun-Dom 24 horas | Festivos 06:00-21:00' }, status: 'active', cities: { slug: 'bogota' } },
      { id: 'uuid-b', code: 'AAMDL', name: 'Medellín Aeropuerto José María Córdoba', city: 'Medellin', slug: 'medellin-aeropuerto-jose-maria-cordoba', schedule: { display: 'Todos los días 06:00-23:00' }, status: 'active', cities: { slug: 'medellin' } },
    ]

    const result = transformBranches(input)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: 'Lun-Dom 24 horas | Festivos 06:00-21:00',
    })
    expect(result[1].city).toBe('medellin')
  })

  it('falls back to legacy city text when cities join is null (safety net for unmigrated rows)', () => {
    const input = [
      { id: 'uuid-c', code: 'ACBOT', name: 'Bogotá Caracas', city: 'bogota', slug: 'bogota-av-caracas', schedule: null, status: 'active', cities: null },
    ]

    const result = transformBranches(input)
    expect(result[0].city).toBe('bogota')
  })

  it('handles missing schedule gracefully', () => {
    const input = [
      { id: 'uuid-c', code: 'ACBOT', name: 'Bogotá Caracas', city: 'bogota', slug: 'bogota-av-caracas', schedule: null, status: 'active', cities: { slug: 'bogota' } },
    ]

    const result = transformBranches(input)
    expect(result[0].schedule).toBe('')
  })
})

describe('transformExtras', () => {
  it('maps rental company extras pricing', () => {
    const result = transformExtras({
      extra_driver_day_price: 12000,
      baby_seat_day_price: 12000,
      wash_price: 20000,
      wash_onsite_price: 30000,
      wash_deep_price: 150000,
      wash_deep_upholstery_price: 225000,
    })

    expect(result).toEqual({
      extraDriverDayPrice: 12000,
      babySeatDayPrice: 12000,
      washPrice: 20000,
      washOnsitePrice: 30000,
      washDeepPrice: 150000,
      washDeepUpholsteryPrice: 225000,
    })
  })

  it('coerces numeric strings from Supabase numeric columns to numbers', () => {
    const result = transformExtras({
      extra_driver_day_price: '12000' as unknown as number,
      baby_seat_day_price: '12000' as unknown as number,
      wash_price: '20000' as unknown as number,
      wash_onsite_price: '30000' as unknown as number,
      wash_deep_price: '150000' as unknown as number,
      wash_deep_upholstery_price: '225000' as unknown as number,
    })

    expect(result.washOnsitePrice).toBe(30000)
    expect(result.washDeepPrice).toBe(150000)
    expect(result.washDeepUpholsteryPrice).toBe(225000)
  })

  // SCEN-007: NULL pass-through prevents silent $0 quoting
  // (issue #4): Number(null) === 0 used to coerce missing data into a
  // legitimate-looking $0 price, bypassing the ?? 12000 fallback in
  // useCategory. Transformer must propagate null so the fallback fires.
  it('propagates null values without coercing them to 0', () => {
    const result = transformExtras({
      extra_driver_day_price: null,
      baby_seat_day_price: null,
      wash_price: 20000,
      wash_onsite_price: null,
      wash_deep_price: null,
      wash_deep_upholstery_price: null,
    })

    expect(result.extraDriverDayPrice).toBeNull()
    expect(result.babySeatDayPrice).toBeNull()
    expect(result.washPrice).toBe(20000)
    expect(result.washOnsitePrice).toBeNull()
    expect(result.washDeepPrice).toBeNull()
    expect(result.washDeepUpholsteryPrice).toBeNull()
  })
})

describe('transformCities', () => {
  // SCEN-005: happy path — Supabase rows con shape válida → City[] correcto
  it('maps valid Supabase city row to City interface (SCEN-005)', () => {
    const input = [{
      slug: 'bogota',
      name: 'Bogotá',
      description: 'capital de Colombia',
      testimonials: [
        {
          user: { name: 'Ana', description: 'Colombia', avatar: { src: 'a.webp', alt: 'Ana' } },
          quote: 'Excelente servicio',
        },
      ],
    }]

    const result = transformCities(input)

    expect(result).toHaveLength(1)
    const city = result[0]
    expect(city.id).toBe('bogota')
    expect(city.name).toBe('Bogotá')
    expect(city.description).toBe('capital de Colombia')
    expect(city.testimonials).toHaveLength(1)
    expect(city.testimonials[0].quote).toBe('Excelente servicio')
    expect(city.testimonials[0].user.name).toBe('Ana')
    // Regression guard contra dead code re-introducido
    expect('link' in city).toBe(false)
  })

  // SCEN-006: testimonios mal-formados se filtran silenciosamente
  it('filters malformed testimonials silently without throwing (SCEN-006)', () => {
    const input = [{
      slug: 'cali',
      name: 'Cali',
      description: 'capital salsera',
      testimonials: [
        { user: { name: 'X' } }, // falta avatar+description+quote
        {
          user: { name: 'OK', description: 'C', avatar: { src: 'a', alt: 'b' } },
          quote: 'valid',
        },
        null,
        'string-no-objeto',
        { quote: 'sin user' },
      ],
    }]

    expect(() => transformCities(input)).not.toThrow()
    const result = transformCities(input)
    expect(result[0].testimonials).toHaveLength(1)
    expect(result[0].testimonials[0].quote).toBe('valid')
  })

  // SCEN-007: description null → ''
  it('normalizes null description to empty string (SCEN-007)', () => {
    const input = [{
      slug: 'armenia',
      name: 'Armenia',
      description: null,
      testimonials: [],
    }]

    const result = transformCities(input)

    expect(result[0].description).toBe('')
    expect(result[0].description).not.toBeNull()
    expect(result[0].description).not.toBeUndefined()
  })

  // SCEN-008: testimonials no-array → [] sin throw
  it('handles non-array testimonials by returning empty array (SCEN-008)', () => {
    const input = [{
      slug: 'medellin',
      name: 'Medellín',
      description: 'eterna primavera',
      testimonials: { not: 'an array' } as unknown,
    }]

    expect(() => transformCities(input)).not.toThrow()
    const result = transformCities(input)
    expect(result[0].testimonials).toEqual([])
  })
})
