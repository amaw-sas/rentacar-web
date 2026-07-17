import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import useCategory from '../useCategory'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

// Issue #314 — IVA source of truth. Behavioral tests (not source-level): the
// scenarios assert on the NUMERIC value of getIVAFeePrice, which a text match
// cannot prove. useCategory depends on the Nuxt auto-import useFetchRentacarData
// and on Pinia, so we stub the former and activate a fresh pinia per test.
//
// Payload arithmetic (withTotalCoverage = true):
//   totalCoverageUnitCharge = 0, coverageUnitCharge = 0 → getTotalCoveragePrice = 0
//   getSubtotal   = totalAmount (100000) + 0 + returnFee (0)      = 100000
//   getTaxFeePrice = round(100000 * taxFeePercentage(10) / 100)   = 10000
//   sum            = 110000
//   getIVAFeePrice = round(110000 * ivaPct / 100)
// → ivaPct 21 = 23100 · ivaPct 19 = 20900 · ivaPct 0 = 0

const makeCategory = (
  overrides: Partial<CategoryAvailabilityData> = {},
): CategoryAvailabilityData => ({
  categoryCode: 'C' as CategoryAvailabilityData['categoryCode'],
  categoryDescription: 'Compacto',
  totalAmount: 100000,
  estimatedTotalAmount: 100000,
  vehicleDayCharge: 0,
  numberDays: 1,
  taxFeeAmount: 0,
  taxFeePercentage: 10,
  IVAFeeAmount: 45000,
  coverageUnitCharge: 0,
  coverageQuantity: 1,
  coverageTotalAmount: 0,
  totalCoverageUnitCharge: 0,
  referenceToken: 'tok',
  rateQualifier: 'rq',
  ...overrides,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('useFetchRentacarData', () => ({ extras: undefined }))
})

describe('useCategory.getIVAFeePrice — IVA source of truth (issue #314)', () => {
  it('SCEN-314-01: with Seguro Total, uses the dashboard IVAFeePercentage (21%)', () => {
    const cat = useCategory(makeCategory({ IVAFeePercentage: 21 }))
    cat.withTotalCoverage.value = true

    // round((100000 + 10000) * 21 / 100) = 23100
    expect(cat.getIVAFeePrice.value).toBe(23100)
  })

  it('SCEN-314-02: without the field, falls back to 19% (current behavior intact)', () => {
    const cat = useCategory(makeCategory()) // no IVAFeePercentage
    cat.withTotalCoverage.value = true

    // round((100000 + 10000) * 19 / 100) = 20900
    expect(cat.getIVAFeePrice.value).toBe(20900)
  })

  it('SCEN-314-03: a dashboard percentage of 0 yields IVA 0 (?? does not clobber 0)', () => {
    const cat = useCategory(makeCategory({ IVAFeePercentage: 0 }))
    cat.withTotalCoverage.value = true

    expect(cat.getIVAFeePrice.value).toBe(0)
  })

  it('SCEN-314-05: without Seguro Total, IVA is the dashboard amount, no recompute', () => {
    const cat = useCategory(makeCategory({ IVAFeeAmount: 45000, IVAFeePercentage: 21 }))
    // withTotalCoverage stays false

    // else-branch returns IVAFeeAmount untouched — the percentage is irrelevant here
    expect(cat.getIVAFeePrice.value).toBe(45000)
  })
})
