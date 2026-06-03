import { describe, it, expect } from 'vitest'
import { isCategoryVisibleInCity } from '../isCategoryVisibleInCity'

// Issue #28 Ola C-web. visible = dataGeoAllows AND legacyGeoAllows. The legacy
// term is the transitional constraint removed in Ola D.
const CX7 = ['barranquilla', 'bogota', 'bucaramanga', 'cali', 'cartagena', 'medellin', 'santa-marta']
const GY8 = [...CX7, 'soledad']

describe('isCategoryVisibleInCity', () => {
  // SCEN-C01: restricted by data — hidden outside its cities, shown inside.
  it('hides a restricted category outside its allowed cities, shows it inside', () => {
    expect(isCategoryVisibleInCity('restricted', ['bogota'], 'FU', 'medellin', 'AABOT')).toBe(false)
    expect(isCategoryVisibleInCity('restricted', ['bogota'], 'FU', 'bogota', 'AABOT')).toBe(true)
  })

  // SCEN-C02: transition — pre-backfill 'all' still filtered by the legacy term.
  it('keeps the legacy restriction while the category is still mode=all (pre-backfill)', () => {
    // FU is in the legacy Bogotá-only list; a non-Bogotá branch hides it even
    // though the data says 'all'.
    expect(isCategoryVisibleInCity('all', [], 'FU', 'medellin', 'AAMDE')).toBe(false)
    expect(isCategoryVisibleInCity('all', [], 'FU', 'bogota', 'AABOT')).toBe(true)
  })

  // SCEN-C03: not restricted by data nor legacy → visible everywhere.
  it('shows a non-restricted, non-legacy category everywhere', () => {
    expect(isCategoryVisibleInCity('all', [], 'C', 'pasto', 'AAPAS')).toBe(true)
  })

  // SCEN-C04: CX/GY city lists preserved.
  it('preserves the CX 7-city and GY 8-city lists', () => {
    expect(isCategoryVisibleInCity('restricted', CX7, 'CX', 'pasto', 'AAPAS')).toBe(false)
    expect(isCategoryVisibleInCity('restricted', CX7, 'CX', 'cali', 'AACAL')).toBe(true)
    expect(isCategoryVisibleInCity('restricted', GY8, 'GY', 'soledad', 'AASOL')).toBe(true)
    // soledad is GY-only, not in CX's 7 → CX hidden there even via legacy.
    expect(isCategoryVisibleInCity('all', [], 'CX', 'soledad', 'AASOL')).toBe(false)
  })

  // SCEN-C05: no pickup location → nothing hidden.
  it('hides nothing when no pickup location is selected', () => {
    expect(isCategoryVisibleInCity('restricted', ['bogota'], 'FU', undefined, undefined)).toBe(true)
    expect(isCategoryVisibleInCity('restricted', CX7, 'CX', undefined, undefined)).toBe(true)
  })

  // Data tightens beyond legacy: a NEW restricted code (not in any legacy list)
  // is constrained by data alone — proves the move to SoT.
  it('applies data restriction to a brand-new code not in any legacy list', () => {
    expect(isCategoryVisibleInCity('restricted', ['cali'], 'ZZ' as never, 'bogota', 'AABOT')).toBe(false)
    expect(isCategoryVisibleInCity('restricted', ['cali'], 'ZZ' as never, 'cali', 'AACAL')).toBe(true)
  })

  // Revenue guard: 'restricted' with an empty whitelist (mode flipped before
  // the city rows land / partial backfill) must NOT vanish the category
  // nationwide — fail open, defer to the legacy term.
  it('does not hide a restricted category nationwide when its whitelist is still empty', () => {
    // A new restricted code with no cities and not in any legacy list → visible.
    expect(isCategoryVisibleInCity('restricted', [], 'ZZ' as never, 'cali', 'AACAL')).toBe(true)
    // FU restricted-but-empty still obeys the legacy Bogotá branch term.
    expect(isCategoryVisibleInCity('restricted', [], 'FU', 'bogota', 'AABOT')).toBe(true)
    expect(isCategoryVisibleInCity('restricted', [], 'FU', 'medellin', 'AAMDE')).toBe(false)
  })

  // Both constraints apply (AND): data allows but legacy forbids → hidden.
  it('hides when legacy forbids even if data allows (AND semantics)', () => {
    // FU data says visible in medellin, but legacy (non-Bogotá branch) forbids.
    expect(isCategoryVisibleInCity('restricted', ['bogota', 'medellin'], 'FU', 'medellin', 'AAMDE')).toBe(false)
  })
})
