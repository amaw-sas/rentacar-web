import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  picoPlacaFacts,
  findPicoPlacaFact,
  formatSpanishDate,
  picoPlacaVerifiedLabel,
} from '../picoPlacaFacts'
import { useCityExpandedContent } from '../../composables/useCityContent'
import { getCityFAQs } from '../../composables/useCityFAQs'

/**
 * Guards for the pico y placa audit of 2026-09-02 (SCEN-001…SCEN-008).
 *
 * These do not check that the prose is well written. They check the two things
 * that actually cost money when they drift:
 *
 *   1. A page may not deny a restriction the authority is enforcing, and may not
 *      invent one that does not exist.
 *   2. The city block and that same page's FAQ may not disagree with each other.
 *
 * Both are decided against `picoPlacaFacts`, the single shared record.
 */

/**
 * Matches a sentence that denies the measure exists at all.
 *
 * Deliberately narrow. The weekend clause every restricted city carries —
 * "no rige los sábados, domingos ni festivos" — must NOT match, or every
 * restricted city would look like a denial. That is why the corrected prose says
 * "no rige" / "no aplica los fines de semana" and never repeats the phrase
 * "pico y placa" inside the weekend sentence.
 */
const DENIES_MEASURE = /no\s+(tiene|tienen|hay|existe|está sujet|están sujet|les aplica|aplica)[^.]{0,40}pico y placa|pico y placa[^.]{0,30}no (existe|aplica|rige)\s+(para|en)\s+/i

/** Any published clock time, e.g. "7:00" or "18:30". */
const PUBLISHES_AN_HOUR = /\b\d{1,2}:\d{2}\b/
/**
 * A restricted city's FAQ has to say yes out loud.
 *
 * Without this, a denial phrased around the words — Santa Marta's old answer was
 * "No. Los carros particulares no tienen esa limitación" — slips past
 * DENIES_MEASURE untouched, because it never says "pico y placa". Requiring an
 * explicit affirmation closes that hole: an answer cannot both deny the measure
 * and assert it.
 */
// `\bsí\b` does NOT work here: in JavaScript regex `í` is not a word
// character, so the trailing boundary never matches and every affirmation
// reads as a denial. Match on the surrounding characters instead.
const AFFIRMS_MEASURE = /(?:^|[^a-zá-úñ])s\u00ed(?![a-zá-úñ])/i

const CITY_NAMES = Object.values(picoPlacaFacts).map(f => f.cityName)

function picoPlacaFAQText(cityName: string): string {
  // `getCityFAQs`, not `useCityFAQs`: the composable reaches for Nuxt's
  // `useState` to enrich answers with branch data, which the FAQ text we assert
  // on does not depend on. The pure accessor is the same content without the
  // framework.
  return getCityFAQs(cityName)
    .filter(faq => /pico y placa/i.test(`${faq.label} ${faq.content}`))
    .map(faq => faq.content)
    .join(' ')
}

describe('picoPlacaFacts — the shared record', () => {
  it('covers every city the brands publish a page for', () => {
    expect(Object.keys(picoPlacaFacts)).toHaveLength(19)
  })

  it('resolves a fact from either the slug or the display name', () => {
    expect(findPicoPlacaFact('santa-marta')?.cityName).toBe('Santa Marta')
    expect(findPicoPlacaFact('Santa Marta')?.citySlug).toBe('santa-marta')
    expect(findPicoPlacaFact('Cúcuta')?.citySlug).toBe('cucuta')
    expect(findPicoPlacaFact('Ciudad Inventada')).toBeUndefined()
  })

  it('records the two cities whose decree the site used to deny', () => {
    expect(picoPlacaFacts['cartagena']?.restricted).toBe(true)
    expect(picoPlacaFacts['santa-marta']?.restricted).toBe(true)
  })

  it('records the five cities whose restriction the site used to invent', () => {
    for (const slug of ['barranquilla', 'soledad', 'valledupar', 'neiva', 'palmira']) {
      expect(picoPlacaFacts[slug]?.restricted, slug).toBe(false)
    }
  })
})

