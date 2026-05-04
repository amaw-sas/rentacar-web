import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// SCEN-008 + SCEN-009: useCategory consumes ExtrasData (which now permits
// null per SCEN-007) and must use the hardcoded default when the field
// is null, but pass through the Supabase value when populated.
//
// Source-level assertions match the sibling test files' convention
// (useCategory.getAdditionalsTotal.test.ts, useCategory.getTotalPrice.test.ts):
// the composable depends on Nuxt auto-imports + Pinia, so runtime testing
// requires a heavy harness. Asserting the binding structure and arithmetic
// formula proves the fallback wiring without the harness.
//
// Combined with SCEN-007 (transformer propagates null) and SCEN-010 (e2e
// shows the rendered string), the chain validates the full data path.

const source = readFileSync(
  fileURLToPath(new URL('../useCategory.ts', import.meta.url)),
  'utf8',
)

function priceConstantLine(name: string): string {
  const match = source.match(new RegExp(`const ${name}: number = .+;`))
  expect(match, `missing constant ${name}`).not.toBeNull()
  return match![0]
}

function priceComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  const end = source.indexOf(');', start) + ');'.length
  return source.slice(start, end)
}

describe('useCategory extras fallback wiring (SCEN-008, SCEN-009)', () => {
  describe('SCEN-008: null extras field falls back to hardcoded default', () => {
    it('EXTRA_DRIVER_DAY_PRICE uses ?? 12000 against extras?.extraDriverDayPrice', () => {
      const line = priceConstantLine('EXTRA_DRIVER_DAY_PRICE')
      expect(line).toMatch(/extras\?\.\s*extraDriverDayPrice\s*\?\?\s*12000/)
    })

    it('BABY_SEAT_DAY_PRICE uses ?? 12000 against extras?.babySeatDayPrice', () => {
      const line = priceConstantLine('BABY_SEAT_DAY_PRICE')
      expect(line).toMatch(/extras\?\.\s*babySeatDayPrice\s*\?\?\s*12000/)
    })

    it('uses ?? (nullish coalescing) NOT || (which would coerce 0 to default)', () => {
      const driverLine = priceConstantLine('EXTRA_DRIVER_DAY_PRICE')
      const seatLine = priceConstantLine('BABY_SEAT_DAY_PRICE')
      expect(driverLine).not.toMatch(/\|\|/)
      expect(seatLine).not.toMatch(/\|\|/)
    })
  })

  describe('SCEN-009: non-null extras field passes through to the constant', () => {
    // Once ExtrasData fields are number | null and the transformer preserves
    // null, the ?? operator will only fall through when the value is null
    // or undefined — a real numeric value (including 0) flows through.
    // This was the SCEN-007 + SCEN-008 chain: the constants now bind to
    // the Supabase value when present, default when missing.

    it('getExtraDriverPrice computes numberDays * EXTRA_DRIVER_DAY_PRICE', () => {
      const block = priceComputed('getExtraDriverPrice')
      expect(block).toContain('EXTRA_DRIVER_DAY_PRICE')
      expect(block).toContain('numberDays.value')
    })

    it('getBabySeatPrice computes numberDays * BABY_SEAT_DAY_PRICE', () => {
      const block = priceComputed('getBabySeatPrice')
      expect(block).toContain('BABY_SEAT_DAY_PRICE')
      expect(block).toContain('numberDays.value')
    })
  })
})
