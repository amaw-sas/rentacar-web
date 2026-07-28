/**
 * CityPullQuote — the white editorial breather between sections.
 *
 * Shows one sentence of the city's description as a centred pull-quote with a
 * large red opening quotation mark and a small red divider. Decorative: the
 * quote mark is aria-hidden, and the whole thing sits on white with generous
 * vertical padding so it reads as a pause, not a card.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'PullQuote.vue'),
  'utf-8',
)

describe('CityPullQuote.vue', () => {
  it('takes the quote text as a prop and renders it', () => {
    expect(SRC).toMatch(/defineProps<\{[\s\S]*quote/)
    expect(SRC).toMatch(/\{\{\s*quote\s*\}\}/)
  })

  it('is a white, centred breather (not a card)', () => {
    expect(SRC).toMatch(/bg-white/)
    expect(SRC).toMatch(/text-center/)
    expect(SRC).not.toMatch(/rounded-\[22px\]|border-\[7px\]/)
  })

  it('shows a decorative red opening quote mark, hidden from assistive tech', () => {
    expect(SRC).toMatch(/aria-hidden="true"/)
    expect(SRC).toMatch(/text-brand-600|text-red-600/)
    // A big quotation glyph (the character or an entity).
    expect(SRC).toMatch(/[""”]|&ldquo;|&rdquo;/)
  })

  it('renders the quote as a <blockquote> for semantics', () => {
    expect(SRC).toMatch(/<blockquote\b/)
  })

  it('is a COMPACT strip — small text, small padding (not a big block)', () => {
    // The QUOTE TEXT is modest (the decorative glyph may be larger).
    const bq = SRC.match(/<blockquote[\s\S]*?<\/blockquote>/)?.[0] ?? ''
    expect(bq).toMatch(/text-base|text-lg/)
    expect(bq).not.toMatch(/text-2xl|text-3xl/)
    // Light vertical padding on the strip.
    expect(SRC).toMatch(/py-[4-8]\b/)
    expect(SRC).not.toMatch(/py-1[0-9]|py-20/)
  })

  it('frames the text with an OPENING mark on the left and a CLOSING one on the right', () => {
    const bqAt = SRC.indexOf('<blockquote')
    const bqEnd = SRC.indexOf('</blockquote>')
    // Opening glyph before the blockquote, closing glyph after it.
    const openAt = SRC.indexOf('&ldquo;')
    const closeAt = SRC.indexOf('&rdquo;')
    expect(openAt, 'opening quote missing').toBeGreaterThan(-1)
    expect(closeAt, 'closing quote missing').toBeGreaterThan(-1)
    expect(openAt).toBeLessThan(bqAt)
    expect(closeAt).toBeGreaterThan(bqEnd)
  })

  it('is not boldface — plain weight for the whole strip', () => {
    // The operator asked for the separators without negrilla.
    expect(SRC).not.toMatch(/font-bold|font-semibold|font-medium/)
    expect(SRC).toMatch(/font-normal/)
  })
})

describe('CityPullQuote.vue — optional lead', () => {
  it('accepts an optional lead and renders it before the quote (colour, not bold)', () => {
    expect(SRC).toMatch(/lead\?:\s*string/)
    expect(SRC).toMatch(/v-if="lead"/)
    expect(SRC).toMatch(/\{\{\s*lead\s*\}\}/)
    // The lead is distinguished by brand colour, without boldface.
    const leadSpan = SRC.match(/<span v-if="lead"[^>]*>/)?.[0] ?? ''
    expect(leadSpan).toMatch(/text-brand-600|text-red-600/)
    expect(leadSpan).not.toMatch(/font-bold|font-semibold/)
  })
})
