import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenarios: docs/specs/2026-10-03-selector-licencia/scenarios/selector-licencia.scenarios.md
//
// SCEN-LIC-05. The license question is UI-only. The payload composable builds
// `partialData` by destructuring field by field, so the new store ref stays out
// by construction — this guard pins that construction so a future "while I'm
// here" edit doesn't quietly ship the field to a backend that never agreed to
// receive it.

const source = readFileSync(
  fileURLToPath(new URL('../useRecordReservationForm.ts', import.meta.url)),
  'utf8',
)

describe('SCEN-LIC-05 — the license answer never enters the reservation payload', () => {
  it('the payload composable never references the license field', () => {
    expect(source).not.toMatch(/tipoLicencia/i)
    expect(source).not.toMatch(/licen/i)
  })
})
