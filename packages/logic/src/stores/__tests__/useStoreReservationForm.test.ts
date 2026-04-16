import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured: the reservation form lives inside a u-slideover (reka-ui
// DialogRoot, modal: true). When submitForm redirects to /reservado,
// /pendiente or /sindisponibilidad, the URL still carries `?reservar=<code>`
// because it was written there via history.replaceState when the slideover
// opened (CategorySelectionSection.vue). On browser Back, that URL restores
// and the page's watcher auto-reopens the slideover, leaving the underlying
// Searcher non-interactive due to Dialog modal focus-trap even with
// `:overlay="false"`. Fix: strip the query string (and hash) via
// history.replaceState BEFORE calling navigateTo.
//
// These tests are source-level to avoid mocking Pinia + Nuxt auto-imports;
// they guarantee the cleanup call exists before every navigation site and
// stays client-side guarded.

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

  it('declares a stripReservarParam helper that is client-guarded', () => {
    expect(source).toMatch(/const stripReservarParam = \(\) => \{/)
    const helperStart = source.indexOf('const stripReservarParam')
    const helperEnd = source.indexOf('\n  };', helperStart) + '\n  };'.length
    const helperBlock = source.slice(helperStart, helperEnd)
    expect(helperBlock).toContain('import.meta.client')
    expect(helperBlock).toContain('window.history.replaceState')
    expect(helperBlock).toContain('window.location.pathname')
  })

  it('strips reservar param before navigating on the success path', () => {
    // Order must be stripReservarParam() BEFORE navigateTo on the success
    // branch. Otherwise the URL keeps `?reservar=X` and Back re-opens the
    // slideover, blocking the Searcher.
    const successBranch = submitFormBlock.slice(
      submitFormBlock.indexOf('if (dataRecord.value)'),
      submitFormBlock.indexOf('return;'),
    )
    const stripIndex = successBranch.indexOf('stripReservarParam()')
    const navigateIndex = successBranch.indexOf('navigateTo(')
    expect(stripIndex).toBeGreaterThan(-1)
    expect(navigateIndex).toBeGreaterThan(-1)
    expect(stripIndex).toBeLessThan(navigateIndex)
  })

  it('strips reservar param before navigating on the error path', () => {
    const errorBranch = submitFormBlock.slice(
      submitFormBlock.indexOf('else if (errorRecord.value)'),
    )
    const stripIndex = errorBranch.indexOf('stripReservarParam()')
    const navigateIndex = errorBranch.indexOf('navigateTo(')
    expect(stripIndex).toBeGreaterThan(-1)
    expect(navigateIndex).toBeGreaterThan(-1)
    expect(stripIndex).toBeLessThan(navigateIndex)
  })
})
