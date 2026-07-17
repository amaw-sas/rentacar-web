import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// SEO audit P0. The build-time marketing copy hardcodes the active-city count in
// two shapes:
//   - "Bogotá, Medellín, Cali y N ciudades más"  → N = total − 3 (3 cities named)
//   - "en N ciudades de Colombia"                → N = total
// The single source of truth is FALLBACK_CITY_COUNT in the logic layer (the live
// figure is data-driven, but that constant mirrors it for build-time literals).
// These literals drifted apart (14 vs 16 vs 19); this guard fails CI if any brand
// config stops matching the constant, so a future bump can't leave stale copy.

const LOGIC_ROOT = join(__dirname, '..') // packages/logic
const PKGS_ROOT = join(__dirname, '..', '..') // packages/

const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros'] as const

function read(rel: string): string {
  return readFileSync(rel, 'utf-8')
}

/** Extract FALLBACK_CITY_COUNT from the source of truth (no vue-dependent import). */
function cityCount(): number {
  const src = read(join(LOGIC_ROOT, 'src', 'composables', 'useCityCount.ts'))
  const m = src.match(/FALLBACK_CITY_COUNT\s*=\s*(\d+)/)
  if (!m) throw new Error('FALLBACK_CITY_COUNT not found in useCityCount.ts')
  return Number(m[1])
}

const TOTAL = cityCount()
const MORE = TOTAL - 3 // "y N ciudades más" names Bogotá, Medellín, Cali explicitly

function appConfig(brand: string): string {
  return read(join(PKGS_ROOT, `ui-${brand}`, 'app', 'app.config.ts'))
}
function nuxtConfig(brand: string): string {
  return read(join(PKGS_ROOT, `ui-${brand}`, 'nuxt.config.ts'))
}

describe('SEO city-count copy stays in sync with FALLBACK_CITY_COUNT', () => {
  it('has a plausible source-of-truth count', () => {
    expect(TOTAL).toBeGreaterThan(3)
  })

  for (const brand of BRANDS) {
    it(`${brand} app.config franchise.description says "${MORE} ciudades más"`, () => {
      const cfg = appConfig(brand)
      expect(cfg).toMatch(new RegExp(`${MORE} ciudades más`))
      // No other "N ciudades más" number is allowed to linger.
      const matches = cfg.match(/(\d+) ciudades más/g) || []
      for (const m of matches) expect(m).toBe(`${MORE} ciudades más`)
    })

    it(`${brand} nuxt.config site.description says "${MORE} ciudades más"`, () => {
      const cfg = nuxtConfig(brand)
      expect(cfg).toMatch(new RegExp(`${MORE} ciudades más`))
      const matches = cfg.match(/(\d+) ciudades más/g) || []
      for (const m of matches) expect(m).toBe(`${MORE} ciudades más`)
    })
  }

  it(`alquilatucarro nuxt.config llms description says "${TOTAL} ciudades de Colombia"`, () => {
    const cfg = nuxtConfig('alquilatucarro')
    expect(cfg).toMatch(new RegExp(`${TOTAL} ciudades de Colombia`))
    const matches = cfg.match(/(\d+) ciudades de Colombia/g) || []
    for (const m of matches) expect(m).toBe(`${TOTAL} ciudades de Colombia`)
  })
})
