import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationResume.vue', import.meta.url)),
  'utf8',
)

describe('ReservationResume — totals use tight leading so label and value sit close', () => {
  it('applies leading-tight to the Total adicionales block', () => {
    expect(source).toMatch(
      /class="text-right mt-3 leading-tight"[^<]*>\s*<div class="text-sm font-bold">Total adicionales<\/div>/,
    )
  })

  it('applies leading-tight to the Total renta block', () => {
    expect(source).toMatch(
      /class="text-right mt-3 leading-tight"[^<]*>\s*<div class="text-sm font-bold">Total renta<\/div>/,
    )
  })

  it('applies leading-tight to the Total renta + adicionales block', () => {
    expect(source).toMatch(
      /class="text-right mt-3 leading-tight"[^<]*>\s*<div class="text-sm font-bold">Total renta \+ adicionales<\/div>/,
    )
  })

  it('forces tight leading on the !text-xl value div (overrides text-xl built-in line-height)', () => {
    const valueClassMatches = source.match(/class="!text-xl[^"]*"/g) ?? []
    expect(valueClassMatches.length).toBeGreaterThanOrEqual(3)
    for (const cls of valueClassMatches) {
      expect(cls).toContain('!leading-none')
    }
  })
})
