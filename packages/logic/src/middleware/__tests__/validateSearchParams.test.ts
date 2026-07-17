import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createValidateSearchParams } from '../validateSearchParams'
import { createCurrentDateObject } from '@rentacar-main/logic/utils'

// Issue #322 PR8 — SCEN-322-V01 / SCEN-322-V02.
// Holdout: docs/specs/issue-322-pr8-deeplink-validation/scenarios/deeplink-validation.scenarios.md
//
// V02: the deep-link validation used to exist as two ~270-line near-identical
// copies (ui-alquilatucarro, ui-alquilame) and alquicarros had NONE. It now
// lives ONCE here; each brand keeps a thin wrapper in app/middleware (Nuxt
// auto-registration) that parametrizes the single line that differed: whether
// the first path segment is a city ("/armenia/buscar-vehiculos/...") or the
// /reservas surface (no city segment).
//
// V01 (behavioral half): the factory corrects a past pickup date to
// tomorrow/+7 days via a redirect, instead of letting the search die in an
// empty "Sin vehículos" grid. The declaration half (alquicarros PATH pages)
// is asserted in packages/ui-alquicarros/tests/deeplink-validation.test.ts.

const TOAST_ADD = vi.fn()
const NAVIGATE_TO = vi.fn((target: unknown) => target)

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
    {
      id: 2,
      code: 'AAARM',
      name: 'Armenia Aeropuerto',
      city: 'armenia',
      slug: 'armenia-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

type RouteLike = {
  path: string
  name: string
  params: Record<string, string>
  query: Record<string, string>
}

function makeRoute(params: Record<string, string>, path = '/reservas/x'): RouteLike {
  return { path, name: 'reservas-results', params, query: {} }
}

// Date fixtures derived from the SAME utils the middleware uses — no date-rot.
const today = createCurrentDateObject()
const TOMORROW = today.add({ days: 1 }).toString()
const PAST = today.subtract({ days: 3 }).toString()
const FUTURE_PICKUP = today.add({ days: 10 }).toString()
const FUTURE_RETURN = today.add({ days: 15 }).toString()

function validParams(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    lugar_recogida: 'bogota-aeropuerto',
    lugar_devolucion: 'bogota-aeropuerto',
    fecha_recogida: FUTURE_PICKUP,
    fecha_devolucion: FUTURE_RETURN,
    hora_recogida: '12:00pm',
    hora_devolucion: '12:00pm',
    ...overrides,
  }
}

