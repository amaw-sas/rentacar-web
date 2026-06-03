import { describe, it, expect } from 'vitest'
import { isCategoryVisibleInCity } from '../isCategoryVisibleInCity'

// Issue #28 Ola D. Geographic visibility now derives SOLELY from the dashboard
// (visibility_mode + category_city_visibility). The transitional legacy hardcoded
// lists (BOGOTA_ONLY/CX_CITIES/GY_CITIES + branch codes) are gone — no
// category-code branching remains.

describe('isCategoryVisibleInCity', () => {
  // SCEN-D04: 'all' imposes no geographic constraint, even for a gama that used
  // to be hardcoded Bogotá-only.
  it('shows a mode=all category anywhere (no legacy Bogotá-only restriction)', () => {
    expect(isCategoryVisibleInCity('all', [], 'medellin')).toBe(true)
    expect(isCategoryVisibleInCity('all', [], 'pasto')).toBe(true)
  })

  // SCEN-D05: restricted → visible only in its whitelisted cities, purely from data.
  it('shows a restricted category only in its allowed cities', () => {
    expect(isCategoryVisibleInCity('restricted', ['bogota'], 'bogota')).toBe(true)
    expect(isCategoryVisibleInCity('restricted', ['bogota'], 'medellin')).toBe(false)
    expect(isCategoryVisibleInCity('restricted', ['cali', 'medellin'], 'medellin')).toBe(true)
    expect(isCategoryVisibleInCity('restricted', ['cali', 'medellin'], 'bogota')).toBe(false)
  })

  // SCEN-D06: restricted but no cities yet → fail open (permanent revenue guard).
  it('keeps a restricted-but-unbackfilled category visible nationwide (fail open)', () => {
    expect(isCategoryVisibleInCity('restricted', [], 'medellin')).toBe(true)
    expect(isCategoryVisibleInCity('restricted', null, 'bogota')).toBe(true)
  })

  // SCEN-D07: no pickup city resolved yet → don't hide.
  it('hides nothing when no pickup city is selected', () => {
    expect(isCategoryVisibleInCity('restricted', ['bogota'], null)).toBe(true)
    expect(isCategoryVisibleInCity('restricted', ['bogota'], undefined)).toBe(true)
  })
})
