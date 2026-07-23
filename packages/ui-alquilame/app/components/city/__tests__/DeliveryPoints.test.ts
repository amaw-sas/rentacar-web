/**
 * F2 step 4 — #puntos-entrega restyle (issue #112, SCEN-F2-04).
 *
 * Static-source assertions over DeliveryPoints.vue (mirrors the F1 home tests):
 * the runtime/visual check (real branch cards rendered on the city alias) is
 * deferred to the preview pass. Here we pin the contract:
 *   - iterates the REAL cityBranches via v-for (data preserved, not hardcoded).
 *   - the section only renders when there are branches (length guard).
 *   - keeps the canonical #puntos-entrega id.
 *   - gradient uses bg-linear-* (F0 lesson), never bg-gradient-to-*.
 *   - headings use a .heading-* utility (Plus Jakarta, F0-03).
 *   - light section → no [--ctx-text-primary:#fff] override (contrast lesson).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'DeliveryPoints.vue'),
  'utf-8',
)

describe('F2 delivery-points — real branches (SCEN-F2-04)', () => {
  it('iterates cityBranches with v-for keyed by branch.code', () => {
    expect(SRC).toMatch(/v-for="branch in cityBranches"/)
    expect(SRC).toMatch(/:key="branch\.code"/)
  })

  it('renders the real branch name and optional schedule (data preserved)', () => {
    expect(SRC).toContain('{{ branch.name }}')
    // schedule is a structured object (contract v2, #47) — render only the
    // derived `display`; guarded so an unconfigured `{}` shows no chip.
    expect(SRC).toMatch(/v-if="branch\.schedule\?\.display"/)
    expect(SRC).toContain('{{ branch.schedule.display }}')
  })

  it('receives cityBranches (and city) as props, typed BranchData[]', () => {
    expect(SRC).toMatch(/cityBranches:\s*BranchData\[\]/)
    expect(SRC).toMatch(/city\?:\s*City/)
  })

  it('titles the section "Sedes en {city}"', () => {
    expect(SRC).toContain('Sedes en {{ city?.name }}')
    expect(SRC).not.toContain('Entrega del vehículo en')
  })
})

describe('F2 delivery-points — length guard', () => {
  it('only renders the section when there are branches', () => {
    expect(SRC).toMatch(/v-if="cityBranches\.length > 0"/)
  })

  it('keeps the canonical #puntos-entrega id', () => {
    expect(SRC).toMatch(/id="puntos-entrega"/)
  })
})

describe('F2 delivery-points — F0/F1 styling lessons', () => {
  it('uses bg-linear-* for gradients, never the v3 bg-gradient-to- alias', () => {
    expect(SRC).toMatch(/bg-linear-to-/)
    expect(SRC).not.toContain('bg-gradient-to-')
  })

  it('headings adopt a brand heading utility (Plus Jakarta, F0-03)', () => {
    // Title uses font-heading + the golden size ramp (heading-section renders at
    // the wrong golden size, so section titles moved off it — see home parity).
    expect(SRC).toMatch(/font-heading/)
    expect(SRC).toMatch(/heading-card/)
  })

  it('is a light section — no forced white text override', () => {
    // [--ctx-text-primary:#fff] is only for dark/red sections (F1 contrast lesson)
    expect(SRC).not.toContain('[--ctx-text-primary:#fff]')
  })
})
