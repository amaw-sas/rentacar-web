import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured: on the post-search CategoryCard, ticking an additional
// service (extra driver, baby seat, wash) inflated the highlighted total.
// The tooltip (`actualTotalPriceTooltip` → getActualTotalPrice) and the
// persisted `total_price_to_pay` (useRecordReservationForm.ts) did NOT move,
// because neither branch sums additionals. Only `getTotalPrice`'s default
// branch (no total coverage, no monthly) was summing them — creating a
// card ↔ tooltip ↔ DB mismatch.
//
// Fix: default branch of getTotalPrice must return base + coverage + return
// fee only. Additionals keep their per-row currency refs for the checkbox
// labels but do NOT feed the highlighted total. Source-level test avoids
// mocking Nuxt auto-imports (useFetchRentacarData, useState) and Pinia.

const source = readFileSync(
  fileURLToPath(new URL('../useCategory.ts', import.meta.url)),
  'utf8',
)

function extractComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  const end = source.indexOf('\n   })', start) + '\n   })'.length
  return source.slice(start, end)
}

describe('useCategory.getTotalPrice — additionals must not inflate the card total', () => {
  const block = extractComputed('getTotalPrice')

  it('default branch (no total coverage, no monthly) sums only base + coverage + return fee', () => {
    const elseStart = block.lastIndexOf('else {')
    expect(elseStart).toBeGreaterThan(-1)
    const elseBlock = block.slice(elseStart)

    expect(elseBlock).toContain('totalAmount.value')
    expect(elseBlock).toContain('coverageTotalAmount.value')
    expect(elseBlock).toContain('returnFee')
  })

  it('does not add getExtraDriverPrice / getBabySeatPrice / getWashPrice to the card total in any branch', () => {
    expect(block).not.toContain('getExtraDriverPrice')
    expect(block).not.toContain('getBabySeatPrice')
    expect(block).not.toContain('getWashPrice')
  })

  it('does not read withExtraDriver / withBabySeat / withWash inside getTotalPrice', () => {
    expect(block).not.toContain('withExtraDriver.value')
    expect(block).not.toContain('withBabySeat.value')
    expect(block).not.toContain('withWash.value')
  })
})

describe('useCategory — additionals still expose their individual prices for per-row display', () => {
  it('keeps getExtraDriverPrice, getBabySeatPrice, getWashPrice computeds', () => {
    expect(source).toMatch(/const getExtraDriverPrice = computed/)
    expect(source).toMatch(/const getBabySeatPrice = computed/)
    expect(source).toMatch(/const getWashPrice = computed/)
  })

  it('exports the formatted per-row currency refs consumed by CategoryCard checkboxes', () => {
    expect(source).toContain('currencyExtraDriverPrice')
    expect(source).toContain('currencyBabySeatPrice')
    expect(source).toContain('currencyWashPrice')
  })

  it('exports hasAdditionalServices for downstream UI branching', () => {
    expect(source).toMatch(/const hasAdditionalServices = computed/)
  })
})
