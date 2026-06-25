import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario: ReservationResume needs to show, when at least one additional
// service is ticked, a "Total adicionales" block (sum of the ticked extras)
// and a "Total renta + adicionales" block (base total + additionals).
// These are informative figures — rentacar-main does not charge additionals;
// they are paid directly to Localiza at pickup. Therefore getTotalPrice must
// remain untouched (covered by useCategory.getTotalPrice.test.ts) and the new
// sums must sit in their own computeds.
//
// Source-level assertions mirror the sibling suite so we do not need to mock
// Nuxt auto-imports or Pinia.

const source = readFileSync(
  fileURLToPath(new URL('../useCategory.ts', import.meta.url)),
  'utf8',
)

function extractComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  const semicolonEnd = source.indexOf(');', start)
  const braceEnd = source.indexOf('\n   })', start)
  const end =
    semicolonEnd !== -1 && (braceEnd === -1 || semicolonEnd < braceEnd)
      ? semicolonEnd + ');'.length
      : braceEnd + '\n   })'.length
  return source.slice(start, end)
}

describe('useCategory.getAdditionalsTotal — sums only ticked additionals', () => {
  const block = extractComputed('getAdditionalsTotal')

  it('gates each additional by its own flag (ternary with fallback 0)', () => {
    expect(block).toMatch(/withExtraDriver\.value\s*\?\s*getExtraDriverPrice\.value\s*:\s*0/)
    expect(block).toMatch(/withBabySeat\.value\s*\?\s*getBabySeatPrice\.value\s*:\s*0/)
    expect(block).toMatch(/withWash\.value\s*\?\s*getWashPrice\.value\s*:\s*0/)
  })

  it('does not read any field beyond the three additional prices and their flags', () => {
    expect(block).not.toContain('totalAmount.value')
    expect(block).not.toContain('coverageTotalAmount.value')
    expect(block).not.toContain('returnFee')
    expect(block).not.toContain('getTotalPrice')
  })
})

describe('useCategory.getTotalWithAdditionals — base total plus additionals', () => {
  const block = extractComputed('getTotalWithAdditionals')

  it('is the sum of getTotalPrice and getAdditionalsTotal', () => {
    expect(block).toContain('getTotalPrice.value')
    expect(block).toContain('getAdditionalsTotal.value')
  })

  it('does not touch the raw additional prices directly (routes through the aggregate)', () => {
    expect(block).not.toContain('getExtraDriverPrice.value')
    expect(block).not.toContain('getBabySeatPrice.value')
    expect(block).not.toContain('getWashPrice.value')
  })
})

describe('useCategory.getTotalToPayWithAdditionals — tax-inclusive total plus additionals', () => {
  const block = extractComputed('getTotalToPayWithAdditionals')

  it('is the sum of getActualTotalPrice (IVA + tasa included) and getAdditionalsTotal', () => {
    expect(block).toContain('getActualTotalPrice.value')
    expect(block).toContain('getAdditionalsTotal.value')
  })

  it('uses the actual (tax-inclusive) total, not the pre-tax getTotalPrice', () => {
    expect(block).not.toContain('getTotalPrice.value')
  })
})

describe('useCategory — formatted currency refs and public exports for the new totals', () => {
  it('exposes currencyTotalToPayWithAdditionals formatted through getFormattedPrice', () => {
    expect(source).toMatch(
      /const currencyTotalToPayWithAdditionals = computed<string>\(\(\) => getFormattedPrice\(getTotalToPayWithAdditionals\.value\)\)/,
    )
  })

  it('returns the tax-inclusive combined total and its currency ref from the composable', () => {
    const returnStart = source.indexOf('return {')
    const returnBlock = source.slice(returnStart)
    expect(returnBlock).toContain('getTotalToPayWithAdditionals')
    expect(returnBlock).toContain('currencyTotalToPayWithAdditionals')
  })
})

describe('useCategory — formatted currency refs and public exports for the additionals totals', () => {
  it('exposes currencyAdditionalsTotal formatted through getFormattedPrice', () => {
    expect(source).toMatch(
      /const currencyAdditionalsTotal = computed<string>\(\(\) => getFormattedPrice\(getAdditionalsTotal\.value\)\)/,
    )
  })

  it('exposes currencyTotalWithAdditionals formatted through getFormattedPrice', () => {
    expect(source).toMatch(
      /const currencyTotalWithAdditionals = computed<string>\(\(\) => getFormattedPrice\(getTotalWithAdditionals\.value\)\)/,
    )
  })

  it('returns the new computeds and their currency refs from the composable', () => {
    const returnStart = source.indexOf('return {')
    expect(returnStart).toBeGreaterThan(-1)
    const returnBlock = source.slice(returnStart)

    expect(returnBlock).toContain('getAdditionalsTotal')
    expect(returnBlock).toContain('getTotalWithAdditionals')
    expect(returnBlock).toContain('currencyAdditionalsTotal')
    expect(returnBlock).toContain('currencyTotalWithAdditionals')
  })
})