describe('SCEN-006: the data cannot go stale in silence', () => {
  afterEach(() => { vi.useRealTimers() })

  it('passes today', () => {
    const overdue = Object.values(picoPlacaFacts)
      .filter(f => f.reviewBy < new Date().toISOString().slice(0, 10))
      .map(f => `${f.cityName} venció el ${f.reviewBy} — reviselo en: ${f.source}`)
    expect(overdue).toEqual([])
  })

  it('fails, naming the city, once a review deadline has passed', () => {
    // Manizales carries the shortest horizon in the table: the earthquake measure
    // ends 2026-09-15. One day later the guard must be the thing that notices,
    // because nothing on the live site will.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z'))

    const overdue = Object.values(picoPlacaFacts)
      .filter(f => f.reviewBy < new Date().toISOString().slice(0, 10))
      .map(f => f.cityName)

    expect(overdue).toContain('Manizales')
  })

  it('gives a temporary measure a shorter horizon than an ordinary decree', () => {
    expect(picoPlacaFacts['manizales']!.reviewBy).toBe('2026-09-15')
    expect(picoPlacaFacts['pereira']!.reviewBy).toBe('2026-09-30')
    expect(picoPlacaFacts['manizales']!.reviewBy < picoPlacaFacts['bogota']!.reviewBy).toBe(true)
  })
})

describe('SCEN-004: alquilatucarro never contradicts the record or itself', () => {
  it.each(CITY_NAMES)('%s — the city block agrees with the record', (cityName) => {
    const fact = findPicoPlacaFact(cityName)!
    const block = useCityExpandedContent(cityName)?.drivingTips.picoPlaca ?? ''

    expect(block, `${cityName} has no pico y placa block`).not.toBe('')
    expect(DENIES_MEASURE.test(block), `${cityName} block denies the measure`).toBe(!fact.restricted)
  })

  it.each(CITY_NAMES)('%s — the FAQ agrees with the city block', (cityName) => {
    const fact = findPicoPlacaFact(cityName)!
    const faq = picoPlacaFAQText(cityName)

    expect(faq, `${cityName} has no pico y placa FAQ`).not.toBe('')
    expect(DENIES_MEASURE.test(faq), `${cityName} FAQ denies the measure`).toBe(!fact.restricted)
  })

  it.each(CITY_NAMES.filter(n => findPicoPlacaFact(n)!.restricted))('%s — a restricted city says so out loud', (cityName) => {
    expect(AFFIRMS_MEASURE.test(picoPlacaFAQText(cityName)), `${cityName} FAQ never affirms the measure`).toBe(true)
  })

  it.each(CITY_NAMES)('%s — only a restricted city publishes hours', (cityName) => {
    const fact = findPicoPlacaFact(cityName)!
    const block = useCityExpandedContent(cityName)?.drivingTips.picoPlaca ?? ''

    expect(PUBLISHES_AN_HOUR.test(block), `${cityName} publishes an hour range`).toBe(fact.restricted)
  })
})

describe('the out-of-town plate, which is what a rental car carries', () => {
  // The single most damaging omission the audit found: three cities punish a
  // foreign plate far harder than a local one, and no page said so.
  it.each(['Santa Marta', 'Ibagué', 'Cúcuta'])('%s warns about a plate from another city', (cityName) => {
    const block = useCityExpandedContent(cityName)?.drivingTips.picoPlaca ?? ''
    expect(block).toMatch(/matriculad|placa de otra|de otra ciudad|fuera del distrito|placa nacional/i)
  })
})

describe('formatSpanishDate', () => {
  it('renders the day Colombia is actually on, not UTC midnight', () => {
    // `new Date('2026-09-02')` is UTC midnight, which is 2026-09-01 19:00 in
    // Bogotá — the off-by-one-day bug the blog already shipped once.
    expect(formatSpanishDate('2026-09-02')).toBe('2 de septiembre de 2026')
    expect(formatSpanishDate('2026-01-01')).toBe('1 de enero de 2026')
    expect(formatSpanishDate('2026-12-31')).toBe('31 de diciembre de 2026')
  })

  it('returns undefined rather than a broken string for junk input', () => {
    expect(formatSpanishDate('ayer')).toBeUndefined()
    expect(formatSpanishDate('2026-13-01')).toBeUndefined()
    expect(formatSpanishDate('')).toBeUndefined()
  })
})

describe('SCEN-005: the reader can see how fresh the data is', () => {
  it('builds the verified line from the city slug or name', () => {
    expect(picoPlacaVerifiedLabel('cartagena')).toBe('Verificado el 2 de septiembre de 2026.')
    expect(picoPlacaVerifiedLabel('Santa Marta')).toBe('Verificado el 2 de septiembre de 2026.')
  })

  it('says nothing for a city it has no record for', () => {
    expect(picoPlacaVerifiedLabel('Leticia')).toBeUndefined()
  })
})
