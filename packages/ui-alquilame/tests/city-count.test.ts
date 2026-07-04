/**
 * Operator correction #3 — city-count derivation holdout guards.
 *
 * Encodes SCEN-002 and SCEN-004 of
 * docs/specs/city-count-derivation/scenarios/city-count-derivation.scenarios.md
 * as static-source assertions: the marketing "N ciudades" figure must derive
 * from the single guarded count helper (useCityCount), never a hardcoded literal,
 * across ALL THREE brands. The one build-time string that cannot read runtime
 * data (alquilatucarro SEO description) is pinned to "19" as recorded debt.
 *
 * AMENDED for issue #221 (see docs/specs/city-count-derivation/
 * AMEND-2026-07-04-issue-221.md): useCityCount now derives from the deterministic
 * SERVICE_CITIES source of truth instead of live rentacar-data (live derivation
 * caused ISR hydration mismatches). These SCEN-002/004 assertions are unchanged
 * and still hold — components still bind {{ cityCount }} with no literal.
 *
 * Runtime behaviour (SCEN-001/005: the rendered number equals the live count,
 * SSR-present, CLS-safe) is verified separately in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SERVICE_CITIES } from '@rentacar-main/logic/utils'

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
  const files = {
    'home/Stats.vue': 'app/components/home/Stats.vue',
    'home/ValueProps.vue': 'app/components/home/ValueProps.vue',
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
    expect(src).toMatch(new RegExp(`${SERVICE_CITIES.length} ciudades de Colombia`))
    expect(src).not.toMatch(/20 ciudades de Colombia/)
  })
})

// Issue #221 drift guard. The build-time SEO count literals cannot read runtime
// data, so they are the exact spots that drifted before (14/16/20 for the same
// 19 cities — see AMEND-2026-07-04-issue-221.md). Derive the expected values
// from SERVICE_CITIES.length so this test self-corrects the day a city is added
// and FAILS loudly if any brand's literal is left stale. The "N named + rest"
// descriptions name 3 cities (Bogotá, Medellín, Cali) then say "y {N-3} ciudades
// más"; the gana pages say "{N} ciudades del país".
describe('issue #221: build-time SEO count literals stay in lockstep with SERVICE_CITIES', () => {
  const N = SERVICE_CITIES.length
  const brands = ['ui-alquilame', 'ui-alquicarros', 'ui-alquilatucarro']

  for (const brand of brands) {
    it(`${brand} nuxt.config + app.config descriptions say "${N - 3} ciudades más" (3 named + ${N - 3} = ${N})`, () => {
      for (const rel of ['nuxt.config.ts', 'app/app.config.ts']) {
        const src = read(join(PACKAGES, brand, rel))
        expect(src).toContain(`${N - 3} ciudades más`)
        // No stale sibling literal (e.g. the pre-fix "14 ciudades más").
        expect(src).not.toMatch(new RegExp(`Cali y (?!${N - 3} )\\d+ ciudades más`))
      }
    })

    it(`${brand} gana page says "${N} ciudades del país" (no stale "más de N")`, () => {
      const src = read(join(PACKAGES, brand, 'app/pages/gana/index.vue'))
      expect(src).toContain(`${N} ciudades del país`)
      expect(src).not.toMatch(/más de \d+ ciudades del país/)
    })
  }
})
