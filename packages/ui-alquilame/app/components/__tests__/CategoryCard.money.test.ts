import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * issue 322 SCEN-322-M05 — la card de alquilame debe sembrar Seguro Total desde la URL.
 * Sin esto, path deep-link + "Solicitar" pisa el store con Básico.
 */
const source = readFileSync(
  fileURLToPath(new URL('../CategoryCard.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-M05 — CategoryCard siembra Seguro Total desde la URL', () => {
  it('lee seguro=total de la URL cuando el código de la card coincide', () => {
    expect(source).toMatch(/readSeguroTotalFromUrl/)
    expect(source).toMatch(/withTotalCoverage\.value\s*=\s*true/)
  })

  it('goNextStep no escribe el store a mano (single source = watcher del section)', () => {
    const goNext =
      source.match(/function goNextStep\(\)[\s\S]*?\n\}/)?.[0] ?? ''
    expect(goNext).toMatch(/emit\(/)
    expect(goNext).not.toMatch(/haveTotalInsurance\.value\s*=/)
    expect(goNext).not.toMatch(/selectedMonthlyMileage\.value\s*=/)
  })
})
