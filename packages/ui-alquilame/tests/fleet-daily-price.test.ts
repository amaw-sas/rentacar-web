/**
 * SCEN-FD1 — alquilame Fleet "Alquiler Diario" price + label.
 *
 * Operator request: the daily price must be the low-season 1.000 km MONTHLY rate
 * prorated over a 30-day rental, shown as:
 *     Precio día en alquileres de 30 días
 *     $xxx.xxx
 *     Temporada Baja
 *
 * The arithmetic (round(monthly/30), season-low selection) is unit-tested in
 * packages/logic .../lowSeasonDailyPrice.test.ts. This guards that the component
 * (a) sources the daily figure from the shared low-season helper — not the raw
 * `one_day_price` column — and (b) renders the three-line label. The visual is
 * verified in the browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FLEET = join(__dirname, '..', 'app/components/home/Fleet.vue')

describe('SCEN-FD1: Fleet daily price is the 30-day low-season derivation', () => {
  const src = readFileSync(FLEET, 'utf-8')

  it('uses the shared lowSeasonDailyFrom30 helper for the daily figure', () => {
    expect(src).toMatch(/lowSeasonDailyFrom30/)
  })

  it('no longer sources the daily figure from the raw one_day_price column', () => {
    expect(src).not.toMatch(/pickRepresentativeDailyPrice/)
    expect(src).not.toMatch(/\.one_day_price/)
  })

  it('renders the three-line daily label', () => {
    expect(src).toMatch(/alquileres de 30 días/)
    expect(src).toMatch(/Temporada Baja/)
  })

  it('shows the tax note as "IVA incluido" (the 1k figure includes IVA, like monthly), never "+ IVA"', () => {
    expect(src).toMatch(/IVA incluido/)
    expect(src).not.toMatch(/\+ IVA/)
  })

  it('SCEN-FD2: clarifies that shorter rentals are quoted, and the CTA invites to quote', () => {
    // The daily figure is a 30-day rate; 1-29 days price differently and must be
    // quoted. The card says so on the daily tab and the CTA reflects it.
    expect(src).toMatch(/cotiza tus fechas/i)
    expect(src).toMatch(/Cotizar mis fechas/)
    expect(src).not.toMatch(/Ver disponibilidad/)
  })
})
