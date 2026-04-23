import type CategoryData from '../../src/utils/types/data/CategoryData'
import type CategoryModelData from '../../src/utils/types/data/CategoryModelData'
import type CategoryMonthPriceData from '../../src/utils/types/data/CategoryMonthPriceData'
import type BranchData from '../../src/utils/types/data/BranchData'
import type VehicleCategoryData from '../../src/utils/types/data/VehicleCategoryData'

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

export interface ExtrasData {
  extraDriverDayPrice: number
  babySeatDayPrice: number
  washPrice: number
  washOnsitePrice: number
  washDeepPrice: number
  washDeepUpholsteryPrice: number
}

export function transformExtras(rentalCompany: {
  extra_driver_day_price: number
  baby_seat_day_price: number
  wash_price: number
  wash_onsite_price: number
  wash_deep_price: number
  wash_deep_upholstery_price: number
}): ExtrasData {
  return {
    extraDriverDayPrice: Number(rentalCompany.extra_driver_day_price),
    babySeatDayPrice: Number(rentalCompany.baby_seat_day_price),
    washPrice: Number(rentalCompany.wash_price),
    washOnsitePrice: Number(rentalCompany.wash_onsite_price),
    washDeepPrice: Number(rentalCompany.wash_deep_price),
    washDeepUpholsteryPrice: Number(rentalCompany.wash_deep_upholstery_price),
  }
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
