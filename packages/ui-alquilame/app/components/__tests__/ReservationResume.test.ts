import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationResume.vue', import.meta.url)),
  'utf8',
)
const styles = readFileSync(
  fileURLToPath(
    new URL('../../assets/css/rentacar-main/reservation-resume.css', import.meta.url),
  ),
  'utf8',
)
const categoryNameRule = styles.match(
  /\.category-name\s*\{([\s\S]*?)\}/,
)?.[1] ?? ''

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

describe('ReservationResume — Gama heading ownership', () => {
  it('lets the template own Plus Jakarta and the red color without a heading-card token', () => {
    expect(source).toMatch(
      /class="category-name font-heading text-red-700" v-text="`Gama \$\{categoryCode\}`"/,
    )
    expect(source).not.toMatch(
      /class="category-name[^"]*\bheading-card\b/,
    )
  })

  it('keeps exactly the established 14px/700 size and weight in .category-name CSS', () => {
    expect(categoryNameRule).toMatch(/@apply mb-0 text-sm font-bold;/)
    expect(source).not.toMatch(
      /class="category-name[^"]*\b(?:text-sm|font-bold)\b/,
    )
  })

  it('does not override the template red with a CSS color utility', () => {
    expect(categoryNameRule).not.toMatch(
      /\btext-(?:black|white|gray|slate|neutral|red|brand)-/,
    )
  })
})
