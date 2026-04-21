import { describe, it, expect } from 'vitest'
import { pickEffectiveTotalCoverageUnitCharge } from '../pickEffectiveTotalCoverage'

// Scenario captured: Supabase category_pricing.total_coverage_unit_charge
// values landed below the basic coverage charge from the localiza
// availability API (e.g. Group C: total=27500, basic=29000), so "Seguro
// Total" rendered cheaper than "Seguro Básico" — a logical impossibility
// that confuses the user and undercharges the booking. The safeguard
// floors the total charge at the basic charge whenever data is inverted.

describe('pickEffectiveTotalCoverageUnitCharge', () => {
  it('returns total when total is greater than basic (healthy data)', () => {
    expect(pickEffectiveTotalCoverageUnitCharge(77000, 29000)).toBe(77000)
  })

  it('returns basic when total is less than basic (inverted seed)', () => {
    // Group C observed in production: total=27500, basic=29000.
    expect(pickEffectiveTotalCoverageUnitCharge(27500, 29000)).toBe(29000)
  })

  it('returns either when total equals basic', () => {
    expect(pickEffectiveTotalCoverageUnitCharge(29000, 29000)).toBe(29000)
  })

  it('returns basic when total is zero (missing seed)', () => {
    expect(pickEffectiveTotalCoverageUnitCharge(0, 29000)).toBe(29000)
  })

  it('returns total when basic is zero (should not happen but guarded)', () => {
    expect(pickEffectiveTotalCoverageUnitCharge(77000, 0)).toBe(77000)
  })
})
