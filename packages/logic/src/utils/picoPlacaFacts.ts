/**
 * Pico y placa: one fact record per city, shared by the three brands.
 *
 * Why this exists: on 2026-09-02 an audit found 15 of the 19 city pages
 * publishing wrong pico y placa data — identically on alquilame and
 * alquilatucarro, because each brand kept its own hand-written prose and both
 * had drifted the same way. Two failure classes were expensive enough to earn a
 * permanent guard instead of a one-off correction:
 *
 *   - INVERSION. Cartagena and Santa Marta told renters there was no restriction
 *     while a decree was in force. The renter drives and gets fined 15 smdlv plus
 *     immobilisation — of our car.
 *   - SELF-CONTRADICTION. In Barranquilla, Soledad, Valledupar and Villavicencio
 *     the city block and the FAQ on the SAME page gave opposite answers.
 *
 * The prose stays per-brand (each has its own voice). What lives here is the part
 * that must never disagree: whether a restriction exists, when it was checked and
 * when someone has to check it again. `picoPlacaFacts.test.ts` fails the build if
 * a brand's prose contradicts `restricted`, if the two brands contradict each
 * other, or if `reviewBy` has passed.
 *
 * `reviewBy` is NOT a courtesy reminder. Before this file the data carried no date
 * at all, so it rotted in silence for months and was caught only by someone
 * reading the pages by hand. A failing test is the alarm that did not exist.
 */

export interface PicoPlacaFact {
  citySlug: string
  cityName: string
  /** Whether a pico y placa restriction applies to private cars today. */
  restricted: boolean
  /** ISO date the rule was last checked against the issuing authority. */
  verifiedAt: string
  /**
   * ISO date by which a human must re-check. Set to the day the decree or
   * rotation expires when the authority published one; otherwise ~120 days out.
   * A temporary measure gets a short horizon on purpose.
   */
  reviewBy: string
  /** The authority the figure came from, so the next check starts where this one did. */
  source: string
}

export const PICO_Y_PLACA_VERIFIED_AT = '2026-09-02'

export const picoPlacaFacts: Record<string, PicoPlacaFact> = {
  'bogota': {
    citySlug: 'bogota',
    cityName: 'Bogotá',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Secretaría Distrital de Movilidad de Bogotá',
  },
  'medellin': {
    citySlug: 'medellin',
    cityName: 'Medellín',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Medellín, rotación del segundo semestre de 2026',
  },
  'cali': {
    citySlug: 'cali',
    cityName: 'Cali',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Santiago de Cali, rotación vigente desde el 1 de julio de 2026',
  },
  // Rotation runs 30 June – 2 October 2026; the review deadline is its last day.
  'cartagena': {
    citySlug: 'cartagena',
    cityName: 'Cartagena',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-10-02',
    source: 'Decreto 0015 de 2026, Alcaldía Mayor de Cartagena de Indias',
  },
  'santa-marta': {
    citySlug: 'santa-marta',
    cityName: 'Santa Marta',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Decreto 213 del 8 de mayo de 2026, Alcaldía Distrital de Santa Marta',
  },
  'barranquilla': {
    citySlug: 'barranquilla',
    cityName: 'Barranquilla',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Barranquilla; sin medida para particulares desde julio de 2025',
  },
  'soledad': {
    citySlug: 'soledad',
    cityName: 'Soledad',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'IMTTRASOL; el Decreto 288 de 2017 nunca cubrió carros particulares',
  },
  // Rotation published for July–September 2026; re-check when it turns over.
  'bucaramanga': {
    citySlug: 'bucaramanga',
    cityName: 'Bucaramanga',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-09-30',
    source: 'Dirección de Tránsito de Bucaramanga, rotación de julio a septiembre de 2026',
  },
  'floridablanca': {
    citySlug: 'floridablanca',
    cityName: 'Floridablanca',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-09-30',
    source: 'Dirección de Tránsito y Transporte de Floridablanca, rotación de julio a septiembre de 2026',
  },
  // Temporary measure with no published end date — deliberately short horizon.
  'pereira': {
    citySlug: 'pereira',
    cityName: 'Pereira',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-09-30',
    source: 'Alcaldía de Pereira, medida temporal por emergencias viales desde el 18 de agosto de 2026',
  },
  'armenia': {
    citySlug: 'armenia',
    cityName: 'Armenia',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-11-30',
    source: 'Decreto 135 de 2026, Alcaldía de Armenia, prorrogado hasta noviembre',
  },
  // Earthquake measure, 1–15 September 2026. The shortest horizon in the table.
  'manizales': {
    citySlug: 'manizales',
    cityName: 'Manizales',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-09-15',
    source: 'Alcaldía de Manizales, medida temporal por el sismo (1 al 15 de septiembre de 2026)',
  },
  'cucuta': {
    citySlug: 'cucuta',
    cityName: 'Cúcuta',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Decreto 0212 de 2024, Alcaldía de Cúcuta',
  },
  'ibague': {
    citySlug: 'ibague',
    cityName: 'Ibagué',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Ibagué, rotación del segundo semestre de 2026',
  },
  'monteria': {
    citySlug: 'monteria',
    cityName: 'Montería',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Montería; sin medida para particulares',
  },
  'neiva': {
    citySlug: 'neiva',
    cityName: 'Neiva',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Neiva; sin medida ordinaria para particulares',
  },
  'palmira': {
    citySlug: 'palmira',
    cityName: 'Palmira',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Alcaldía de Palmira; sin medida permanente para particulares',
  },
  'valledupar': {
    citySlug: 'valledupar',
    cityName: 'Valledupar',
    restricted: false,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-31',
    source: 'Secretaría de Tránsito y Transporte de Valledupar; la Alcaldía ha desmentido la medida',
  },
  'villavicencio': {
    citySlug: 'villavicencio',
    cityName: 'Villavicencio',
    restricted: true,
    verifiedAt: PICO_Y_PLACA_VERIFIED_AT,
    reviewBy: '2026-12-22',
    source: 'Decreto 015 de 2026, Alcaldía de Villavicencio',
  },
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * "2026-09-02" → "2 de septiembre de 2026".
 *
 * Built by hand from the ISO parts rather than through `Date`, because
 * `new Date('2026-09-02')` parses as UTC midnight and renders as the previous day
 * for every visitor west of Greenwich — which is all of Colombia. That exact bug
 * already shipped once on the blog's article dates.
 */
export function formatSpanishDate(iso: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return undefined
  const [, year, month, day] = match
  const monthName = MESES[Number(month) - 1]
  if (!monthName) return undefined
  return `${Number(day)} de ${monthName} de ${year}`
}

/** The "Verificado el …" line shown under a city's pico y placa block. */
export function picoPlacaVerifiedLabel(citySlugOrName: string): string | undefined {
  const fact = findPicoPlacaFact(citySlugOrName)
  if (!fact) return undefined
  const date = formatSpanishDate(fact.verifiedAt)
  return date ? `Verificado el ${date}.` : undefined
}

/** Accepts either the slug ('santa-marta') or the display name ('Santa Marta'). */
export function findPicoPlacaFact(citySlugOrName: string): PicoPlacaFact | undefined {
  const direct = picoPlacaFacts[citySlugOrName]
  if (direct) return direct
  const normalized = citySlugOrName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
  return picoPlacaFacts[normalized]
}
