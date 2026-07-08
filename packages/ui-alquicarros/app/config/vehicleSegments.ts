// Taxonomía de segmentos del wizard de reserva (alquicarros, marca-local).
//
// Agrupa las gamas (CategoryType) en segmentos comerciales para el Paso 2 nivel 1.
// Fuente de la agrupación: las etiquetas de tipo que el propio código ya asigna a
// cada gama (Fleet.vue: C=Compacto, F/FX=Sedán, G4/GC=Camioneta, LE=Premium),
// cerrada con el usuario en brainstorming. Los códigos no mapeados —GR (no se
// ofrece), las vans V/VP (no aplican) y cualquier otro como H, G, GX— caen en
// "otros" (fail-soft — nunca se pierde un carro).

// Types
import type { CategoryType } from '@rentacar-main/logic/utils'

export type SegmentId =
  | 'economicos'
  | 'sedanes'
  | 'camionetas-suv'
  | 'premium'
  | 'otros'

export interface VehicleSegment {
  id: SegmentId
  label: string
  /** Nombre de icono (colección lucide de Nuxt Icon). */
  icon: string
  gamaCodes: CategoryType[]
}

/** Segmentos nombrados, en el orden en que se presentan al cliente. */
export const VEHICLE_SEGMENTS: VehicleSegment[] = [
  {
    id: 'economicos',
    label: 'Compactos',
    icon: 'i-lucide-car',
    gamaCodes: ['C', 'CX'],
  },
  {
    id: 'sedanes',
    label: 'Sedanes',
    icon: 'i-lucide-car-front',
    gamaCodes: ['F', 'FX', 'FL', 'FU', 'FY'],
  },
  {
    id: 'camionetas-suv',
    label: 'Camionetas / SUV',
    icon: 'i-lucide-truck',
    gamaCodes: ['G4', 'GC', 'GL', 'GY'],
  },
  {
    id: 'premium',
    label: 'Camionetas de Lujo',
    icon: 'i-lucide-gem',
    gamaCodes: ['LE', 'LP', 'LU', 'LY'],
  },
]

/** Segmento paraguas para gamas no mapeadas. No está en `VEHICLE_SEGMENTS`. */
export const OTROS_SEGMENT: VehicleSegment = {
  id: 'otros',
  label: 'Otros',
  icon: 'i-lucide-circle-help',
  gamaCodes: [],
}

/**
 * Segmento al que pertenece una gama. Fail-soft: cualquier código no mapeado
 * (incluidos H, G, GR, GX, V, VP) devuelve 'otros', para que ningún vehículo
 * disponible desaparezca de la vista.
 */
export function segmentForCode(code: string): SegmentId {
  const match = VEHICLE_SEGMENTS.find((segment) =>
    segment.gamaCodes.includes(code as CategoryType),
  )
  return match ? match.id : 'otros'
}

export interface SegmentGroup {
  segment: VehicleSegment
  /** Códigos disponibles que caen en este segmento, en el orden de entrada. */
  codes: string[]
}

/**
 * Agrupa una lista de códigos disponibles en sus segmentos, en el orden
 * declarado de `VEHICLE_SEGMENTS`, y coloca los no mapeados en un grupo 'otros'
 * al final. Los segmentos sin códigos disponibles se omiten (SCEN-W-03: los
 * segmentos vacíos no se renderizan).
 */
export function groupBySegment(codes: string[]): SegmentGroup[] {
  const groups: SegmentGroup[] = []

  for (const segment of VEHICLE_SEGMENTS) {
    const inSegment = codes.filter((code) => segmentForCode(code) === segment.id)
    if (inSegment.length > 0) {
      groups.push({ segment, codes: inSegment })
    }
  }

  const otros = codes.filter((code) => segmentForCode(code) === 'otros')
  if (otros.length > 0) {
    groups.push({ segment: OTROS_SEGMENT, codes: otros })
  }

  return groups
}
