import type CategoryData from '../../src/utils/types/data/CategoryData'
import type CategoryModelData from '../../src/utils/types/data/CategoryModelData'
import type CategoryMonthPriceData from '../../src/utils/types/data/CategoryMonthPriceData'
import type BranchData from '../../src/utils/types/data/BranchData'

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
}

export function transformCategories(rows: SupabaseCategory[]): CategoryData[] {
  return rows.map((row) => {
    const models: CategoryModelData[] = (row.category_models || []).map((m) => ({
      name: m.name,
      image: m.image_url || '',
      description: m.description || 'o similar',
      default: m.is_default,
    }))

    const activePricing = (row.category_pricing || []).filter((p) => p.status === 'active')

    const monthPrices: CategoryMonthPriceData[] = activePricing.map((p) => ({
      '1k_kms': p.monthly_1k_price ?? 0,
      '2k_kms': p.monthly_2k_price ?? 0,
      '3k_kms': p.monthly_3k_price ?? 0,
      init_date: p.valid_from,
      end_date: p.valid_until || '',
      total_insurance_price: p.monthly_insurance_price ?? 0,
      one_day_price: p.monthly_one_day_price ?? 0,
    }))

    const coverageCharge = activePricing.length > 0
      ? Number(activePricing[0].total_coverage_unit_charge)
      : 0

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
    city: row.city || '',
    slug: row.slug || '',
    schedule: row.schedule?.display || '',
  }))
}

export interface ExtrasData {
  extraDriverDayPrice: number
  babySeatDayPrice: number
  washPrice: number
}

export function transformExtras(rentalCompany: {
  extra_driver_day_price: number
  baby_seat_day_price: number
  wash_price: number
}): ExtrasData {
  return {
    extraDriverDayPrice: Number(rentalCompany.extra_driver_day_price),
    babySeatDayPrice: Number(rentalCompany.baby_seat_day_price),
    washPrice: Number(rentalCompany.wash_price),
  }
}
