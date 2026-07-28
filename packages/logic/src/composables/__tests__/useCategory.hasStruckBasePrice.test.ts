/**
 * SCEN-W1 at the behaviour level: hasStruckBasePrice must be true exactly when
 * there is a base price genuinely above the price printed below it.
 *
 * The adversarial file next door (useCategory.monthlyStruckPrice.adversarial)
 * characterises WHY hasDiscount() is the wrong predicate; it never exercises
 * the replacement. This file does, across both branches of getDailyBasePrice
 * (monthly one_day_price anchor, daily discount) plus the phantom case the gate
 * exists to kill and the price-anchor pilot's collapse-to-zero.
 *
 * Harness copied from useCategory.monthlyStruckPrice.adversarial.test.ts.
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

function dailyCategoryData(over: Partial<CategoryAvailabilityData> = {}): CategoryAvailabilityData {
  return {
    ...monthlyCategoryData(),
    categoryMonthPrices: [],
    numberDays: 3,
    ...over,
  } as CategoryAvailabilityData
}

describe('hasStruckBasePrice — shows the struck price only when there is one', () => {
  beforeEach(() => {
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2026-08-01'
  })

  it('monthly: TRUE — the one_day_price anchor sits above the real daily price', () => {
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.getDailyBasePrice.value).toBe(120_000)
    expect(cat.getDailyPrice.value).toBe(100_000)
    expect(cat.hasStruckBasePrice.value).toBe(true)
    // The predicate the reviewer refuted would have hidden this one.
    expect(cat.hasDiscount()).toBe(false)
  })

  it('monthly with Seguro Total: TRUE — anchor still above the richer price', () => {
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = true
    cat.withMileage.value = '1k_kms'

    expect(cat.getDailyPrice.value).toBeCloseTo(113_333.33, 1)
    expect(cat.hasStruckBasePrice.value).toBe(true)
  })

  it('monthly beyond the pricing horizon (issue #313): FALSE — both figures are 0', () => {
    h.store!.fechaRecogida.value = '2027-06-01'
    const cat = useCategory(monthlyCategoryData())
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.isMonthlyPriceUnavailable.value).toBe(true)
    expect(cat.getDailyBasePrice.value).toBe(0)
    expect(cat.getDailyPrice.value).toBe(0)
    // 0 > 0 is false, so the fail-closed column never gets a struck "$ 0".
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })

  it('daily with a real discount: TRUE', () => {
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory(
      dailyCategoryData({ vehicleDayCharge: 100_000, coverageUnitCharge: 20_000, discountAmount: 50_000 }),
    )
    cat.withTotalCoverage.value = false

    expect(cat.getDailyBasePrice.value).toBe(170_000)
    expect(cat.getDailyPrice.value).toBe(120_000)
    expect(cat.hasStruckBasePrice.value).toBe(true)
  })

  it('daily phantom (discountAmount 0): FALSE — the two figures are identical', () => {
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory(
      dailyCategoryData({ vehicleDayCharge: 100_000, coverageUnitCharge: 20_000, discountAmount: 0 }),
    )
    cat.withTotalCoverage.value = false

    expect(cat.getDailyBasePrice.value).toBe(cat.getDailyPrice.value)
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })

  it('daily + Seguro Total with a small discount: FALSE — base sits BELOW the real price', () => {
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory(
      dailyCategoryData({
        vehicleDayCharge: 100_000,
        coverageUnitCharge: 20_000,
        totalCoverageUnitCharge: 90_000,
        discountAmount: 30_000,
      }),
    )
    cat.withTotalCoverage.value = true

    expect(cat.getDailyBasePrice.value).toBe(120_000)
    expect(cat.getDailyPrice.value).toBe(190_000)
    // Striking 120k above 190k would be absurd; the comparison refuses it.
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })

  it('price-anchor pilot: a discount capped down to the coverage collapses the strike', () => {
    // SCEN-A2 seen from the web: the dashboard caps discountAmount so that
    // day + discount + coverage lands on the anchor. Capped to exactly the
    // coverage, the base collapses onto the real price and the card must show
    // neither strike nor pill.
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory(
      dailyCategoryData({ vehicleDayCharge: 100_000, coverageUnitCharge: 20_000, discountAmount: 20_000 }),
    )
    cat.withTotalCoverage.value = false

    expect(cat.hasDiscount()).toBe(false)
    expect(cat.getDailyBasePrice.value).toBe(cat.getDailyPrice.value)
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })
})
