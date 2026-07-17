/**
 * Issue #313 SCEN-4 — fail-closed en useCategory más allá del horizonte.
 *
 * Cuando la reserva es mensual y el pickup cae más allá de TODO el dato de
 * pricing, `getCategoryMonthPrice()` devuelve undefined (regla 0 de
 * pickPriceForDate). Antes de este fix las ramas mensuales caían en silencio a
 * matemática ajena al mensual — un precio fabricado con el que se cobraba:
 *   - getDailyPrice → matemática diaria (ambas coberturas), NONZERO
 *   - getTotalPrice con Seguro Total → getSubtotal, NONZERO
 * El fix devuelve 0 explícito y expone `isMonthlyPriceUnavailable` para que la
 * UI bloquee por flag, no por precio.
 *
 * Harness runtime aislado: se mockea el store (subgrafo Nuxt pesado) y
 * storeToRefs a identidad; se stubbea el global useFetchRentacarData. Así se
 * OBSERVA el valor de retorno, no solo la forma del código.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { CategoryAvailabilityData, CategoryMonthPriceData } from '@rentacar-main/logic/utils'

// Contenedor hoisted para poder mutar el store singleton entre casos.
const h = vi.hoisted(() => ({
  store: null as null | {
    haveMonthlyReservation: { value: boolean }
    fechaRecogida: { value: string | null }
  },
}))

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return { ...actual, storeToRefs: (s: unknown) => s }
})

vi.mock('../../stores/useStoreReservationForm', async () => {
  const { ref } = await import('vue')
  h.store = {
    haveMonthlyReservation: ref(true),
    fechaRecogida: ref('2027-01-01'),
  }
  return { default: () => h.store }
})

vi.stubGlobal('useFetchRentacarData', () => ({ extras: null }))

// Import AFTER mocks are registered.
const { default: useCategory } = await import('../useCategory')

function monthRow(
  init_date: string,
  end_date: string,
  oneK = 3_000_000,
): CategoryMonthPriceData {
  return {
    '1k_kms': oneK,
    '2k_kms': oneK + 500_000,
    '3k_kms': oneK + 1_000_000,
    init_date,
    end_date,
    total_insurance_price: 400_000,
    one_day_price: 120_000,
    status: 'active',
  }
}

// Datos con matemática diaria NONZERO: si el guard fail-closed no interceptara,
// getDailyPrice/getTotalPrice devolverían estos números fabricados, no 0.
function categoryData(
  monthPrices: CategoryMonthPriceData[],
): CategoryAvailabilityData {
  return {
    vehicleDayCharge: 100_000,
    estimatedTotalAmount: 800_000,
    totalCoverageUnitCharge: 30_000,
    totalAmount: 700_000,
    extraHoursQuantity: 0,
    extraHoursTotalAmount: 0,
    coverageTotalAmount: 140_000,
    coverageQuantity: 7,
    coverageUnitCharge: 20_000,
    IVAFeeAmount: 0,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    discountAmount: 0,
    discountPercentage: 0,
    returnFeeAmount: 0,
    numberDays: 7,
    categoryCode: 'C' as CategoryAvailabilityData['categoryCode'],
    picoyplacaExempt: null,
    categoryDescription: 'Test',
    categoryModels: [],
    categoryMonthPrices: monthPrices,
    referenceToken: 'tok',
    rateQualifier: 'rq',
  } as CategoryAvailabilityData
}

describe('useCategory SCEN-4 — fail-closed mensual más allá del horizonte', () => {
  beforeEach(() => {
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2027-01-01' // más allá de max end 2026-12-31
  })

  // filas acotadas, max end_date = 2026-12-31 → pickup 2027-01-01 excede el horizonte
  const boundedRows = [
    monthRow('2026-01-01', '2026-06-30'),
    monthRow('2026-07-01', '2026-12-31'),
  ]

  it('isMonthlyPriceUnavailable = true cuando no hay fila para el pickup', () => {
    const cat = useCategory(categoryData(boundedRows))
    cat.withMileage.value = '1k_kms'
    expect(cat.isMonthlyPriceUnavailable.value).toBe(true)
  })

  it('SIN Seguro Total: getDailyPrice y getTotalPrice devuelven 0 (no matemática diaria)', () => {
    const cat = useCategory(categoryData(boundedRows))
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'
    expect(cat.getDailyPrice.value).toBe(0)
    expect(cat.getTotalPrice.value).toBe(0)
    expect(cat.getDailyBasePrice.value).toBe(0)
    expect(cat.getActualTotalPrice.value).toBe(0)
  })

  it('CON Seguro Total: getDailyPrice y getTotalPrice devuelven 0 (no getSubtotal)', () => {
    const cat = useCategory(categoryData(boundedRows))
    cat.withTotalCoverage.value = true
    cat.withMileage.value = '1k_kms'
    expect(cat.getDailyPrice.value).toBe(0)
    expect(cat.getTotalPrice.value).toBe(0)
    expect(cat.getDailyBasePrice.value).toBe(0)
    expect(cat.getActualTotalPrice.value).toBe(0)
  })

  it('control positivo: DENTRO del horizonte cotiza normal y el flag es false', () => {
    h.store!.fechaRecogida.value = '2026-08-01' // cubierto por la fila jul-dic
    const cat = useCategory(categoryData(boundedRows))
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'
    expect(cat.isMonthlyPriceUnavailable.value).toBe(false)
    // monthPriceMileage (1k_kms = 3.000.000) + returnFee (0)
    expect(cat.getTotalPrice.value).toBe(3_000_000)
  })
})
