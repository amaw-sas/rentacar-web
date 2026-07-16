import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, effectScope } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Issue #322 PR8 — SCEN-322-V04.
// Holdout: docs/specs/issue-322-pr8-deeplink-validation/scenarios/deeplink-validation.scenarios.md
//
// The results pages used to build TWO useSearch instances: the Searcher
// component calls useSearch() in its setup AND useSearchByRouteParams /
// useSearchByQueryParams created another one in onMounted — duplicating the
// ~10 synchronization watchers over the SAME store refs. useSearch is now a
// shared composable (createSharedComposable): the first caller creates the
// instance (watchers registered exactly once), every later caller reuses it,
// and disposal happens when the last consumer's scope stops.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

const ADMIN_PAYLOAD = {
  categories: [],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

describe('useSearch — single shared instance (SCEN-322-V04)', () => {
  beforeEach(() => {
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('two callers inside live scopes get the SAME instance (watchers registered once)', async () => {
    const { default: useSearch } = await import('../useSearch')

    const scopeA = effectScope()
    const scopeB = effectScope()

    const a = scopeA.run(() => useSearch())
    const b = scopeB.run(() => useSearch())

    // Same object identity ⇒ the second consumer did NOT re-run the composable
    // body, so no duplicate watcher registration is possible.
    expect(a).toBe(b)

    scopeA.stop()
    scopeB.stop()
  })

  it('after every consumer unmounts, the next page gets a FRESH instance', async () => {
    const { default: useSearch } = await import('../useSearch')

    const scopeA = effectScope()
    const first = scopeA.run(() => useSearch())
    scopeA.stop()

    const scopeB = effectScope()
    const second = scopeB.run(() => useSearch())

    expect(second).not.toBe(first)

    scopeB.stop()
  })

  it('structural: the export is wrapped in createSharedComposable', () => {
    expect(source).toMatch(/createSharedComposable\(useSearchInstance\)/)
    expect(source).toMatch(/export default function useSearch\(\)/)
  })

  it('structural: the route/query param drivers reuse useSearch (no parallel implementation)', () => {
    const routeDriver = readFileSync(
      fileURLToPath(new URL('../useSearchByRouteParams.ts', import.meta.url)),
      'utf8',
    )
    expect(routeDriver).toMatch(/const\s*\{\s*doSearch\s*\}\s*=\s*useSearch\(\)/)
  })
})
