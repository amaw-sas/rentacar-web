import { computed } from 'vue'

import { createCurrentDateObject, pickPriceForDate } from '../utils'
import type CategoryData from '../utils/types/data/CategoryData'

export interface HomeSEOContent {
  title: string
  description: string
  dailyFloor?: number
}

const formatCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount)

/**
 * Builds the home metadata price claim from the same dated category-pricing
 * rows used by the reservation flow. Only a positive, active row whose range
 * contains `onDate` can contribute; expired/future-only data fails closed and
 * leaves the numeric claim out instead of publishing a stale fallback.
 */
export function buildHomeSEO(categories: CategoryData[], onDate: string): HomeSEOContent {
  const applicablePrices = categories.flatMap((category) => {
    const row = pickPriceForDate(category.month_prices, onDate)
    const isApplicable = row
      && row.status === 'active'
      && row.one_day_price > 0
      && row.init_date <= onDate
      && (!row.end_date || onDate <= row.end_date)

    return isApplicable ? [row.one_day_price] : []
  })

  const dailyFloor = applicablePrices.length > 0
    ? Math.min(...applicablePrices)
    : undefined
  const priceClaim = dailyFloor === undefined
    ? ''
    : ` desde $${formatCOP(dailyFloor)} COP/día`

  return {
    title: `Alquiler de Carros en Colombia${priceClaim}`,
    description: `Alquila carros${priceClaim} en Bogotá, Medellín, Cali y 16 ciudades más. Reserva sin pago previo y ahorra hasta 60% por anticipación.`,
    dailyFloor,
  }
}

export const useHomeSEO = () => {
  // Capture the Colombia calendar date once per setup so every metadata field
  // in this render uses the same tariff applicability date.
  const onDate = createCurrentDateObject().toString()
  const content = computed(() => buildHomeSEO(useFetchRentacarData().categories, onDate))

  return {
    title: computed(() => content.value.title),
    description: computed(() => content.value.description),
  }
}
