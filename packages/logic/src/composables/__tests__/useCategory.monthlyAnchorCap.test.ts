/**
 * Monthly struck price capped at the p95 market anchor (SCEN-M1..M6, M8).
 *
 * The rule the whole pilot rests on: the cap lives ONLY in the monthly branch
 * of getDailyBasePrice — the struck figure. getDailyPrice, the totals and the
 * checkout must come out bit for bit the same whether an anchor is present or
 * not, because the customer pays those.
 *
 * Harness calqued from useCategory.monthlyStruckPrice.adversarial.test.ts,
 * which characterised the bug this pilot builds on.
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

/** 1k = 3.000.000 → real 100.000/día. one_day_price typed at 120.000. */
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
function monthlyCategoryData(monthAnchorGross: number | null = null): CategoryAvailabilityData {
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
    categoryCode: 'GC' as CategoryAvailabilityData['categoryCode'],
    picoyplacaExempt: null,
    categoryDescription: 'Test',
    categoryModels: [],
    categoryMonthPrices: [monthRow()],
    monthAnchorGross,
    referenceToken: 'tok',
    rateQualifier: 'rq',
  } as CategoryAvailabilityData
}

const monthly = (anchor: number | null = null, mileage: '1k_kms' | '2k_kms' | '3k_kms' = '1k_kms') => {
  const cat = useCategory(monthlyCategoryData(anchor))
  cat.withTotalCoverage.value = false
  cat.withMileage.value = mileage
  return cat
}

