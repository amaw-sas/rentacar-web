import { describe, expect, it } from 'vitest'
import {
  picoPlacaFacts,
  findPicoPlacaFact,
  type PicoPlacaFact,
} from '@rentacar-main/logic/utils'
import { useCityExpandedContent as logicCityContent } from '@rentacar-main/logic/composables/useCityContent'

import { useCityExpandedContent } from '~/data/cityContent'
import { getCityFAQs } from '~/data/cityFAQs'

/**
 * alquilame's half of the pico y placa guard (SCEN-003, SCEN-004, SCEN-008).
 *
 * alquilame keeps its own prose in `~/data/cityContent`, rewritten in its own
 * voice, while alquilatucarro and alquicarros read the shared
 * `logic/composables/useCityContent`. The audit of 2026-09-02 found both had
 * drifted identically, which is exactly what two hand-maintained copies of the
 * same facts do. The prose stays separate on purpose; what these tests forbid is
 * the two copies disagreeing about whether a restriction exists.
 *
 * The sibling guard for the shared source lives in
 * `packages/logic/src/utils/__tests__/picoPlacaFacts.test.ts`.
 */

const DENIES_MEASURE = /no\s+(tiene|tienen|hay|existe|está sujet|están sujet|les aplica|aplica)[^.]{0,40}pico y placa|pico y placa[^.]{0,30}no (existe|aplica|rige)\s+(para|en)\s+/i
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

const FACTS = Object.values(picoPlacaFacts) as PicoPlacaFact[]

function block(cityName: string): string {
  return useCityExpandedContent(cityName)?.drivingTips.picoPlaca ?? ''
}

function faqText(cityName: string): string {
  return getCityFAQs(cityName)
    .filter(faq => /pico y placa/i.test(`${faq.label} ${faq.content}`))
    .map(faq => faq.content)
    .join(' ')
}

describe('SCEN-004: alquilame never contradicts the record or itself', () => {
  it.each(FACTS)('$cityName — the city block agrees with the record', (fact) => {
    const text = block(fact.cityName)
    expect(text, `${fact.cityName} has no pico y placa block`).not.toBe('')
    expect(DENIES_MEASURE.test(text), `${fact.cityName} block denies the measure`).toBe(!fact.restricted)
  })

  it.each(FACTS)('$cityName — the FAQ agrees with the city block', (fact) => {
    const text = faqText(fact.cityName)
    expect(text, `${fact.cityName} has no pico y placa FAQ`).not.toBe('')
    expect(DENIES_MEASURE.test(text), `${fact.cityName} FAQ denies the measure`).toBe(!fact.restricted)
  })

it.each(FACTS.filter(f => f.restricted))('$cityName — a restricted city says so out loud', (fact) => {
    expect(AFFIRMS_MEASURE.test(faqText(fact.cityName)), `${fact.cityName} FAQ never affirms the measure`).toBe(true)
  })

  it.each(FACTS)('$cityName — only a restricted city publishes hours', (fact) => {
    expect(PUBLISHES_AN_HOUR.test(block(fact.cityName)), fact.cityName).toBe(fact.restricted)
  })
})

describe('SCEN-008: both brands tell the same story', () => {
  // Different prose, same conclusion. This is the guard that would have caught
  // the audit's finding at the moment it was introduced instead of months later.
  it.each(FACTS)('$cityName — alquilame and alquilatucarro agree', (fact) => {
    const mine = block(fact.cityName)
    const theirs = logicCityContent(fact.cityName)?.drivingTips.picoPlaca ?? ''

    expect(theirs, `${fact.cityName} missing from the shared source`).not.toBe('')
    expect(mine).not.toBe(theirs) // each brand keeps its own voice
    expect(DENIES_MEASURE.test(mine), `${fact.cityName} brands disagree on whether there is a restriction`)
      .toBe(DENIES_MEASURE.test(theirs))
  })

  it.each(FACTS.filter(f => f.restricted))('$cityName — both brands publish the same hours', (fact) => {
    const hours = (text: string) => (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).sort()
    expect(hours(block(fact.cityName))).toEqual(hours(logicCityContent(fact.cityName)!.drivingTips.picoPlaca))
  })
})

describe('the out-of-town plate, which is what a rental car carries', () => {
  it.each(['Santa Marta', 'Ibagué', 'Cúcuta'])('%s warns about a plate from another city', (cityName) => {
    expect(block(cityName)).toMatch(/matriculad|placa de otra|de otra ciudad|fuera del distrito|placa nacional/i)
  })
})

describe('every city page has a fact record behind it', () => {
  it('resolves a record for each of the 19 city content entries', () => {
    const missing = FACTS
      .filter(fact => !findPicoPlacaFact(fact.citySlug))
      .map(fact => fact.citySlug)
    expect(missing).toEqual([])
  })
})
