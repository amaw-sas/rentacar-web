import { computed } from 'vue'
import { normalizeReservationCode, type ReservationSummary } from '@rentacar-main/logic/utils'
import type { MonthlyMileage } from '@rentacar-main/logic/utils'

// Issue #368 hallazgo 1, Paso 2 — la confirmación lee el snapshot congelado en el
// submit (lastReservationSummary) y decide si pintar el recap. Sin estado vivo:
// el snapshot es la única fuente (el endpoint solo devuelve { exists }).

export interface ReservationRecapView {
  categoryName: string
  total: string
  pickupDate: string | null
  pickupTime: string | null
  returnDate: string | null
  returnTime: string | null
  pickupBranch: string | null
  pickupCity: string | null
  returnBranch: string | null
  returnCity: string | null
  days: number | null
  /** 'Seguro Total' | 'Seguro Básico' */
  insuranceLabel: string
  /** Solo en reserva mensual; null si no aplica. Mismo texto que StepCoverage. */
  mileageLabel: string | null
}

// Espejo de MILEAGE_LABELS en StepCoverage.vue — el recap debe decir lo mismo.
const MILEAGE_LABELS: Record<MonthlyMileage, string> = {
  '1k_kms': '1.000 km',
  '2k_kms': '2.000 km',
  '3k_kms': '3.000 km',
}

/**
 * Núcleo puro. Gate de tres partes: el snapshot existe, su código coincide con
 * el de la URL, y nombre + total están completos (si no, ocultar en vez de
 * pintar `undefined`). Devuelve la vista ya mapeada para el template.
 */
export function deriveReservationRecap(
  summary: ReservationSummary | null | undefined,
  routeCode: unknown,
): { show: boolean; recap: ReservationRecapView | null } {
  const code = normalizeReservationCode(routeCode)
  if (!summary || !code || summary.code !== code || !summary.categoryName || !summary.total) {
    return { show: false, recap: null }
  }
  return {
    show: true,
    recap: {
      categoryName: summary.categoryName,
      total: summary.total,
      pickupDate: summary.pickupDate,
      pickupTime: summary.pickupTime,
      returnDate: summary.returnDate,
      returnTime: summary.returnTime,
      pickupBranch: summary.pickupBranch,
      pickupCity: summary.pickupCity,
      returnBranch: summary.returnBranch,
      returnCity: summary.returnCity,
      days: summary.days,
      insuranceLabel: summary.haveTotalInsurance ? 'Seguro Total' : 'Seguro Básico',
      mileageLabel:
        summary.haveMonthlyReservation && summary.monthlyMileage
          ? MILEAGE_LABELS[summary.monthlyMileage]
          : null,
    },
  }
}

/**
 * Wrapper de sesión: lee `lastReservationSummary` del store del formulario y el
 * `reserveCode` de la ruta. Reactivo — se recomputa si el snapshot cambia.
 */
export function useReservationRecap() {
  const store = useStoreReservationForm()
  const { lastReservationSummary } = storeToRefs(store)
  const route = useRoute()

  const derived = computed(() =>
    deriveReservationRecap(lastReservationSummary.value, route.params.reserveCode),
  )

  return {
    show: computed(() => derived.value.show),
    recap: computed(() => derived.value.recap),
  }
}
