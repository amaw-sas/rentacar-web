import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// SCEN-005 (part 2): useCityProductSchema consumes useFetchRentacarData()
// directly. With the sentinel from SCEN-003, vehicleCategories is a
// frozen empty object. The composable must handle that without throwing.
//
// Source-level assertions: verify full optional chaining on every access
// to vehicleCategories[code]. Runtime testing requires mocking
// useAppConfig + useSchemaOrg.

const source = readFileSync(
  fileURLToPath(new URL('../useCityProductSchema.ts', import.meta.url)),
  'utf8',
)

describe('useCityProductSchema sentinel safety (SCEN-005 part 2)', () => {
  it('extracts vehicleCategories via destructuring', () => {
    expect(source).toMatch(/const\s*\{\s*vehicleCategories\s*\}\s*=\s*useFetchRentacarData\(\)/)
  })

  it('uses optional chaining on every step into vehicleCategories', () => {
    // vehicleCategories?.[code]?.modelos?.[0]?.image  — every level guarded
    expect(source).toMatch(/vehicleCategories\?\./)
    expect(source).toMatch(/\?\.modelos\?\./)
  })

  it('falls back to empty string when image lookup misses', () => {
    expect(source).toMatch(/\|\|\s*''/)
  })

  it('does not mutate vehicleCategories', () => {
    // Frozen sentinel would throw TypeError on mutation in strict mode.
    expect(source).not.toMatch(/vehicleCategories\[/)  // direct assignment
    expect(source).not.toMatch(/Object\.assign\(vehicleCategories/)
    expect(source).not.toMatch(/delete vehicleCategories/)
  })
})
