/**
 * Turn a city's `description` into up to three editorial pull-quotes, used as
 * white breather separators between sections on the city landing.
 *
 * Every city description follows the same shape: an identity sentence, a
 * "pick up your car + what to visit" sentence, a commercial offer sentence
 * ("sin anticipos… hasta 60% de descuento…"), and a short closing line. The
 * offer sentence is sales copy, not something "someone would say about the
 * city", so it is dropped wherever it sits. From what remains we take the
 * first, the second and the LAST sentence — which for a 4-sentence description
 * is exactly the identity, the pickup and the closer.
 *
 * No new copy is authored: these are the SAME sentences already shown in the
 * old #descripcion block, just re-presented, so the page keeps its indexable
 * per-city text.
 */

// A sentence boundary: terminal punctuation, whitespace, then an uppercase
// letter or an opening ¿/¡. "2.600 metros" is NOT split because the period
// there is followed by a digit, not whitespace.
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/

// Offer/sales sentences to exclude from the quotes.
const OFFER = /anticipos|descuento|%/i

export function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_BOUNDARY)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function cityPullQuotes(description: string | null | undefined): string[] {
  if (!description) return []
  const kept = splitSentences(description).filter((s) => !OFFER.test(s))
  if (kept.length <= 3) return kept
  // More than three non-offer sentences: keep the opening two and the closer.
  return [kept[0]!, kept[1]!, kept[kept.length - 1]!]
}
