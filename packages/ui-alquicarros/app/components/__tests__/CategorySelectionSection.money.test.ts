import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue 322 PR1 — paridad del grid muerto de alquicarros.
 * Runtime real del dinero mensual/seguro en alquicarros = wizard
 * (docs/specs/alquicarros-mensualidad/). Este archivo evita que el grid copiado
 * reintroduzca el bug si alguien lo vuelve a montar.
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
})

describe('SCEN-322-M04/M05 — Seguro Total en la URL (paridad grid)', () => {
  it('lee seguro (route + location) y escribe seguro=total', () => {
    expect(source).toMatch(/readSeguroTotalFromUrl/)
    expect(source).toMatch(/params\.set\(['"]seguro['"],\s*['"]total['"]\)/)
  })
})
