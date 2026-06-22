import { describe, it, expect } from 'vitest'
import { resolveCityBranchCorrection } from '../resolveCityBranchCorrection'
import type BranchData from '../types/data/BranchData'

// Issue #129. The pickup branch MUST belong to the page's city. The return
// branch may be elsewhere (one-way / traslado is valid by design). The helper
// is the pure decision: given the resolved branches, the page city, and the
// city's default branch (looked up by the caller), return the corrected slug
// params or null when no correction is needed.

const branch = (city: string, slug: string | undefined, id = 1): BranchData => ({
  id,
  code: slug ? slug.toUpperCase() : `CODE${id}`,
  name: slug ?? `branch-${id}`,
  city,
  slug,
})

const barranquilla = branch('barranquilla', 'barranquilla-aeropuerto', 1)
const armenia = branch('armenia', 'armenia-aeropuerto', 2)
const medellin = branch('medellin', 'medellin-aeropuerto', 3)

describe('resolveCityBranchCorrection', () => {
  // SCEN-001: pickup foráneo + return foráneo bajo otra ciudad → corrige AMBOS
  // a la sede de la ciudad de la página (URL entera corrupta).
  it('corrects both ends when the pickup is foreign and the return is foreign too', () => {
    expect(
      resolveCityBranchCorrection(armenia, armenia, 'barranquilla', barranquilla),
    ).toEqual({
      lugar_recogida: 'barranquilla-aeropuerto',
      lugar_devolucion: 'barranquilla-aeropuerto',
    })
  })

  // Pickup foráneo pero return ya en la ciudad → corrige SOLO la recogida,
  // no toca la devolución.
  it('corrects only the pickup when the return already belongs to the city', () => {
    expect(
      resolveCityBranchCorrection(armenia, barranquilla, 'barranquilla', barranquilla),
    ).toEqual({ lugar_recogida: 'barranquilla-aeropuerto' })
  })

  // SCEN-002: one-way legítimo (pickup de la ciudad, return de otra) → null.
  it('does not redirect a legitimate one-way (pickup in city, return elsewhere)', () => {
    expect(
      resolveCityBranchCorrection(barranquilla, medellin, 'barranquilla', barranquilla),
    ).toBeNull()
  })

  // SCEN-003: URL ya consistente (ambos de la ciudad) → null.
  it('does not redirect when both ends already belong to the city', () => {
    expect(
      resolveCityBranchCorrection(barranquilla, barranquilla, 'barranquilla', barranquilla),
    ).toBeNull()
  })

  // Loop-safety: el output de SCEN-001, re-evaluado (pickup ya = sede de la
  // ciudad), devuelve null → no re-entra → no redirect loop.
  it('is loop-safe: re-evaluating a corrected URL yields null', () => {
    const corrected = resolveCityBranchCorrection(armenia, armenia, 'barranquilla', barranquilla)
    expect(corrected).not.toBeNull()
    // tras el redirect, pickup y return son la sede de Barranquilla:
    expect(
      resolveCityBranchCorrection(barranquilla, barranquilla, 'barranquilla', barranquilla),
    ).toBeNull()
  })

  // SCEN-006: ciudad sin sucursal resoluble → null (no se puede corregir,
  // degradado, sin crash/loop).
  it('returns null when the city has no resolvable branch', () => {
    expect(
      resolveCityBranchCorrection(armenia, armenia, 'leticia', undefined),
    ).toBeNull()
  })

  // Edge: la sede de la ciudad existe pero sin slug poblado → null (no se
  // emite un param undefined a la URL).
  it('returns null when the city branch has no slug', () => {
    const noSlug = branch('barranquilla', undefined, 9)
    expect(
      resolveCityBranchCorrection(armenia, armenia, 'barranquilla', noSlug),
    ).toBeNull()
  })
})
