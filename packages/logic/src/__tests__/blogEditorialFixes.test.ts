import { describe, expect, it } from 'vitest'

import { countAuthoringBrandMentions } from '../utils/brandContent'
import {
  applyEditorialFixes,
  EDITORIAL_REWRITES,
  REWRITTEN_SLUGS,
} from '../../../../scripts/blogEditorialFixes'

/**
 * Guards the issue #362 rewrites. `packages/logic` already reaches into
 * `scripts/` for `cities-data.json` (see seoContentHygiene), so the migration
 * table is asserted here rather than left untested in an uncovered directory.
 */
describe('blog editorial rewrites (issue #362)', () => {
  it('covers six sentences across five articles', () => {
    expect(EDITORIAL_REWRITES).toHaveLength(6)
    expect(REWRITTEN_SLUGS).toHaveLength(5)
  })

  it('removes the franchise name from every replacement', () => {
    for (const { to, slug } of EDITORIAL_REWRITES) {
      expect(countAuthoringBrandMentions(to), slug).toBe(0)
      expect(to, slug).not.toMatch(/Alquicarros|Alquilame/)
    }
  })

  it('starts from copy that actually names the franchise', () => {
    for (const { from, slug } of EDITORIAL_REWRITES) {
      expect(countAuthoringBrandMentions(from), slug).toBeGreaterThan(0)
    }
  })

  /**
   * Scoped to the six replacement strings, NOT to the articles they live in.
   * Other sentences in the same articles still use the first-person franchise
   * voice ("nuestras 19 sedes", "ofrecemos servicio de entrega") — that cleanup
   * is tracked separately. Naming this test after the articles would manufacture
   * confidence in a property the corpus does not have.
   */
  it('keeps the first-person franchise voice out of the replacement strings', () => {
    for (const { to, slug } of EDITORIAL_REWRITES) {
      expect(to, slug).not.toMatch(/\b(tenemos|ofrecemos|comparamos|mostramos)\b/)
    }
  })

  it('never leaves an empty or unchanged replacement', () => {
    for (const { from, to, slug } of EDITORIAL_REWRITES) {
      expect(to.trim(), slug).not.toBe('')
      expect(to, slug).not.toBe(from)
    }
  })

  it('keeps every rewrite unique so none silently shadows another', () => {
    const keys = EDITORIAL_REWRITES.map(({ slug, from }) => `${slug}::${from}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('preserves the markdown scaffolding around the rewritten copy', () => {
    const bold = EDITORIAL_REWRITES.filter(({ from }) => from.startsWith('**'))
    expect(bold.length).toBeGreaterThan(0)
    for (const { to, slug } of bold) {
      expect(to, slug).toMatch(/^\*\*/)
    }
  })

  describe('applyEditorialFixes', () => {
    it('rewrites a matching sentence and reports it as applied', () => {
      const [first] = EDITORIAL_REWRITES
      const body = `## Intro\n\n${first.from}\n\nOutro.`

      const result = applyEditorialFixes(body, first.slug)

      expect(result.text).toContain(first.to)
      expect(result.text).not.toContain(first.from)
      expect(result.applied).toContainEqual(first)
    })

    it('leaves surrounding lines byte-identical', () => {
      const [first] = EDITORIAL_REWRITES
      const body = `## Intro\n\n${first.from}\n\nOutro.`

      const result = applyEditorialFixes(body, first.slug)

      expect(result.text).toBe(`## Intro\n\n${first.to}\n\nOutro.`)
    })

    it('is idempotent — a second pass changes nothing', () => {
      const [first] = EDITORIAL_REWRITES
      const once = applyEditorialFixes(first.from, first.slug)
      const twice = applyEditorialFixes(once.text, first.slug)

      expect(twice.text).toBe(once.text)
      expect(twice.applied).toHaveLength(0)
    })

    it('reports an absent sentence as missing instead of failing silently', () => {
      const [first] = EDITORIAL_REWRITES

      const result = applyEditorialFixes('Contenido sin la frase original.', first.slug)

      expect(result.applied).toHaveLength(0)
      expect(result.missing).toContainEqual(first)
    })

    it('ignores rewrites registered for a different article', () => {
      const [first] = EDITORIAL_REWRITES
      const otherSlug = REWRITTEN_SLUGS.find((slug) => slug !== first.slug)!

      const result = applyEditorialFixes(first.from, otherSlug)

      expect(result.text).toBe(first.from)
      expect(result.applied).toHaveLength(0)
    })

    it('applies both rewrites when an article carries two', () => {
      const slug = 'precios-alquiler-carros-colombia'
      const rewrites = EDITORIAL_REWRITES.filter((rewrite) => rewrite.slug === slug)
      expect(rewrites).toHaveLength(2)

      const body = rewrites.map(({ from }) => from).join('\n\nTexto intermedio.\n\n')
      const result = applyEditorialFixes(body, slug)

      expect(result.applied).toHaveLength(2)
      expect(result.missing).toHaveLength(0)
      expect(countAuthoringBrandMentions(result.text)).toBe(0)
      expect(result.text).toContain('Texto intermedio.')
    })

    it('clears every franchise mention from a body built of all rewrites', () => {
      for (const slug of REWRITTEN_SLUGS) {
        const body = EDITORIAL_REWRITES.filter((rewrite) => rewrite.slug === slug)
          .map(({ from }) => from)
          .join('\n\n')

        expect(countAuthoringBrandMentions(applyEditorialFixes(body, slug).text), slug).toBe(0)
      }
    })

    it('leaves the generic phrase "alquila tu carro" untouched', () => {
      const body = 'Alquila tu carro hoy.\n\n## Alquila tu Carro para la Costa Caribe'

      for (const slug of REWRITTEN_SLUGS) {
        expect(applyEditorialFixes(body, slug).text).toBe(body)
      }
    })
  })
})
