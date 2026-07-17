/**
 * Issue #322 PR8 — SCEN-322-V05.
 * Holdout: docs/specs/issue-322-pr8-deeplink-validation/scenarios/deeplink-validation.scenarios.md
 *
 * /reservas mounted the <Searcher> engine TWICE — desktop (`hidden lg:block`)
 * and mobile (`lg:hidden`) wrappers both kept their instance in the DOM: double
 * hydration, duplicate watchers, duplicate data-testids. The engine is now
 * gated with useBreakpoints + v-if (the repo's ghost-calendar pattern) so
 * exactly ONE instance mounts per breakpoint. The wrappers, their fixed-height
 * CLS guards (#109) and the ClientOnly/Placeholders fallback stay intact —
 * index.test.ts keeps asserting those.
 *
 * Static-source assertions, same style as the rest of the suite.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const page = readFileSync(join(__dirname, '..', 'index.vue'), 'utf-8')

describe('SCEN-322-V05 — /reservas monta UN solo <Searcher>', () => {
  it('deriva isDesktop de useBreakpoints(breakpointsTailwind).greaterOrEqual("lg")', () => {
    expect(page).toMatch(/useBreakpoints,\s*breakpointsTailwind\s*\}\s*from\s*'@vueuse\/core'/)
    expect(page).toMatch(/useBreakpoints\(breakpointsTailwind\)/)
    expect(page).toMatch(/greaterOrEqual\('lg'\)/)
  })

  it('la variante desktop se gatea con v-if="isDesktop"', () => {
    expect(page).toMatch(/<Searcher\s+v-if="isDesktop"\s*\/>/)
  })

  it('la variante móvil se gatea con v-if="!isDesktop"', () => {
    expect(page).toMatch(/<Searcher\s+v-if="!isDesktop"\s*\/>/)
  })

  it('no queda ningún <Searcher> sin gate (los dos montajes están gateados)', () => {
    const mounts = page.match(/<Searcher\b[^>]*\/>/g) ?? []
    expect(mounts.length).toBe(2)
    for (const m of mounts) {
      expect(m).toMatch(/v-if=/)
    }
  })

  it('el gate usa el MISMO breakpoint que las clases CSS de los wrappers (lg)', () => {
    // Si el v-if y el CSS divergieran, una combinación viewport/gate dejaría la
    // página sin buscador visible.
    expect(page).toMatch(/hidden lg:block/)
    expect(page).toMatch(/lg:hidden/)
  })
})
