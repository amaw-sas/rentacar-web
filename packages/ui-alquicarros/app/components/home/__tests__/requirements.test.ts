/**
 * Requisitos para Alquilar — rediseño espejo (alquicarros).
 *
 * Encodes the observable contract (docs/specs/requisitos-redesign) as
 * static-source assertions; full runtime/visual verification (layout, photo
 * composition, console/network health) is done in the agent-browser pass.
 *
 *   SCEN-002 → 5 distinct semantic i-lucide-* icons, no uniform green check.
 *   SCEN-003 → the 5 requirement texts are verbatim.
 *   SCEN-001 → copy column pushed right (ml-auto) + inverted scrim (bg-linear-to-l from-white).
 *   SCEN-005 → wires the new requisitos-derecha.webp asset.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const src = readFileSync(join(__dirname, '..', 'Requirements.vue'), 'utf-8')

const REQUIREMENT_TEXTS = [
  'Realizar una reserva previa.',
  'Cédula de ciudadanía o pasaporte vigente',
  'Licencia de conducción vigente',
  'Tarjeta de crédito a nombre del conductor',
  'Ser mayor de 18 años',
]

const SEMANTIC_ICONS = [
  'i-lucide-calendar-check', // reserva previa
  'i-lucide-id-card', // documento de identidad
  'i-lucide-car-front', // licencia de conducción
  'i-lucide-credit-card', // tarjeta de crédito
  'i-lucide-user-round-check', // mayor de 18
]

describe('Requisitos — copy (SCEN-003 verbatim)', () => {
  it('keeps the 5 requirement texts unchanged, word for word', () => {
    for (const text of REQUIREMENT_TEXTS) {
      expect(src).toContain(text)
    }
  })

  it('is the #requisitos section with the design heading', () => {
    expect(src).toMatch(/id="requisitos"/)
    expect(src).toContain('Requisitos para Alquilar')
  })
})

describe('Requisitos — semantic bullet icons (SCEN-002)', () => {
  it('wires 5 distinct semantic lucide icons', () => {
    for (const icon of SEMANTIC_ICONS) {
      expect(src).toContain(icon)
    }
    expect(new Set(SEMANTIC_ICONS).size).toBe(5)
  })

  it('renders bullets via UIcon, not the old uniform green check', () => {
    expect(src).toMatch(/<UIcon\b/)
    expect(src).not.toContain('bg-green-500')
  })
})

describe('Requisitos — mirrored layout (SCEN-001)', () => {
  it('pushes the copy column to the right', () => {
    expect(src).toContain('ml-auto')
  })

  it('inverts the desktop scrim to white-on-right (bg-linear-to-l from-white)', () => {
    expect(src).toMatch(/bg-linear-to-l\s+from-white/)
    // v4 lesson: never the deprecated v3 alias
    expect(src).not.toMatch(/bg-gradient-to-/)
  })
})

describe('Requisitos — new photo asset (SCEN-005)', () => {
  it('wires the new subject-left background image', () => {
    expect(src).toContain('requisitos-derecha.webp')
  })
})