describe('createValidateSearchParams — shared deep-link validation (SCEN-322-V01)', () => {
  beforeEach(() => {
    TOAST_ADD.mockClear()
    NAVIGATE_TO.mockClear()
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: TOAST_ADD, clear: vi.fn() }))
    vi.stubGlobal('navigateTo', NAVIGATE_TO)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a past pickup date redirects to tomorrow / +7 days instead of searching the past', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute(validParams({ fecha_recogida: PAST }))

    middleware(to as never)

    expect(NAVIGATE_TO).toHaveBeenCalledTimes(1)
    const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
    expect(target.name).toBe('reservas-results')
    expect(target.params.fecha_recogida).toBe(TOMORROW)
    expect(target.params.fecha_devolucion).toBe(today.add({ days: 8 }).toString())
  })

  it('a legacy branch CODE redirects to the slug URL', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute(validParams({ lugar_recogida: 'AABOT', lugar_devolucion: 'AABOT' }))

    middleware(to as never)

    expect(NAVIGATE_TO).toHaveBeenCalledTimes(1)
    const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
    expect(target.params.lugar_recogida).toBe('bogota-aeropuerto')
    expect(target.params.lugar_devolucion).toBe('bogota-aeropuerto')
  })

  it('an unknown branch slug falls to defaults with an info toast', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute(validParams({ lugar_recogida: 'sede-fantasma' }))

    middleware(to as never)

    expect(NAVIGATE_TO).toHaveBeenCalledTimes(1)
    const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
    expect(target.params.lugar_recogida).toBe('bogota-aeropuerto')
    expect(TOAST_ADD).toHaveBeenCalledTimes(1)
  })

  it('a >30-day window is capped to 30 days with an info toast', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute(
      validParams({ fecha_devolucion: today.add({ days: 45 }).toString() }),
    )

    middleware(to as never)

    expect(NAVIGATE_TO).toHaveBeenCalledTimes(1)
    const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
    expect(target.params.fecha_devolucion).toBe(today.add({ days: 40 }).toString())
    expect(TOAST_ADD).toHaveBeenCalledTimes(1)
  })

  it('valid params pass through without a redirect (navigation continues)', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute(validParams())

    const result = middleware(to as never)

    expect(result).toBeUndefined()
    expect(NAVIGATE_TO).not.toHaveBeenCalled()
    expect(TOAST_ADD).not.toHaveBeenCalled()
  })

  it('routes without search params are skipped (e.g. /bogota)', () => {
    const middleware = createValidateSearchParams()
    const to = makeRoute({}, '/bogota')

    expect(middleware(to as never)).toBeUndefined()
    expect(NAVIGATE_TO).not.toHaveBeenCalled()
  })

  describe('cityContext parametrization (the single line the brand copies differed on)', () => {
    it('/reservas surface: "reservas" is NOT a city → global default (bogota-aeropuerto)', () => {
      const middleware = createValidateSearchParams({ nonCitySegments: ['reservas'] })
      const to = makeRoute(
        validParams({ lugar_recogida: 'sede-fantasma', lugar_devolucion: 'sede-fantasma' }),
        '/reservas/lugar-recogida/sede-fantasma',
      )

      middleware(to as never)

      const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
      expect(target.params.lugar_recogida).toBe('bogota-aeropuerto')
      expect(target.params.lugar_recogida).not.toBe('reservas-aeropuerto')
    })

    it('city-first surface (alquilatucarro): first segment IS the city → city default', () => {
      const middleware = createValidateSearchParams()
      const to = makeRoute(
        validParams({ lugar_recogida: 'sede-fantasma', lugar_devolucion: 'sede-fantasma' }),
        '/armenia/buscar-vehiculos/lugar-recogida/sede-fantasma',
      )

      middleware(to as never)

      const target = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
      expect(target.params.lugar_recogida).toBe('armenia-aeropuerto')
    })

    it('#129 city-branch correction only runs with a city context', () => {
      // Foreign pickup branch on a city page → corrected to the city default.
      const middleware = createValidateSearchParams()
      const cityTo = makeRoute(
        validParams({ lugar_recogida: 'bogota-aeropuerto', lugar_devolucion: 'bogota-aeropuerto' }),
        '/armenia/buscar-vehiculos/lugar-recogida/bogota-aeropuerto',
      )
      middleware(cityTo as never)
      expect(NAVIGATE_TO).toHaveBeenCalledTimes(1)
      const corrected = NAVIGATE_TO.mock.calls[0]![0] as RouteLike
      expect(corrected.params.lugar_recogida).toBe('armenia-aeropuerto')

      // Same branches under /reservas (no city) → untouched, no redirect.
      NAVIGATE_TO.mockClear()
      TOAST_ADD.mockClear()
      const reservasMiddleware = createValidateSearchParams({ nonCitySegments: ['reservas'] })
      const reservasTo = makeRoute(
        validParams(),
        '/reservas/lugar-recogida/bogota-aeropuerto',
      )
      expect(reservasMiddleware(reservasTo as never)).toBeUndefined()
      expect(NAVIGATE_TO).not.toHaveBeenCalled()
    })
  })
})

describe('SCEN-322-V02 — one shared implementation, brand copies reduced to wrappers', () => {
  const read = (rel: string): string =>
    readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

  const BRAND_WRAPPERS = [
    '../../../../ui-alquilatucarro/app/middleware/validateSearchParams.ts',
    '../../../../ui-alquilame/app/middleware/validateSearchParams.ts',
    '../../../../ui-alquicarros/app/middleware/validateSearchParams.ts',
  ]

  it('every brand middleware imports the shared factory from packages/logic', () => {
    for (const rel of BRAND_WRAPPERS) {
      const src = read(rel)
      expect(src).toMatch(
        /from '@rentacar-main\/logic\/middleware\/validateSearchParams'/,
      )
      expect(src).toMatch(/defineNuxtRouteMiddleware\(\s*createValidateSearchParams\(/)
    }
  })

  it('no brand keeps its own copy of the validation body (wrappers are thin)', () => {
    for (const rel of BRAND_WRAPPERS) {
      const src = read(rel)
      // Load-bearing internals of the ~270-line copy must NOT reappear per-brand.
      expect(src).not.toMatch(/dayDifference/)
      expect(src).not.toMatch(/searchBranchBySlugOrCode/)
      expect(src).not.toMatch(/useDefaultRouteParams/)
    }
  })

  it('the /reservas brands mark "reservas" as a non-city segment', () => {
    for (const rel of BRAND_WRAPPERS.slice(1)) {
      expect(read(rel)).toMatch(/nonCitySegments:\s*\['reservas'\]/)
    }
  })
})
