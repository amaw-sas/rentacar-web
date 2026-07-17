import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenarios captured: the reservation form lives inside a u-slideover (reka-ui
// DialogRoot, modal: true). Two back-button bugs stem from URL state leaking
// past submitForm:
//   1. `?reservar=<code>` query → Back auto-reopens the form slideover and
//      Dialog modal lock blocks the Searcher.
//   2. `/categoria/<code>` path segment → Back auto-reopens the resume
//      slideover with stale selectedCategory; a second submit hits the admin
//      with a consumed reference_token and is rejected as sin_disponibilidad.
// Fix: strip both the query/hash AND the /categoria/<code> segment via
// history.replaceState BEFORE calling navigateTo, so Back lands on the bare
// search URL and the user restarts from a fresh state.
//
// These tests are source-level to avoid mocking Pinia + Nuxt auto-imports;
// they guarantee the cleanup call exists before every navigation site, stays
// client-side guarded, and strips both URL pieces.

const source = readFileSync(
  fileURLToPath(new URL('../useStoreReservationForm.ts', import.meta.url)),
  'utf8',
)

const submitFormBlock = (() => {
  const start = source.indexOf('const submitForm =')
  expect(start).toBeGreaterThan(-1)
  const end = source.indexOf('\n  };', start) + '\n  };'.length
  return source.slice(start, end)
})()

describe('useStoreReservationForm — submitForm URL cleanup before navigate', () => {
  beforeAll(() => {
    expect(submitFormBlock).toContain('navigateTo')
  })

  it('declares a stripReservarParam helper that is client-guarded and strips both query and /categoria/<code>', () => {
    expect(source).toMatch(/const stripReservarParam = \(\) => \{/)
    const helperStart = source.indexOf('const stripReservarParam')
    const helperEnd = source.indexOf('\n  };', helperStart) + '\n  };'.length
    const helperBlock = source.slice(helperStart, helperEnd)
    expect(helperBlock).toContain('import.meta.client')
    expect(helperBlock).toContain('window.history.replaceState')
    // Must strip the /categoria/<code> path segment (second bug) and also
    // account for query/hash (first bug).
    expect(helperBlock).toMatch(/\\\/categoria\\\/\[\^\/\]\+\$/)
    expect(helperBlock).toContain('window.location.search')
    expect(helperBlock).toContain('window.location.hash')
  })

  it('strips reservar param before navigating on the success path', () => {
    // Order must be stripReservarParam() BEFORE navigateTo on the success
    // branch. Otherwise the URL keeps `?reservar=X` and Back re-opens the
    // slideover, blocking the Searcher.
    const successBranch = submitFormBlock.slice(
      submitFormBlock.indexOf('if (route)'),
      submitFormBlock.indexOf('// SCEN-322-E03'),
    )
    const stripIndex = successBranch.indexOf('stripReservarParam()')
    const navigateIndex = successBranch.indexOf('navigateTo(')
    expect(stripIndex).toBeGreaterThan(-1)
    expect(navigateIndex).toBeGreaterThan(-1)
    expect(stripIndex).toBeLessThan(navigateIndex)
  })

  it('strips reservar param before navigating on the business-unavailability error path only', () => {
    // Issue 322 PR2: technical errors no longer navigate; only the business
    // branch strip+navigate. Guard must wrap navigateTo('/sindisponibilidad').
    expect(submitFormBlock).toMatch(/isBusinessUnavailabilityRecordError/)
    const businessBranch = submitFormBlock.slice(
      submitFormBlock.indexOf('isBusinessUnavailabilityRecordError'),
    )
    const stripIndex = businessBranch.indexOf('stripReservarParam()')
    const navigateIndex = businessBranch.indexOf("navigateTo({ path: '/sindisponibilidad' })")
    expect(stripIndex).toBeGreaterThan(-1)
    expect(navigateIndex).toBeGreaterThan(-1)
    expect(stripIndex).toBeLessThan(navigateIndex)
  })
})
