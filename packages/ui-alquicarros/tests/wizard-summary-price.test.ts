/**
 * Issue #373 — el precio mostrado en el resumen del wizard debe ser el que se
 * registra en la reserva. WizardSummary.vue mostraba `getTotalPrice` (renta SIN
 * IVA ni tasa), mientras el payload registra `getActualTotalPrice` (CON IVA +
 * tasa): ~31% de diferencia en reserva diaria.
 *
 * Estos tests encodan los OBSERVABLES de wiring a nivel de source (el mismo
 * estilo estático que reservation-wizard-steps.test.ts / ReservationResume.test.ts
 * de la marca hermana, sin entorno DOM en esta marca). La evidencia DOM/E2E viva
 * se satisface en runtime (agent-browser).
 *
 * Holdout: docs/specs/2026-07-23-issue-373-wizard-price-breakdown/scenarios/
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..') // → packages/ui-alquicarros
const summary = () =>
  readFileSync(join(ROOT, 'app/components/wizard/WizardSummary.vue'), 'utf-8')

describe('WizardSummary — desglose de precio (#373)', () => {
  it('SCEN-01: el total prominente se vincula al total a pagar con IVA + tasa (currencyTotalToPayWithAdditionals)', () => {
    const src = summary()
    // El total mostrado deriva del actual-total con IVA+tasa, no del getTotalPrice.
    expect(src).toMatch(/currencyTotalToPayWithAdditionals/)
    // El elemento prominente lleva el testid y se liga a totalLabel.
    expect(src).toMatch(/data-testid="wizard-total-a-pagar"/)
    // La etiqueta prominente dice "Total a pagar".
    expect(src).toMatch(/Total a pagar/)
  })

  it('SCEN-01: totalLabel ya NO se vincula a currencyTotalWithAdditionals como cifra a pagar (era el bug)', () => {
    const src = summary()
    // currencyTotalWithAdditionals sobrevive SOLO como "Total renta" (línea muted),
    // nunca como fuente de totalLabel. totalLabel debe salir de ToPayWithAdditionals.
    // Acotamos al CUERPO del computed totalLabel (hasta su primer cierre `})`).
    const start = src.indexOf('const totalLabel')
    const totalLabelBlock = src.slice(start, src.indexOf('})', start) + 2)
    expect(totalLabelBlock).toMatch(/currencyTotalToPayWithAdditionals/)
    expect(totalLabelBlock).not.toMatch(/currencyTotalWithAdditionals/)
  })

  it('SCEN-02: existe una línea "IVA + Tasa" ligada a currencyIvaAndTax', () => {
    const src = summary()
    expect(src).toMatch(/data-testid="wizard-iva-tax-line"/)
    expect(src).toMatch(/IVA \+ Tasa/)
    expect(src).toMatch(/currencyIvaAndTax/)
  })

  it('SCEN-02: la línea IVA + Tasa aparece ANTES del total a pagar', () => {
    const src = summary()
    expect(src.indexOf('data-testid="wizard-iva-tax-line"'))
      .toBeLessThan(src.indexOf('data-testid="wizard-total-a-pagar"'))
  })

  it('SCEN-02: existe la línea "Total renta" ligada a currencyTotalWithAdditionals', () => {
    const src = summary()
    expect(src).toMatch(/data-testid="wizard-total-renta"/)
    expect(src).toMatch(/Total renta/)
  })

  it('SCEN-04: el desglose renta / IVA se oculta en reserva mensual (haveMonthlyReservation)', () => {
    const src = summary()
    // El desglose per-day se gobierna por un flag que excluye la reserva mensual.
    expect(src).toMatch(/showRentBreakdown|showIvaLine|showBreakdown/)
    const flag = /const show(?:RentBreakdown|IvaLine|Breakdown)\s*=[\s\S]{0,260}/.exec(src)?.[0] ?? ''
    expect(flag).toMatch(/!\s*haveMonthlyReservation/)
  })

  it('SCEN-05: fail-closed más allá del horizonte — el total sigue mostrando "—" (regresión #313)', () => {
    const src = summary()
    // totalLabel devuelve null cuando isMonthlyPriceUnavailable; totalDisplay cae a '—'.
    expect(src).toMatch(/isMonthlyPriceUnavailable/)
    expect(src).toMatch(/const totalDisplay/)
    // El fail-closed produce '—' (sin "$") cuando no hay total.
    const disp = /const totalDisplay\s*=[\s\S]{0,180}/.exec(src)?.[0] ?? ''
    expect(disp).toMatch(/'—'/)
    expect(disp).toMatch(/totalLabel/)
  })

  it('SCEN-01: leyenda "Incluye IVA y tasa" acompaña al total a pagar', () => {
    expect(summary()).toMatch(/Incluye IVA y tasa/)
  })

  it('SCEN-06: los importes del resumen se anteponen el signo peso ($)', () => {
    const src = summary()
    // Las líneas de renta e IVA prefijan "$ " (moneyFormat no trae símbolo).
    expect(src).toMatch(/\$ \{\{ rentaLabel \}\}/)
    expect(src).toMatch(/\$ \{\{ ivaTaxLabel \}\}/)
    // El total prominente usa totalDisplay, que antepone "$ " al valor.
    const disp = /const totalDisplay\s*=[\s\S]{0,180}/.exec(src)?.[0] ?? ''
    expect(disp).toMatch(/\$ /)
    expect(src).toMatch(/data-testid="wizard-total-a-pagar"[^>]*>\{\{ totalDisplay \}\}/)
  })
})
