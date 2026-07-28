/**
 * ADVERSARIAL (R-WEB): does the new `v-if="hasDiscount()"` gate on the struck
 * base price also swallow the LEGITIMATE monthly struck price?
 *
 * In the monthly flow getDailyBasePrice returns month_prices.one_day_price —
 * a genuinely different figure from the price printed below it
 * (monthPriceMileage / 30). The commit rationale ("getDailyBasePrice falls back
 * to vehicleDayCharge + coverageUnitCharge whenever hasDiscount() is false,
 * which is the exact figure the card already prints right below it") does not
 * hold on that branch.
 *
 * Harness copied from useCategory.pricingHorizon.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CategoryAvailabilityData, CategoryMonthPriceData } from '@rentacar-main/logic/utils'

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
    fechaRecogida: ref('2026-08-01'),
  }
  return { default: () => h.store }
})

vi.stubGlobal('useFetchRentacarData', () => ({ extras: null }))

const { default: useCategory } = await import('../useCategory')

function monthRow(): CategoryMonthPriceData {
  return {
    '1k_kms': 3_000_000,
    '2k_kms': 3_500_000,
    '3k_kms': 4_000_000,
    init_date: '2026-07-01',
    end_date: '2026-12-31',
    total_insurance_price: 400_000,
    one_day_price: 120_000,
    status: 'active',
  }
}

/** Monthly availability as it really arrives: daily charges are zeroed out. */
function monthlyCategoryData(): CategoryAvailabilityData {
  return {
    vehicleDayCharge: 0,
    estimatedTotalAmount: 0,
    totalCoverageUnitCharge: 0,
    totalAmount: 0,
    extraHoursQuantity: 0,
    extraHoursTotalAmount: 0,
    coverageTotalAmount: 0,
    coverageQuantity: 0,
    coverageUnitCharge: 0,
    IVAFeeAmount: 0,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    discountAmount: 0,
    discountPercentage: 0,
    returnFeeAmount: 0,
    numberDays: 30,
    categoryCode: 'C' as CategoryAvailabilityData['categoryCode'],
    picoyplacaExempt: null,
    categoryDescription: 'Test',
    categoryModels: [],
    categoryMonthPrices: [monthRow()],
    referenceToken: 'tok',
    rateQualifier: 'rq',
  } as CategoryAvailabilityData
}

describe('monthly struck base price vs the hasDiscount() gate', () => {
  beforeEach(() => {
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2026-08-01'
  })

  it('monthly: struck price is one_day_price and DIFFERS from the price below it', () => {
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.isMonthlyPriceUnavailable.value).toBe(false)
    expect(cat.getDailyBasePrice.value).toBe(120_000) // one_day_price
    expect(cat.getDailyPrice.value).toBe(100_000) // 3.000.000 / 30
    expect(cat.getDailyBasePrice.value).not.toBe(cat.getDailyPrice.value)
  })

  it('monthly: hasDiscount() is false, so the new gate hides that legitimate anchor', () => {
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.hasDiscount()).toBe(false)
  })

  it('monthly WITH total coverage: same story', () => {
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = true
    cat.withMileage.value = '1k_kms'

    // (3.000.000 + 400.000) / 30
    expect(cat.getDailyPrice.value).toBeCloseTo(113_333.33, 1)
    expect(cat.getDailyBasePrice.value).toBe(120_000)
    expect(cat.hasDiscount()).toBe(false)
  })

  it('monthly with NON-zero daily charges: still hidden whenever discountAmount is 0', () => {
    // Robustness against payload shape: even if a monthly quote carries the
    // daily charges (as useStoreSearchData.monthlyCategoryExclusion fixtures
    // do), hasDiscount() is false the moment discountAmount is 0 — a daily
    // field the monthly price does not use at all.
    const cat = useCategory({
      ...monthlyCategoryData(),
      vehicleDayCharge: 50_000,
      coverageUnitCharge: 20_000,
      discountAmount: 0,
    } as CategoryAvailabilityData)
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.getDailyBasePrice.value).toBe(120_000) // one_day_price
    expect(cat.getDailyPrice.value).toBe(100_000)
    expect(cat.hasDiscount()).toBe(false)
  })

  it('daily control: with a real discount the gate keeps the struck price', () => {
    h.store!.haveMonthlyReservation.value = false
    const daily = {
      ...monthlyCategoryData(),
      vehicleDayCharge: 100_000,
      coverageUnitCharge: 20_000,
      discountAmount: 50_000,
      numberDays: 3,
      categoryMonthPrices: [],
    } as CategoryAvailabilityData
    const cat = useCategory(daily)
    cat.withTotalCoverage.value = false

    expect(cat.hasDiscount()).toBe(true)
    expect(cat.getDailyBasePrice.value).toBe(170_000)
    expect(cat.getDailyPrice.value).toBe(120_000)
  })

  it('daily + Seguro Total: the gate is SOUND — refused, never struck below the real price', () => {
    // Counter-example attempted and REFUTED: with Seguro Total the real price
    // rises to day + totalCoverage and hasDiscount() compares against exactly
    // that, so it refuses. In the DAILY flow hasDiscount() true always implies
    // struck > real. The gate is unsound only on the MONTHLY branch, where
    // getDailyBasePrice comes from one_day_price, which hasDiscount() ignores.
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory({
      ...monthlyCategoryData(),
      vehicleDayCharge: 100_000,
      coverageUnitCharge: 20_000,
      totalCoverageUnitCharge: 90_000,
      discountAmount: 30_000,
      numberDays: 3,
      categoryMonthPrices: [],
    } as CategoryAvailabilityData)
    cat.withTotalCoverage.value = true

    expect(cat.hasDiscount()).toBe(false)
    expect(cat.getDailyBasePrice.value).toBe(120_000) // no discount branch
    expect(cat.getDailyPrice.value).toBe(190_000) // 100k + 90k total coverage
    expect(cat.getDailyBasePrice.value).toBeLessThan(cat.getDailyPrice.value)
  })

  it('daily control: with discountAmount 0 the struck price WAS the phantom (equal figures)', () => {
    h.store!.haveMonthlyReservation.value = false
    const daily = {
      ...monthlyCategoryData(),
      vehicleDayCharge: 100_000,
      coverageUnitCharge: 20_000,
      discountAmount: 0,
      numberDays: 3,
      categoryMonthPrices: [],
    } as CategoryAvailabilityData
    const cat = useCategory(daily)
    cat.withTotalCoverage.value = false

    expect(cat.hasDiscount()).toBe(false)
    expect(cat.getDailyBasePrice.value).toBe(cat.getDailyPrice.value)
  })
})
