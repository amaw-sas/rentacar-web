import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'

import useStoreAdminData from '../useStoreAdminData'

// SCEN-003 — a city taken off sale disappears from the branch selectors.
//
// TWO lists, and the split is the design. `sortedBranches` stays the COMPLETE catalog because
// three things depend on it being complete:
//   · the city page paints Pereira's delivery points from it, so its page keeps working;
//   · `searchBranchByCode`/`BySlug` resolve a switched-off branch, so a deep link to it still
//     lands somewhere real instead of 404ing;
//   · `Searcher.vue` reads `sortedBranches.length === 0` as "the load failed, reload the page".
//     Filtering the shared list would make that message appear the day the last city is
//     switched off — telling a customer the site is broken when it is merely closed.
// `bookableBranches` is the one the selectors offer.

const BRANCHES = [
  { id: 1, code: 'AABOT', name: 'Bogotá Aeropuerto', city: 'bogota', bookable: true },
  { id: 2, code: 'AAPEI', name: 'Pereira Aeropuerto', city: 'pereira', bookable: false },
  { id: 3, code: 'AAARM', name: 'Armenia Aeropuerto', city: 'armenia', bookable: true },
]

function stubData(branches: unknown[]) {
  vi.stubGlobal('useState', () => ({
    value: { categories: [], branches, cities: [], extras: {}, faqs: [] },
  }))
}

describe('useStoreAdminData — bookableBranches', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leaves the switched-off branch out of what the selectors offer', () => {
    stubData(BRANCHES)
    const store = useStoreAdminData()

    expect(store.bookableBranches.map((b) => b.code)).toEqual(['AAARM', 'AABOT'])
  })

  it('keeps the switched-off branch in the full catalog', () => {
    stubData(BRANCHES)
    const store = useStoreAdminData()

    // The city page needs it to paint Pereira's delivery points, and a deep link to that branch
    // has to keep resolving.
    expect(store.sortedBranches.map((b) => b.code)).toContain('AAPEI')
    expect(store.searchBranchByCode('AAPEI')).toBeDefined()
  })

  // The hour after the deploy: the cached payload predates the column, so no branch carries the
  // field. Reading absent as "off" would empty every selector on the site.
  it('offers every branch when the payload predates the flag', () => {
    stubData(BRANCHES.map(({ bookable, ...rest }) => { void bookable; return rest }))
    const store = useStoreAdminData()

    expect(store.bookableBranches).toHaveLength(3)
  })

  it('sorts the offered branches by name, like the full catalog', () => {
    stubData(BRANCHES)
    const store = useStoreAdminData()

    expect(store.bookableBranches.map((b) => b.name)).toEqual([
      'Armenia Aeropuerto',
      'Bogotá Aeropuerto',
    ])
  })

  it('is an empty array when the catalog never loaded', () => {
    vi.stubGlobal('useState', () => ({ value: null }))
    const store = useStoreAdminData()

    expect(store.bookableBranches).toEqual([])
  })
})
