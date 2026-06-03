import { describe, it, expect } from 'vitest'
import { resolvePicoyPlacaExempt } from '../isPicoyPlacaExempt'

// Issue #28 Ola D. The dashboard column picoyplaca_exempt is now the SOLE source
// of truth — the transitional hardcoded fallback list is gone. Exemption derives
// only from the column; absence means "not exempt".

describe('resolvePicoyPlacaExempt', () => {
  // SCEN-D01: column true → exempt.
  it('returns true when the column marks the gama exempt', () => {
    expect(resolvePicoyPlacaExempt(true)).toBe(true)
  })

  // SCEN-D02: column false → not exempt, even for a historically-exempt gama.
  // (No hardcoded EXEMPT_FALLBACK forces FU/FL/GL/LY/LP/LU exempt anymore.)
  it('returns false when the column revokes exemption', () => {
    expect(resolvePicoyPlacaExempt(false)).toBe(false)
  })

  // SCEN-D03: column absent → not exempt (no hardcoded list to fall back to).
  it('returns false when the column is absent (null/undefined)', () => {
    expect(resolvePicoyPlacaExempt(null)).toBe(false)
    expect(resolvePicoyPlacaExempt(undefined)).toBe(false)
  })
})
