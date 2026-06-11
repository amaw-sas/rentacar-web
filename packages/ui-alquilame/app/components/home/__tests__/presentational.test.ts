/**
 * F1 step03 — presentational home sections (issue #112).
 *
 * Encodes SCEN-F1-03 (partial) as static-source assertions; full runtime/visual
 * verification is deferred to the Vercel-preview pass:
 *   - The 3 new presentational components exist with their design copy:
 *       HowItWorks.vue  → 3 steps (Elige tu Ciudad y Vehículo · Reserva con
 *                         anticipación · Recoge y Disfruta).
 *       ValueProps.vue  → 4 props (Sin Anticipos · Flota Nueva · Asistencia 24/7
 *                         · Cobertura Nacional).
 *       Stats.vue       → stats band copy verbatim from the design (incl.
 *                         "desde 2015"), the one named hardcoded-copy exception.
 *   - ValueProps headline derives the brand name from `organization.brand`
 *     (no literal "Alquilame", no `franchise.shortname` lowercase usage).
 *   - No `bg-gradient-to-` anywhere (v4 lesson — must be `bg-linear-to-*`).
 *   - Headings adopt the `.heading-*` utilities (→ Plus Jakarta, closes F0-03).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HOME = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(HOME, rel), 'utf-8')
}

const howItWorks = read('HowItWorks.vue')
const valueProps = read('ValueProps.vue')
const stats = read('Stats.vue')

const ALL = [howItWorks, valueProps, stats]

describe('F1 step03 — HowItWorks.vue (3 steps)', () => {
  it('renders the 3 design steps with their titles', () => {
    expect(howItWorks).toContain('Elige tu Ciudad y Vehículo')
    expect(howItWorks).toContain('Reserva con anticipación')
    expect(howItWorks).toContain('Recoge y Disfruta')
  })

  it('is the #how-it-works section with the design header', () => {
    expect(howItWorks).toMatch(/id="how-it-works"/)
    expect(howItWorks).toContain('Cómo Funciona')
  })
})

describe('F1 step03 — ValueProps.vue (4 props)', () => {
  it('renders the 4 design value props', () => {
    expect(valueProps).toContain('Sin Anticipos')
    expect(valueProps).toContain('Flota Nueva')
    expect(valueProps).toContain('Asistencia 24/7')
    expect(valueProps).toContain('Cobertura Nacional')
  })

  it('headline derives the brand name from organization.brand', () => {
    // Reads the config brand and interpolates it into the headline.
    expect(valueProps).toMatch(/organization\.brand/)
    expect(valueProps).toMatch(/¿Por Qué Elegir \{\{\s*brand\s*\}\}\?/)
  })

  it('does NOT hardcode "Alquilame" in the headline copy', () => {
    expect(valueProps).not.toContain('¿Por Qué Elegir Alquilame')
    // The brand string is never inlined as a literal anywhere in the file.
    expect(valueProps).not.toContain('Alquilame')
  })

  it('does NOT use franchise.shortname (lowercase) for the brand', () => {
    expect(valueProps).not.toContain('shortname')
    expect(valueProps).not.toContain('franchise')
  })
})

describe('F1 step03 — Stats.vue (stats band, hardcoded-copy exception)', () => {
  it('renders the design stats labels', () => {
    expect(stats).toContain('Vehículos disponibles')
    expect(stats).toContain('Ciudades en Colombia')
    expect(stats).toContain('Años de experiencia')
  })

  it('carries the design copy verbatim, including "desde 2015"', () => {
    expect(stats).toContain('desde 2015')
  })
})

describe('F1 step03 — shared invariants', () => {
  it('no section uses the v3 bg-gradient-to- alias (must be bg-linear-to-*)', () => {
    for (const src of ALL) {
      expect(src).not.toMatch(/bg-gradient-to-/)
    }
  })

  it('every section headline adopts a .heading-* utility', () => {
    for (const src of ALL) {
      expect(src).toMatch(/heading-(hero|page|section|card|sub|label)/)
    }
  })
})
