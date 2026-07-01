/**
 * Paso 1 — Taxonomía de segmentos del wizard (alquicarros).
 *
 * Encodes the unit-observable part of the holdout:
 *   - SCEN-W-03: las gamas se agrupan por segmento en el orden declarado y los
 *     segmentos sin vehículos disponibles NO se renderizan (groupBySegment omite
 *     los vacíos).
 *   - SCEN-W-04: toda gama de CategoryType resuelve a un segmento; las no mapeadas
 *     (H, G, GR, GX, V, VP) caen en "otros" — ningún vehículo se pierde.
 */
import { describe, it, expect } from 'vitest'
import {
  VEHICLE_SEGMENTS,
  segmentForCode,
  groupBySegment,
} from '~/config/vehicleSegments'

// The full CategoryType union (21 codes) — the taxonomy must cover ALL of them.
const ALL_CATEGORY_CODES = [
  'C', 'CX', 'F', 'FL', 'FX', 'FY', 'FU', 'LY', 'H', 'G', 'GC',
  'GL', 'GR', 'GY', 'G4', 'V', 'LE', 'LP', 'LU', 'VP', 'GX',
] as const

const NAMED_MAPPING: Record<string, string> = {
  C: 'economicos', CX: 'economicos',
  F: 'sedanes', FX: 'sedanes', FL: 'sedanes', FU: 'sedanes', FY: 'sedanes',
  G4: 'camionetas-suv', GC: 'camionetas-suv', GL: 'camionetas-suv', GY: 'camionetas-suv',
  LE: 'premium', LP: 'premium', LU: 'premium', LY: 'premium',
}

const UNMAPPED_CODES = ['H', 'G', 'GR', 'GX', 'V', 'VP']

describe('vehicleSegments — taxonomy (SCEN-W-03/04)', () => {
  it('declares the four named segments in a stable order', () => {
    expect(VEHICLE_SEGMENTS.map((s) => s.id)).toEqual([
      'economicos',
      'sedanes',
      'camionetas-suv',
      'premium',
    ])
  })

  it('maps each of the 15 named codes to its segment', () => {
    for (const [code, segment] of Object.entries(NAMED_MAPPING)) {
      expect(segmentForCode(code), `${code} → ${segment}`).toBe(segment)
    }
  })

  it('sends every unmapped code to "otros" (fail-soft — nothing is lost)', () => {
    for (const code of UNMAPPED_CODES) {
      expect(segmentForCode(code), `${code} → otros`).toBe('otros')
    }
  })

  it('resolves EVERY CategoryType code to some segment (no undefined)', () => {
    for (const code of ALL_CATEGORY_CODES) {
      const seg = segmentForCode(code)
      expect(seg, `${code} must resolve`).toBeTruthy()
      expect(['economicos', 'sedanes', 'camionetas-suv', 'premium', 'otros']).toContain(seg)
    }
  })

  it('does not double-map a code into two named segments', () => {
    const seen = new Set<string>()
    for (const seg of VEHICLE_SEGMENTS) {
      for (const code of seg.gamaCodes) {
        expect(seen.has(code), `${code} appears twice`).toBe(false)
        seen.add(code)
      }
    }
  })
})

describe('groupBySegment — hides empty segments, declared order (SCEN-W-03)', () => {
  it('groups available codes into their segments, in declared order, dropping empties', () => {
    // Availability with Económicos, Sedanes, Premium — but NO Camionetas/SUV.
    const groups = groupBySegment(['F', 'C', 'LE'])
    expect(groups.map((g) => g.segment.id)).toEqual(['economicos', 'sedanes', 'premium'])
    // camionetas-suv is absent because no available code belongs to it.
    expect(groups.map((g) => g.segment.id)).not.toContain('camionetas-suv')
  })

  it('places each code under the correct segment group', () => {
    const groups = groupBySegment(['C', 'CX', 'F'])
    const eco = groups.find((g) => g.segment.id === 'economicos')
    const sed = groups.find((g) => g.segment.id === 'sedanes')
    expect(eco?.codes.sort()).toEqual(['C', 'CX'])
    expect(sed?.codes).toEqual(['F'])
  })

  it('surfaces unmapped codes in an "otros" group placed last', () => {
    const groups = groupBySegment(['C', 'H'])
    expect(groups.map((g) => g.segment.id)).toEqual(['economicos', 'otros'])
    expect(groups.at(-1)?.segment.id).toBe('otros')
    expect(groups.at(-1)?.codes).toEqual(['H'])
  })

  it('returns no groups for empty availability', () => {
    expect(groupBySegment([])).toEqual([])
  })
})
