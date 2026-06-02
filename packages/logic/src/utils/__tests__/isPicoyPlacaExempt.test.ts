import { describe, it, expect } from 'vitest'
import { resolvePicoyPlacaExempt } from '../isPicoyPlacaExempt'

// Issue #28 Ola B2-web. The dashboard column picoyplaca_exempt is the source of
// truth; a transitional fallback to the legacy hardcoded list applies only when
// the column is absent (null/undefined), until Ola D removes it.

describe('resolvePicoyPlacaExempt', () => {
  // SCEN-B2-01: column true wins even for a code not in the fallback list.
  it('returns true from the column for a brand-new exempt code (ZZ)', () => {
    expect(resolvePicoyPlacaExempt(true, 'ZZ' as never)).toBe(true)
  })

  // SCEN-B2-02: column false wins even for a code that IS in the fallback list.
  it('returns false from the column for FU (column revokes a legacy exemption)', () => {
    expect(resolvePicoyPlacaExempt(false, 'FU')).toBe(false)
  })

  // SCEN-B2-03: null falls back to the legacy hardcoded list (preserves today).
  it('falls back to the hardcoded list when the column is null', () => {
    for (const code of ['FU', 'FL', 'GL', 'LY', 'LP', 'LU'] as const) {
      expect(resolvePicoyPlacaExempt(null, code), `${code} should be exempt via fallback`).toBe(true)
    }
    expect(resolvePicoyPlacaExempt(null, 'C')).toBe(false)
  })

  // LU regression (issue #93) preserved through the fallback path.
  it('keeps LU exempt via fallback (issue #93)', () => {
    expect(resolvePicoyPlacaExempt(null, 'LU')).toBe(true)
  })

  it('treats undefined like null (fallback)', () => {
    expect(resolvePicoyPlacaExempt(undefined, 'FU')).toBe(true)
    expect(resolvePicoyPlacaExempt(undefined, 'C')).toBe(false)
  })

  it('returns false when there is no code and no column value', () => {
    expect(resolvePicoyPlacaExempt(null, null)).toBe(false)
    expect(resolvePicoyPlacaExempt(undefined, undefined)).toBe(false)
  })

  // The column is authoritative even when it agrees with the fallback, so the
  // decision provably came from data, not list membership.
  it('returns the column value when present regardless of the fallback list', () => {
    expect(resolvePicoyPlacaExempt(true, 'C')).toBe(true)
    expect(resolvePicoyPlacaExempt(false, 'LU')).toBe(false)
  })
})
