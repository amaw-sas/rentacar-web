import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue 322 PR2 — honest errors on submitForm.
 * Holdout: docs/specs/issue-322-pr2-honest-errors/scenarios/honest-errors-timeouts.scenarios.md
 */
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

describe('SCEN-322-E01 — fallo técnico NO navega a /sindisponibilidad', () => {
  it('usa isBusinessUnavailabilityRecordError para ramificar', () => {
    expect(submitFormBlock).toMatch(/isBusinessUnavailabilityRecordError/)
  })

  it('el navigate a /sindisponibilidad está DENTRO del guard de negocio', () => {
    expect(submitFormBlock).toMatch(
      /isBusinessUnavailabilityRecordError\(errorRecord\.value\)\)\s*\{\s*stripReservarParam\(\);\s*navigateTo\(\s*\{\s*path:\s*['"]\/sindisponibilidad['"]\s*\}\)/,
    )
    // Technical path must toast, not navigate to sindisponibilidad.
    expect(submitFormBlock).toMatch(/createReservationTechnicalErrorMessage/)
  })

  it('no hay navigateTo incondicional a sindisponibilidad en el else del error', () => {
    // Old bug: else if (errorRecord) { strip; navigateTo sindisponibilidad }
    expect(submitFormBlock).not.toMatch(
      /else if \(errorRecord\.value\) \{\s*stripReservarParam\(\);\s*navigateTo\(\{path:\s*["']\/sindisponibilidad["']\}\)/,
    )
  })
})

describe('SCEN-322-E03 — status desconocido bloquea reenvío', () => {
  it('declara formSubmitLocked y lo activa cuando route es null', () => {
    expect(source).toMatch(/formSubmitLocked/)
    expect(submitFormBlock).toMatch(/formSubmitLocked\.value\s*=\s*true/)
    expect(submitFormBlock).toMatch(/createReservationUnknownStatusMessage/)
  })

  it('early-return si ya está enviando o locked', () => {
    expect(submitFormBlock).toMatch(
      /if\s*\(\s*isSubmittingForm\.value\s*\|\|\s*formSubmitLocked\.value\s*\)\s*return/,
    )
  })

  it('libera isSubmittingForm en finally con releaseSubmit (spinner off, lock on)', () => {
    expect(submitFormBlock).toMatch(/let releaseSubmit = true/)
    expect(submitFormBlock).toMatch(/if \(releaseSubmit\) \{\s*isSubmittingForm\.value = false/)
    // Navigation paths set releaseSubmit = false
    expect(submitFormBlock).toMatch(/releaseSubmit = false/)
  })
})

describe('SCEN-322-E02 — éxito de negocio sigue navegando', () => {
  it('stripReservarParam antes de navigateTo en ruta mapeada', () => {
    expect(submitFormBlock).toMatch(/routeForReservationStatus/)
    const success = submitFormBlock.slice(
      submitFormBlock.indexOf('if (route)'),
      submitFormBlock.indexOf('// SCEN-322-E03') > 0
        ? submitFormBlock.indexOf('// SCEN-322-E03')
        : submitFormBlock.indexOf('formSubmitLocked'),
    )
    const stripIndex = success.indexOf('stripReservarParam()')
    const navigateIndex = success.indexOf('navigateTo(')
    expect(stripIndex).toBeGreaterThan(-1)
    expect(navigateIndex).toBeGreaterThan(-1)
    expect(stripIndex).toBeLessThan(navigateIndex)
  })
})