describe('monthly struck price capped at the market anchor', () => {
  beforeEach(() => {
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2026-08-01'
  })

  it('SCEN-M1: no anchor → struck price is the untouched one_day_price', () => {
    const cat = monthly(null)
    expect(cat.getDailyBasePrice.value).toBe(120_000)
    expect(cat.getDailyPrice.value).toBe(100_000)
    expect(cat.hasStruckBasePrice.value).toBe(true)
  })

  it('SCEN-M2: an anchor below one_day_price cuts the struck price down to it', () => {
    const cat = monthly(110_000)
    expect(cat.getDailyBasePrice.value).toBe(110_000)
    expect(cat.hasStruckBasePrice.value).toBe(true)
  })

  it('SCEN-M2: the cut is display only — real price and totals are identical with and without the anchor', () => {
    const plain = monthly(null)
    const capped = monthly(110_000)

    expect(capped.getDailyPrice.value).toBe(plain.getDailyPrice.value)
    expect(capped.getTotalPrice.value).toBe(plain.getTotalPrice.value)
    expect(capped.getActualTotalPrice.value).toBe(plain.getActualTotalPrice.value)
    expect(capped.getSubtotal.value).toBe(plain.getSubtotal.value)
    // Only the struck figure moved.
    expect(capped.getDailyBasePrice.value).not.toBe(plain.getDailyBasePrice.value)
  })

  it('SCEN-M3: min() keeps an honest one_day_price when the anchor sits above it (the GY case)', () => {
    expect(monthly(130_000).getDailyBasePrice.value).toBe(120_000)
    expect(monthly(120_000).getDailyBasePrice.value).toBe(120_000)
  })

  it.each([
    ['null', null],
    ['zero', 0],
    ['negative', -50_000],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ] as const)('SCEN-M4: fails open on a %s anchor — struck price unchanged', (_label, anchor) => {
    expect(monthly(anchor as number | null).getDailyBasePrice.value).toBe(120_000)
  })

  it('SCEN-M4: an absent monthAnchorGross field (old payload) behaves as no anchor', () => {
    const { monthAnchorGross: _drop, ...withoutField } = monthlyCategoryData(null)
    const cat = useCategory(withoutField as CategoryAvailabilityData)
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'
    expect(cat.getDailyBasePrice.value).toBe(120_000)
  })

  it('SCEN-M6: when the cap drops the base to or below the real price, the strike disappears', () => {
    // 95.000 < 100.000 real → nothing left to strike; the card must not paint a
    // crossed-out price BELOW the price being charged.
    const below = monthly(95_000)
    expect(below.getDailyBasePrice.value).toBe(95_000)
    expect(below.hasStruckBasePrice.value).toBe(false)

    const equal = monthly(100_000)
    expect(equal.getDailyBasePrice.value).toBe(100_000)
    expect(equal.hasStruckBasePrice.value).toBe(false)
  })

  it('SCEN-M6: the same anchor strikes on a cheap tier and collapses on an expensive one', () => {
    // The anchor caps the base identically across tiers; what changes is the
    // real price it is compared against. 3k = 4.000.000/30 = 133.333.
    const oneK = monthly(110_000, '1k_kms')
    const threeK = monthly(110_000, '3k_kms')

    expect(oneK.getDailyBasePrice.value).toBe(110_000)
    expect(threeK.getDailyBasePrice.value).toBe(110_000)
    expect(oneK.hasStruckBasePrice.value).toBe(true)
    expect(threeK.getDailyPrice.value).toBeCloseTo(133_333.33, 1)
    expect(threeK.hasStruckBasePrice.value).toBe(false)
  })

  it('Seguro Total: the cap applies to the struck price and leaves the upgraded real price alone', () => {
    const cat = useCategory(monthlyCategoryData(118_000))
    cat.withTotalCoverage.value = true
    cat.withMileage.value = '1k_kms'

    // (3.000.000 + 400.000) / 30
    expect(cat.getDailyPrice.value).toBeCloseTo(113_333.33, 1)
    expect(cat.getDailyBasePrice.value).toBe(118_000)
    expect(cat.hasStruckBasePrice.value).toBe(true)

    const collapsed = useCategory(monthlyCategoryData(110_000))
    collapsed.withTotalCoverage.value = true
    collapsed.withMileage.value = '1k_kms'
    expect(collapsed.getDailyPrice.value).toBeCloseTo(113_333.33, 1)
    expect(collapsed.hasStruckBasePrice.value).toBe(false)
  })

  it('SCEN-M8: the DAILY flow is byte-identical with an anchor set — the cap never reaches it', () => {
    h.store!.haveMonthlyReservation.value = false
    const daily = (anchor: number | null) =>
      useCategory({
        ...monthlyCategoryData(anchor),
        vehicleDayCharge: 100_000,
        coverageUnitCharge: 20_000,
        discountAmount: 50_000,
        numberDays: 3,
        categoryMonthPrices: [],
      } as CategoryAvailabilityData)

    const plain = daily(null)
    // An anchor low enough to have wrecked the daily figures if it leaked.
    const withAnchor = daily(1)

    expect(withAnchor.getDailyBasePrice.value).toBe(plain.getDailyBasePrice.value)
    expect(withAnchor.getDailyBasePrice.value).toBe(170_000)
    expect(withAnchor.getDailyPrice.value).toBe(120_000)
    expect(withAnchor.hasStruckBasePrice.value).toBe(true)
    expect(withAnchor.hasDiscount()).toBe(true)
    expect(withAnchor.getTotalPrice.value).toBe(plain.getTotalPrice.value)
  })

  it('SCEN-M8: the daily no-discount path stays collapsed with an anchor set', () => {
    h.store!.haveMonthlyReservation.value = false
    const cat = useCategory({
      ...monthlyCategoryData(1),
      vehicleDayCharge: 100_000,
      coverageUnitCharge: 20_000,
      discountAmount: 0,
      numberDays: 3,
      categoryMonthPrices: [],
    } as CategoryAvailabilityData)

    expect(cat.getDailyBasePrice.value).toBe(cat.getDailyPrice.value)
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })

  it('issue #313: beyond the pricing horizon the anchor cannot fabricate a struck price', () => {
    h.store!.fechaRecogida.value = '2027-08-01'
    const cat = monthly(110_000)

    expect(cat.isMonthlyPriceUnavailable.value).toBe(true)
    expect(cat.getDailyBasePrice.value).toBe(0)
    expect(cat.getDailyPrice.value).toBe(0)
    expect(cat.hasStruckBasePrice.value).toBe(false)
  })

  it('SCEN-M5: a gama with no monthly pricing is unaffected by an anchor', () => {
    const cat = useCategory({
      ...monthlyCategoryData(110_000),
      categoryMonthPrices: [],
    } as CategoryAvailabilityData)
    cat.withTotalCoverage.value = false
    cat.withMileage.value = '1k_kms'

    expect(cat.isMonthlyPriceUnavailable.value).toBe(true)
    expect(cat.getDailyBasePrice.value).toBe(0)
  })

  it('exposes monthAnchorGross so the wiring is observable, defaulting to null', () => {
    expect(monthly(110_000).monthAnchorGross.value).toBe(110_000)
    expect(monthly(null).monthAnchorGross.value).toBeNull()
  })
})
