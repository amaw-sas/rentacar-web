import * as v from 'valibot'
import type CategoryData from '../../src/utils/types/data/CategoryData'
import type CategoryModelData from '../../src/utils/types/data/CategoryModelData'
import type CategoryMonthPriceData from '../../src/utils/types/data/CategoryMonthPriceData'
import type BranchData from '../../src/utils/types/data/BranchData'
import type VehicleCategoryData from '../../src/utils/types/data/VehicleCategoryData'
import type ExtrasData from '../../src/utils/types/data/ExtrasData'
import type City from '../../src/utils/types/type/City'
import type Testimonial from '../../src/utils/types/type/Testimonial'

export type { ExtrasData };

interface SupabaseCategory {
  id: string
  code: string
  name: string
  description: string
  image_url: string
  passenger_count: number
  luggage_count: number
  has_ac: boolean
  transmission: string
  status: string
  visibility_mode: string
  group_label: string
  short_description: string
  long_description: string
  tags: string[]
  extra_km_charge: number | string
  category_models: SupabaseCategoryModel[]
  category_pricing: SupabaseCategoryPricing[]
}

interface SupabaseCategoryModel {
  name: string
  description: string
  image_url: string
  is_default: boolean
}

interface SupabaseCategoryPricing {
  total_coverage_unit_charge: number
  monthly_1k_price: number | null
  monthly_2k_price: number | null
  monthly_3k_price: number | null
  monthly_insurance_price: number | null
  monthly_one_day_price: number | null
  valid_from: string
  valid_until: string | null
  status: string
}

interface SupabaseLocation {
  id: string
  code: string
  name: string
  city: string
  slug: string
  schedule: { display?: string } | null
  status: string
  cities: { slug: string } | null
}

export function transformCategories(rows: SupabaseCategory[]): CategoryData[] {
  return rows.map((row) => {
    const models: CategoryModelData[] = (row.category_models || []).map((m) => ({
      name: m.name,
      image: m.image_url || '',
      description: m.description || 'o similar',
      default: m.is_default,
    }))

    const allPricing = row.category_pricing || []
    const activePricing = allPricing.filter((p) => p.status === 'active')

    // Pass through both active and inactive rows so the client can use
    // inactive (legacy) rows as fallback when pickup date is outside any
    // active validity range. Selection logic lives in pickPriceForDate.
    const monthPrices: CategoryMonthPriceData[] = allPricing.map((p) => ({
      '1k_kms': p.monthly_1k_price ?? 0,
      '2k_kms': p.monthly_2k_price ?? 0,
      '3k_kms': p.monthly_3k_price ?? 0,
      init_date: p.valid_from,
      end_date: p.valid_until || '',
      total_insurance_price: p.monthly_insurance_price ?? 0,
      one_day_price: p.monthly_one_day_price ?? 0,
      status: p.status === 'inactive' ? 'inactive' : 'active',
    }))

    const coverageSource = activePricing[0] ?? allPricing[0]
    const coverageCharge = coverageSource ? Number(coverageSource.total_coverage_unit_charge) : 0

    return {
      id: row.code as CategoryData['id'],
      identification: row.code as CategoryData['identification'],
      name: `Gama ${row.code}`,
      category: row.name,
      description: row.description,
      image: row.image_url || '',
      ad: '',
      models,
      month_prices: monthPrices,
      total_coverage_unit_charge: coverageCharge,
      extra_km_charge: Number(row.extra_km_charge ?? 0),
    }
  })
}

export function transformBranches(rows: SupabaseLocation[]): BranchData[] {
  return rows.map((row, index) => ({
    id: index + 1,
    code: row.code,
    name: row.name,
    // Prefer canonical cities.slug over legacy locations.city text field —
    // cities.slug is unique and normalized, locations.city is free text and
    // often drifted (e.g. "Bogotá" vs "bogota"). Fallback kept for safety.
    city: row.cities?.slug ?? row.city ?? '',
    slug: row.slug || '',
    schedule: row.schedule?.display || '',
  }))
}

export function transformExtras(rentalCompany: {
  extra_driver_day_price: number | null
  baby_seat_day_price: number | null
  wash_price: number | null
  wash_onsite_price: number | null
  wash_deep_price: number | null
  wash_deep_upholstery_price: number | null
}): ExtrasData {
  const num = (v: number | null) => (v == null ? null : Number(v))
  return {
    extraDriverDayPrice: num(rentalCompany.extra_driver_day_price),
    babySeatDayPrice: num(rentalCompany.baby_seat_day_price),
    washPrice: num(rentalCompany.wash_price),
    washOnsitePrice: num(rentalCompany.wash_onsite_price),
    washDeepPrice: num(rentalCompany.wash_deep_price),
    washDeepUpholsteryPrice: num(rentalCompany.wash_deep_upholstery_price),
  }
}

interface SupabaseCity {
  slug: string
  name: string
  description: string | null
  testimonials: unknown
}

// Valibot schema para validar shape de testimonios JSONB. Postgres garantiza
// JSON válido, no shape — esto filtra entries malformados al boundary de
// aplicación (issue #6 design decision).
// Length caps protect against oversized JSONB stuffing that would balloon
// the cached SSR payload. Caps chosen with ~5x headroom over current data
// (longest quote in snapshot ~250 chars, longest name ~25). Array slice
// hard-caps testimonios per city; UI shows up to 6 in current layout.
const testimonialSchema = v.object({
  user: v.object({
    name: v.pipe(v.string(), v.maxLength(120)),
    description: v.pipe(v.string(), v.maxLength(60)),
    avatar: v.object({
      src: v.pipe(v.string(), v.maxLength(300)),
      alt: v.pipe(v.string(), v.maxLength(200)),
    }),
  }),
  quote: v.pipe(v.string(), v.maxLength(1000)),
})

function parseTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, 12)
    .filter((t): t is Testimonial => v.safeParse(testimonialSchema, t).success)
}

export function transformCities(rows: SupabaseCity[]): City[] {
  return rows.map((row) => ({
    id: row.slug,                               // app id == DB slug
    name: row.name,
    description: row.description ?? '',
    testimonials: parseTestimonials(row.testimonials),
  }))
}

export function transformVehicleCategories(rows: SupabaseCategory[]): VehicleCategoryData {
  const result: VehicleCategoryData = {}
  for (const row of rows) {
    result[row.code] = {
      grupo: row.group_label || '',
      descripcion_corta: row.short_description || '',
      descripcion_larga: row.long_description || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      modelos: (row.category_models || []).map((m) => ({
        nombre: m.name,
        image: m.image_url || '',
      })),
    }
  }
  return result
}
