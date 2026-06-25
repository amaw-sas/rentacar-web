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

  it('forces tight leading on the !text-xl value div (overrides text-xl built-in line-height)', () => {
    const valueClassMatches = source.match(/class="!text-xl[^"]*"/g) ?? []
    expect(valueClassMatches.length).toBeGreaterThanOrEqual(3)
    for (const cls of valueClassMatches) {
      expect(cls).toContain('!leading-none')
    }
  })
})

describe('ReservationResume — "Total a pagar" is the grand total (IVA + tasa + adicionales)', () => {
  it('SCEN-01: "Total a pagar" shows per-day OR whenever there are additionals (monthly w/o additionals stays hidden — it would duplicate "Total renta")', () => {
    expect(source).toMatch(
      /<div v-if="!haveMonthlyReservation \|\| hasAdditionalServices" class="text-right mt-3 leading-tight" data-testid="total-a-pagar-line">\s*<div class="text-sm font-bold">Total a pagar<\/div>/,
    )
  })

  it('SCEN-01: "Total a pagar" binds the all-in total with additionals included (currencyTotalToPayWithAdditionals)', () => {
    expect(source).toMatch(/data-testid="total-a-pagar-line"[\s\S]*?currencyTotalToPayWithAdditionals/)
    expect(source).toContain('currencyTotalToPayWithAdditionals,')
  })

  it('SCEN-01: clarifies the total includes IVA and tasa', () => {
    expect(source).toMatch(/Incluye IVA y tasa/)
  })

  it('SCEN-05: drops the per-additional breakdown (Conductor / Silla bebé / Lavado lines)', () => {
    expect(source).not.toMatch(/data-testid="extra-driver-line"/)
    expect(source).not.toMatch(/data-testid="baby-seat-line"/)
    expect(source).not.toMatch(/data-testid="wash-line"/)
    expect(source).not.toMatch(/Conductor: \$/)
  })

  it('SCEN-05: keeps the "Total adicionales" summary line', () => {
    expect(source).toMatch(/Total adicionales/)
    expect(source).toMatch(/currencyAdditionalsTotal/)
  })

  it('SCEN-05: removes the redundant "Total renta + adicionales" and "Total a pagar + adicionales" lines', () => {
    expect(source).not.toMatch(/Total renta \+ adicionales/)
    expect(source).not.toMatch(/Total a pagar \+ adicionales/)
    expect(source).not.toMatch(/data-testid="total-a-pagar-adicionales-line"/)
  })

  it('consumes the pre-formatted string from props.category (no inline .value math, which NaNs under prop ref-unwrapping)', () => {
    // The all-in total must come from useCategory, never recomputed in the
    // component — props.category unwraps refs, so getX.value is undefined → NaN.
    expect(source).not.toMatch(/getActualTotalPrice\.value/)
    expect(source).not.toMatch(/moneyFormat\(/)
  })
})

// IVA + tasa desglosado entre "Total renta" y "Total a pagar".
describe('ReservationResume — "IVA + TAX" breakdown line', () => {
  it('SCEN-03: renders an "IVA + TAX" line only on per-day, before "Total a pagar"', () => {
    expect(source).toMatch(
      /data-testid="iva-tax-line"[\s\S]*?IVA \+ TAX/,
    )
    expect(source).toMatch(
      /<div v-if="!haveMonthlyReservation"[^>]*data-testid="iva-tax-line">/,
    )
    expect(source.indexOf('data-testid="iva-tax-line"'))
      .toBeLessThan(source.indexOf('data-testid="total-a-pagar-line"'))
  })

  it('SCEN-03: binds the pre-formatted IVA + tasa amount (currencyIvaAndTax)', () => {
    expect(source).toMatch(/data-testid="iva-tax-line"[\s\S]*?currencyIvaAndTax/)
    expect(source).toContain('currencyIvaAndTax,')
  })

  it('SCEN-04: drops the misleading "No incluye IVA ni tasa admin" disclaimer', () => {
    expect(source).not.toMatch(/No incluye IVA ni tasa admin/)
  })
})
