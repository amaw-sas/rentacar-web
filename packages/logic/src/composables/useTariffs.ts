import type ReservasApiData from '../utils/types/data/ReservasApiData'
import type CategoryData from '../utils/types/data/CategoryData'
import type CategoryMonthPriceData from '../utils/types/data/CategoryMonthPriceData'

export interface TariffPlan {
  daily: number
  monthly: number
}

export interface TariffGama {
  code: string
  name: string
  image: string
  kmExtra: number | null
  plan1k: TariffPlan
  plan2k: TariffPlan
}

export interface TariffsView {
  period: { start: string; end: string; label: string } | null
  gamas: TariffGama[]
}

const MONTH_ABBR_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function parseIsoUtc(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`)
}

function todayIsoUtc(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function findActivePricingForDay(prices: CategoryMonthPriceData[], dayIso: string): CategoryMonthPriceData | null {
  const dayMs = parseIsoUtc(dayIso)
  if (Number.isNaN(dayMs)) return null

  const matches = prices.filter((p) => {
    if (p.status !== 'active') return false
    const initMs = parseIsoUtc(p.init_date)
    const endMs = p.end_date ? parseIsoUtc(p.end_date) : Number.POSITIVE_INFINITY
    return initMs <= dayMs && dayMs <= endMs
  })

  if (matches.length === 0) return null
  matches.sort((a, b) => b.init_date.localeCompare(a.init_date))
  return matches[0]
}

function formatPeriodLabel(start: string, end: string): string {
  const [, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  return `${sd} ${MONTH_ABBR_ES[sm - 1]} – ${ed} ${MONTH_ABBR_ES[em - 1]} ${ey}`
}

function stripGamaPrefix(fullName: string, code: string): string {
  const prefix = `Gama ${code} `
  return fullName.startsWith(prefix) ? fullName.slice(prefix.length) : fullName
}

// Photo for the gama: prefer the default model's image, then the category
// image, then the first model. Only Gama C carries cat.image in the DB; the
// rest only have it on their default model, so the model is the reliable source.
function pickGamaImage(cat: CategoryData): string {
  const def = cat.models?.find((m) => m.default)
  return def?.image || cat.image || cat.models?.[0]?.image || ''
}

export function buildTariffs(categories: CategoryData[], todayDate?: string): TariffsView {
  if (!categories || categories.length === 0) {
    return { period: null, gamas: [] }
  }

  const today = todayDate ?? todayIsoUtc()
  const sortedCategories = [...categories].sort((a, b) => String(a.id).localeCompare(String(b.id)))

  const gamas: TariffGama[] = []
  let firstActivePricing: CategoryMonthPriceData | null = null

  for (const cat of sortedCategories) {
    const pricing = findActivePricingForDay(cat.month_prices, today)
    if (!pricing) continue

    const monthly1k = pricing['1k_kms']
    const monthly2k = pricing['2k_kms']

    // Skip categories whose monthly pricing was cleared (no longer eligible
    // for monthly rentals). Both plans must be zero — partial-zero is kept
    // since the UI toggle still surfaces the available plan.
    if (monthly1k <= 0 && monthly2k <= 0) continue

    if (!firstActivePricing) firstActivePricing = pricing
    const code = String(cat.id)

    gamas.push({
      code,
      name: stripGamaPrefix(cat.category, code),
      image: pickGamaImage(cat),
      kmExtra: cat.extra_km_charge > 0 ? cat.extra_km_charge : null,
      plan1k: { daily: Math.round(monthly1k / 30), monthly: monthly1k },
      plan2k: { daily: Math.round(monthly2k / 30), monthly: monthly2k },
    })
  }

  if (gamas.length === 0 || !firstActivePricing) {
    return { period: null, gamas: [] }
  }

  return {
    period: {
      start: firstActivePricing.init_date,
      end: firstActivePricing.end_date,
      label: formatPeriodLabel(firstActivePricing.init_date, firstActivePricing.end_date),
    },
    gamas,
  }
}

export default function useTariffs(): TariffsView {
  const data = useState<ReservasApiData | null>('rentacar-data')
  if (!data.value || !data.value.categories) {
    return { period: null, gamas: [] }
  }
  return buildTariffs(data.value.categories)
}
