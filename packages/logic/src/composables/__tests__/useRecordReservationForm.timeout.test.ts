import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const record = readFileSync(
  fileURLToPath(new URL('../useRecordReservationForm.ts', import.meta.url)),
  'utf8',
)
const availability = readFileSync(
  fileURLToPath(new URL('../useFetchCategoriesAvailabilityData.ts', import.meta.url)),
  'utf8',
)

describe('SCEN-322-E04/E05 — timeouts en cliente', () => {
  it('record $fetch lleva timeout RECORD_FETCH_TIMEOUT_MS', () => {
    expect(record).toMatch(/timeout:\s*RECORD_FETCH_TIMEOUT_MS/)
  })

  it('availability $fetch lleva timeout AVAILABILITY_FETCH_TIMEOUT_MS', () => {
    expect(availability).toMatch(/timeout:\s*AVAILABILITY_FETCH_TIMEOUT_MS/)
  })
})
