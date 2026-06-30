import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Dogfood hallazgo #2: una fecha de recogida pasada disparaba el toast
// "Revisa la HORA de recogida" (mensaje que apunta al campo equivocado). El
// guard de doSearch debe diagnosticar con pickupTimingIssue y ramificar el
// mensaje: fecha pasada → "Revisa la fecha de recogida"; hoy con hora vencida →
// se conserva "Revisa la hora de recogida". Encodamos la estructura como
// source-text (precedente useSearch.searchLinkParams.test.ts); la verificación
// behavioral real es runtime + el test del predicado.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

describe('useSearch — past pickup DATE shows a date-specific message', () => {
  it('diagnoses the timing issue with pickupTimingIssue', () => {
    expect(source).toMatch(/pickupTimingIssue\(/)
  })

  it('branches a date-specific title/message for a past calendar date', () => {
    expect(source).toMatch(/Revisa la fecha de recogida/)
    expect(source).toMatch(/fecha de recogida igual o posterior a hoy/)
  })

  it('still keeps the hour-specific message for today with a passed hour', () => {
    expect(source).toMatch(/Revisa la hora de recogida/)
    expect(source).toMatch(/hora de recogida posterior a la hora actual/)
  })
})
