/**
 * Alquicarros reskin — presentational home sections (port of the alquilame F1
 * home, re-skinned to NARANJA).
 *
 * Encodes the observable contract as static-source assertions; full runtime /
 * visual verification is deferred to the Vercel-preview pass:
 *   - The 3 new presentational components exist with their design copy:
 *       HowItWorks.vue  → 3 steps (Elige tu Ciudad y Vehículo · Reserva con
 *                         anticipación · Recoge y Disfruta).
 *       ValueProps.vue  → 4 props (Sin Anticipos · Flota Nueva · Asistencia 24/7
 *                         · Cobertura Nacional).
 *       Stats.vue       → stats band copy verbatim from the design (incl.
 *                         "desde 2015"), the one named hardcoded-copy exception.
 *   - ValueProps headline derives the brand name from `organization.brand`
 *     (no literal brand name, no `franchise.shortname` lowercase usage).
 *   - No `bg-gradient-to-` anywhere (v4 lesson — must be `bg-linear-to-*`).
 *   - Headings adopt the `.heading-*` / font-heading utilities.
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

describe('reskin — HowItWorks.vue (3 steps)', () => {
  it('renders the 3 redesigned steps with their titles', () => {
    expect(howItWorks).toContain('Elige ciudad y auto')
    expect(howItWorks).toContain('Reserva en minutos')
    expect(howItWorks).toContain('Recoge y conduce')
  })

  it('is the #how-it-works section with the design header', () => {
    expect(howItWorks).toMatch(/id="how-it-works"/)
    expect(howItWorks).toContain('Cómo Funciona')
  })

  it('renders each step via a line icon (UIcon), not a photo', () => {
    expect(howItWorks).toMatch(/<UIcon\b/)
    expect(howItWorks).not.toMatch(/<NuxtImg\b/)
    expect(howItWorks).not.toMatch(/<img\b/)
  })

  it('has the decorative numbered stepper rail', () => {
    expect(howItWorks).toContain('howitworks-stepper-test')
    expect(howItWorks).toMatch(/step-marker-/)
    expect(howItWorks).toMatch(/step-connector-/)
  })

  it('wires the 3 lucide step icons', () => {
    expect(howItWorks).toContain('i-lucide-map-pin')
    expect(howItWorks).toContain('i-lucide-calendar-check')
    expect(howItWorks).toContain('i-lucide-key')
  })

  it('preserves the trust footer', () => {
    expect(howItWorks).toContain('Seguridad • Transparencia • Soporte 24/7')
    expect(howItWorks).toContain('Estamos contigo en todo el proceso.')
  })
})

describe('reskin — ValueProps.vue (4 props)', () => {
  it('renders the 4 design value props', () => {
    expect(valueProps).toContain('Sin Anticipos')
    expect(valueProps).toContain('Flota Nueva')
    expect(valueProps).toContain('Asistencia 24/7')
    expect(valueProps).toContain('Cobertura Nacional')
  })

  it('headline derives the brand name from organization.brand', () => {
    expect(valueProps).toMatch(/organization\.brand/)
    expect(valueProps).toMatch(/¿Por Qué Elegir \{\{\s*brand\s*\}\}\?/)
  })

  it('does NOT hardcode a brand name in the headline copy', () => {
    expect(valueProps).not.toContain('¿Por Qué Elegir Alquicarros')
    expect(valueProps).not.toContain('¿Por Qué Elegir Alquilame')
    // No brand string is inlined as a literal anywhere in the file.
    expect(valueProps).not.toContain('Alquilame')
    expect(valueProps).not.toContain('Alquicarros')
  })

  it('does NOT use franchise.shortname (lowercase) for the brand', () => {
    expect(valueProps).not.toContain('shortname')
    expect(valueProps).not.toContain('franchise')
  })
})

describe('reskin — Stats.vue (stats band, hardcoded-copy exception)', () => {
  it('renders the design stats labels', () => {
    expect(stats).toContain('Vehículos disponibles')
    expect(stats).toContain('Ciudades en Colombia')
    expect(stats).toContain('Años de experiencia')
  })

  it('carries the design copy verbatim, including "desde 2015"', () => {
    expect(stats).toContain('desde 2015')
  })
})

describe('reskin — shared invariants', () => {
  it('no section uses the v3 bg-gradient-to- alias (must be bg-linear-to-*)', () => {
    for (const src of ALL) {
      expect(src).not.toMatch(/bg-gradient-to-/)
    }
  })

  it('every section headline adopts a brand heading utility (.heading-* or font-heading)', () => {
    for (const src of ALL) {
      expect(src).toMatch(/heading-(hero|page|section|card|sub|label)|font-heading/)
    }
  })
})
