/**
 * Operator correction #3 — city-count derivation holdout guards.
 *
 * Encodes SCEN-002 and SCEN-004 of
 * docs/specs/city-count-derivation/scenarios/city-count-derivation.scenarios.md
 * as static-source assertions: the marketing "N ciudades" figure must derive
 * from the live active-cities list (useCityCount), never a hardcoded literal,
 * across ALL THREE brands. The one build-time string that cannot read runtime
 * data (alquilatucarro SEO description) is pinned to "20" as recorded debt.
 *
 * Runtime behaviour (SCEN-001/005: the rendered number equals the live count,
 * SSR-present, CLS-safe) is verified separately in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ALQUILAME = join(__dirname, '..')
const PACKAGES = join(__dirname, '..', '..')

function read(abs: string): string {
  return readFileSync(abs, 'utf-8')
}

// A hardcoded city count = any literal number immediately before "ciudades".
// The derived forms (`{{ cityCount }} ciudades` / `${cityCount} ciudades`) have
// no digit before the word, so they never match.
const HARDCODED_COUNT = /\d+\s+ciudades/i

describe('SCEN-002: no hardcoded city count in alquilame components', () => {
  // Files that DISPLAY a city figure must derive it from cityCount, never a
  // literal. (ValueProps no longer shows a coverage figure since it adopted the
  // reference's photo advantages — it is checked separately below.)
  const files = {
    'home/Stats.vue': 'app/components/home/Stats.vue',
    'home/Hero.vue': 'app/components/home/Hero.vue',
    'layouts/default.vue': 'app/layouts/default.vue',
  }

  for (const [label, rel] of Object.entries(files)) {
    it(`${label} derives the count (no hardcoded "N ciudades")`, () => {
      const src = read(join(ALQUILAME, rel))
      expect(src).not.toMatch(HARDCODED_COUNT)
      expect(src).toMatch(/cityCount/)
    })
  }

  it('home/ValueProps.vue shows photo advantages and hardcodes no city count', () => {
    // The section no longer carries a coverage figure, so the invariant here is
    // purely negative: it must not smuggle in a hardcoded "N ciudades".
    const src = read(join(ALQUILAME, 'app/components/home/ValueProps.vue'))
    expect(src).not.toMatch(HARDCODED_COUNT)
    expect(src).toContain('/images/ventajas/')
  })

  it('Stats.vue no longer carries the literal value: \'19\'', () => {
    const src = read(join(ALQUILAME, 'app/components/home/Stats.vue'))
    expect(src).not.toMatch(/value:\s*'19'/)
    expect(src).toMatch(/value:\s*String\(cityCount\.value\)/)
  })
})

describe('SCEN-004: all three brands consistent, none claims a hardcoded count', () => {
  const footers = {
    alquilame: 'ui-alquilame/app/layouts/default.vue',
    alquilatucarro: 'ui-alquilatucarro/app/layouts/default.vue',
    alquicarros: 'ui-alquicarros/app/layouts/default.vue',
  }

  for (const [brand, rel] of Object.entries(footers)) {
    it(`${brand} footer derives the count`, () => {
      const src = read(join(PACKAGES, rel))
      expect(src).not.toMatch(HARDCODED_COUNT)
      expect(src).toMatch(/cityCount/)
    })
  }

  it('alquilatucarro build-time SEO description matches the current count (19, recorded debt)', () => {
    // Build-time string can't read runtime data; it mirrors FALLBACK_CITY_COUNT
    // (currently 19) and is bumped by hand when the live count changes.
    const src = read(join(PACKAGES, 'ui-alquilatucarro/nuxt.config.ts'))
    expect(src).toMatch(/19 ciudades de Colombia/)
    expect(src).not.toMatch(/20 ciudades de Colombia/)
  })
})
