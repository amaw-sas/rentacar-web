import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue 322 PR1 — dinero en deep-link / kilometraje / Seguro Total (grid alquilame).
 * Holdout: docs/specs/issue-322-pr1-money/scenarios/grid-deeplink-money.scenarios.md
 */
const source = readFileSync(
  fileURLToPath(new URL('../CategorySelectionSection.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-M01 — deep-link excluye el centinela unable (999999999)', () => {
  it('el find de preselección descarta estimatedTotalAmount === 999999999', () => {
    expect(source).toMatch(
      /categoryCode\s*===\s*codigo\s*&&\s*c\.estimatedTotalAmount\s*!==\s*999999999/,
    )
  })
})

describe('SCEN-322-M02/M03 — flags del form se DERIVAN de la instancia', () => {
  it('CategorySelectionSection escribe selectedMonthlyMileage', () => {
    expect(source).toMatch(/selectedMonthlyMileage/)
  })

  it('la derivación cubre kilometraje y seguro en el mismo watcher', () => {
    const watcher =
      source.match(/watch\(\s*\(\)\s*=>\s*\[[^\]]*withMileage[\s\S]*?\{[\s\S]*?\}\s*,\s*\{[^}]*immediate:\s*true/)?.[0] ??
      ''
    expect(watcher, 'watcher de derivación present').not.toBe('')
    expect(watcher).toMatch(/haveTotalInsurance\.value\s*=/)
    expect(watcher).toMatch(/selectedMonthlyMileage\.value\s*=/)
  })

  it('selectedMonthlyMileage se limpia cuando la reserva NO es mensual', () => {
    expect(source).toMatch(
      /haveMonthlyReservation\.value\s*&&\s*sc\s*\?[\s\S]{0,80}:\s*null/,
    )
  })
})

describe('SCEN-322-M04/M05/M06 — Seguro Total en la URL (hoy solo en alquilatucarro)', () => {
  it('lee seguroParam de la query', () => {
    expect(source).toMatch(/seguroParam/)
    expect(source).toMatch(/route\.query\.seguro/)
  })

  it('updateCategoriaUrl escribe seguro=total cuando hay Seguro Total', () => {
    expect(source).toMatch(/params\.set\(['"]seguro['"],\s*['"]total['"]\)/)
  })

  it('getReservationShareUrl incluye ?seguro=total solo con Seguro Total', () => {
    expect(source).toMatch(/haveTotalInsurance\.value\s*\?\s*['"]\?seguro=total['"]/)
  })

  it('al preseleccionar restaura withTotalCoverage desde seguro=total', () => {
    expect(source).toMatch(/seguroParam\.value\s*===\s*['"]total['"]/)
    expect(source).toMatch(/withTotalCoverage\.value\s*=\s*true/)
  })
})
