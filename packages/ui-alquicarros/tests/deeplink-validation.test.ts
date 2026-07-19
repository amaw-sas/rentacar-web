/**
 * Issue #322 PR8 — SCEN-322-V01 (declaration half).
 * Holdout: docs/specs/issue-322-pr8-deeplink-validation/scenarios/deeplink-validation.scenarios.md
 *
 * alquicarros had NO route middleware for /reservas deep-links: a PATH link
 * with a past pickup date or a legacy branch code died in an empty
 * "Sin vehículos" wizard with no message. The shared validation now lives in
 * packages/logic (behavioral tests there); this file asserts the brand side:
 * the thin wrapper exists in app/middleware (Nuxt auto-registration) and every
 * /reservas PATH page DECLARES it — mirroring how alquilame/alquilatucarro
 * declare theirs via definePageMeta.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const tryRead = (rel: string): string => {
  const p = join(ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf-8') : ''
}
const exists = (rel: string): boolean => existsSync(join(ROOT, rel))

const TAIL =
  'lugar-recogida/[lugar_recogida]/lugar-devolucion/[lugar_devolucion]/fecha-recogida/[fecha_recogida]/fecha-devolucion/[fecha_devolucion]/hora-recogida/[hora_recogida]/hora-devolucion/[hora_devolucion]'

const RESERVAS_PATH_PAGES = [
  `app/pages/reservas/${TAIL}/index.vue`,
  `app/pages/reservas/${TAIL}/categoria/[categoria]/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/index.vue`,
  `app/pages/reservas/referido/[referido]/${TAIL}/categoria/[categoria]/index.vue`,
]

describe('SCEN-322-V01 — alquicarros valida deep-links de /reservas', () => {
  it('el wrapper de middleware existe en app/middleware (auto-registro de Nuxt)', () => {
    expect(exists('app/middleware/validateSearchParams.ts')).toBe(true)
  })

  it('el wrapper consume la implementación compartida de packages/logic', () => {
    const src = tryRead('app/middleware/validateSearchParams.ts')
    expect(src).toMatch(/from '@rentacar-main\/logic\/middleware\/validateSearchParams'/)
    expect(src).toMatch(/defineNuxtRouteMiddleware\(/)
    expect(src).toMatch(/nonCitySegments:\s*\['reservas'\]/)
  })

  for (const p of RESERVAS_PATH_PAGES) {
    const label = p.replace('app/pages/reservas/', '').replace(TAIL, '…')
    it(`la página PATH declara el middleware: reservas/${label}`, () => {
      const src = tryRead(p)
      expect(src).toMatch(/definePageMeta\(\s*\{[\s\S]*?middleware:\s*\[[^\]]*'validate-search-params'/)
    })
  }
})
