import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured: the admin API column `reservations.total_insurance` is
// a boolean flag (after migration 032). The record payload must send the
// boolean directly — not the legacy 1/0 numeric coercion that caused the
// confirmation email to render "Seguro Total: $1".

const recordSource = readFileSync(
  fileURLToPath(new URL('../useRecordReservationForm.ts', import.meta.url)),
  'utf8',
)

const fieldsSource = readFileSync(
  fileURLToPath(
    new URL('../../utils/types/fields/FormRecordFields.ts', import.meta.url),
  ),
  'utf8',
)

describe('useRecordReservationForm — total_insurance payload', () => {
  it('sends total_insurance as boolean (haveTotalInsurance.value) — not numeric 1/0', () => {
    expect(recordSource).toContain('total_insurance: haveTotalInsurance.value,')
    expect(recordSource).not.toMatch(/total_insurance:\s*haveTotalInsurance\.value\s*\?\s*1\s*:\s*0/)
  })
})

describe('FormRecordFields — total_insurance type', () => {
  it('declares total_insurance as boolean | null, not number | null', () => {
    expect(fieldsSource).toMatch(/total_insurance\?:\s*boolean\s*\|\s*null/)
    expect(fieldsSource).not.toMatch(/total_insurance\?:\s*number\s*\|\s*null/)
  })
})
