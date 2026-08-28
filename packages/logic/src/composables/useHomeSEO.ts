import { computed } from 'vue'

import { createCurrentDateObject, pickPriceForDate } from '../utils'
import type CategoryData from '../utils/types/data/CategoryData'
import type ReservasApiData from '../utils/types/data/ReservasApiData'

export interface HomeSEOContent {
  title: string
  description: string
  dailyFloor?: number
}

const formatCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount)

/**
 * Rounds a floor UP to the nearest thousand.
 *
 * The direction is the whole point and must never be flipped to `round`. A
 * "desde" that lands below what anyone actually pays is the same lie as one
 * that lands above it, only cheaper-sounding; rounding up can only ever make
 * the claim easier to honour. 157.696 is published as 158.000.
 */
const roundUpToThousand = (amount: number): number => Math.ceil(amount / 1000) * 1000

/**
 * Builds the home metadata price claim.
 *
 * `dayFloorGross` is the real p05 day price with taxes (`price_floors`,
 * migration 142). Its three states are all distinct and all deliberate:
 *
 * - `undefined` — this brand never opted into the real floor. Falls back to the
 *   cheapest applicable `monthly_one_day_price`, which is the LIST rate before
 *   the discount and sat near the p90 of what customers really pay while being
 *   published as a "desde". Kept ONLY so alquilatucarro and alquicarros keep
 *   their current output; it is not a good number.
 * - `null` (or any unusable value) — the brand DID opt in and there is nothing
 *   publishable. Publishes NO number. It must not fall through to the list
 *   rate: a stale floor pipeline silently reprinting the $220.000 is precisely
 *   the failure this replaced.
 * - a positive number — published, rounded up to the thousand.
 *
 * Every path fails closed: no usable figure leaves the numeric claim out
 * entirely rather than publishing a stale or fabricated one.
 */
export function buildHomeSEO(
  categories: CategoryData[],
  onDate: string,
  dayFloorGross?: number | null,
): HomeSEOContent {
  const applicablePrices = categories.flatMap((category) => {
    const row = pickPriceForDate(category.month_prices, onDate)
    const isApplicable = row
      && row.status === 'active'
      && row.one_day_price > 0
      && row.init_date <= onDate
      && (!row.end_date || onDate <= row.end_date)

    return isApplicable ? [row.one_day_price] : []
  })

  // `undefined` is the ONLY value that reaches the legacy list-rate claim.
  const optedIntoRealFloor = dayFloorGross !== undefined
  const hasRealFloor = typeof dayFloorGross === 'number'
    && Number.isFinite(dayFloorGross)
    && dayFloorGross > 0

  const dailyFloor = hasRealFloor
    ? roundUpToThousand(dayFloorGross as number)
    : optedIntoRealFloor
      ? undefined
      : applicablePrices.length > 0
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
  // Capture useState while the Nuxt instance is available. Head refs can be
  // unwrapped later during SSR rendering, outside component setup; invoking a
  // Nuxt composable from that computed getter would throw "instance unavailable".
  const data = useState<ReservasApiData | null>('rentacar-data')
  const content = computed(() =>
    buildHomeSEO(data.value?.categories ?? [], onDate, data.value?.dayPriceFloorGross),
  )

  return {
    title: computed(() => content.value.title),
    description: computed(() => content.value.description),
  }
}
