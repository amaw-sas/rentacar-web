import { describe, it, expect, vi, afterEach } from 'vitest'

import { useBranchCount, FALLBACK_BRANCH_COUNT } from '../useBranchCount'

// SCEN-002 y SCEN-003 de docs/specs/conteo-sedes-derivado.
//
// La cifra de "N sedes" tiene que salir de la lista real de sucursales, no de un
// literal: la auditoría del 2026-08-14 encontró "27 sedes" vivo en la home de
// alquilatucarro cuando ya eran 31. El respaldo cubre el arranque degradado para
// que la web nunca anuncie "0 sedes".

function stubBranches(branches: unknown) {
  vi.stubGlobal('useFetchRentacarData', () => ({
    categories: [],
    branches,
    extras: undefined,
    vehicleCategories: {},
    cities: [],
    faqs: [],
    franchiseTestimonials: {},
  }))
}

describe('useBranchCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-002: devuelve el número real de sucursales (31 hoy)', () => {
    stubBranches(Array.from({ length: 31 }, (_, i) => ({ id: String(i) })))
    expect(useBranchCount().value).toBe(31)
  })

  it('SCEN-002: se actualiza solo cuando abren una sede más', () => {
    stubBranches(Array.from({ length: 32 }, (_, i) => ({ id: String(i) })))
    expect(useBranchCount().value).toBe(32)
  })

  it('SCEN-002: y cuando cierran una', () => {
    stubBranches(Array.from({ length: 29 }, (_, i) => ({ id: String(i) })))
    expect(useBranchCount().value).toBe(29)
  })

  it('SCEN-003: con la lista vacía usa el respaldo, nunca 0', () => {
    stubBranches([])
    expect(useBranchCount().value).toBe(FALLBACK_BRANCH_COUNT)
    expect(useBranchCount().value).toBeGreaterThan(0)
  })

  it('SCEN-003: y también cuando los datos no han llegado', () => {
    stubBranches(undefined)
    expect(useBranchCount().value).toBe(FALLBACK_BRANCH_COUNT)
  })

  it('el respaldo refleja el conteo real del 2026-08-14', () => {
    expect(FALLBACK_BRANCH_COUNT).toBe(31)
  })
})
