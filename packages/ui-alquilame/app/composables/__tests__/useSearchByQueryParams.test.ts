/**
 * SCEN-003 — useSearchByQueryParams (alquilame-local composable).
 *
 * Mirrors packages/logic useSearchByRouteParams but reads route.QUERY instead of
 * route.params, re-runs when the query changes, and only triggers doSearch when
 * the required search keys are present (an empty /reservas must NOT fire a
 * search). Static-source assertions, same style as the rest of the suite.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../useSearchByQueryParams.ts', import.meta.url)),
  'utf8',
)

describe('useSearchByQueryParams — reads the query string, not path params', () => {
  it('reads the pickup/return slugs from route.query (NOT route.params)', () => {
    expect(source).toMatch(/route\.query\.lugar_recogida/)
    expect(source).toMatch(/route\.query\.lugar_devolucion/)
    expect(source).not.toMatch(/route\.params\.lugar_recogida/)
  })

  it('reads the dates and times from route.query', () => {
    expect(source).toMatch(/route\.query\.fecha_recogida/)
    expect(source).toMatch(/route\.query\.fecha_devolucion/)
    expect(source).toMatch(/route\.query\.hora_recogida/)
    expect(source).toMatch(/route\.query\.hora_devolucion/)
  })

  it('resolves slug→branch code via searchBranchBySlug (mirrors the route-param driver)', () => {
    expect(source).toMatch(/searchBranchBySlug/)
  })
})

describe('useSearchByQueryParams — guarded + reactive', () => {
  it('only runs doSearch when the required query keys are present (no empty-/reservas search)', () => {
    // A guard that bails when lugar_recogida / fecha_recogida are missing.
    expect(source).toMatch(/if\s*\(\s*!.*lugar_recogida[\s\S]{0,120}?return/)
    expect(source).toMatch(/doSearch\(\)/)
  })

  it('runs on mount AND re-runs when route.query changes (watch)', () => {
    expect(source).toMatch(/onMounted\(/)
    expect(source).toMatch(/watch\(\s*\(\)\s*=>\s*route\.query/)
  })

  it('is SSR-safe — store access happens inside onMounted (no top-level store call)', () => {
    expect(source).toMatch(/onMounted\([\s\S]*useStoreReservationForm\(\)/)
    expect(source).toMatch(/onMounted\([\s\S]*useStoreAdminData\(\)/)
  })
})
