/**
 * Content gutter alignment.
 *
 * The logo, hero headline and footer put their horizontal padding INSIDE the
 * max-w-7xl container, so their content sits at 136px on a 1487px viewport. A
 * handful of card sections instead padded the full-width <section> and centred a
 * padding-less max-w-7xl inside it, landing their cards at 104px — 32px to the
 * LEFT of the logo, a visible misalignment.
 *
 * The rule: a section's horizontal padding lives on the max-w-7xl container, not
 * on the full-bleed <section>. That way the background still runs edge to edge
 * while the content lines up with the chrome above and below it.
 *
 * alquilame only — brand-local components. Fleet is shared with the home, so
 * this aligns the home too.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

const PAD = 'px-4 sm:px-6 lg:px-8'

const FILES = [
  'app/components/home/Fleet.vue',
  'app/components/city/Intro.vue',
  'app/components/city/DeliveryPoints.vue',
  'app/components/city/SeoContent.vue',
]

describe('content gutter — padding lives on max-w-7xl, not on the full-bleed section', () => {
  for (const rel of FILES) {
    const src = read(rel)
    const name = rel.split('/').pop()

    it(`${name}: no <section> carries the horizontal padding`, () => {
      const sections = src.match(/<section\b[^>]*>/g) ?? []
      for (const tag of sections) {
        expect(tag, `a <section> still pads full-bleed in ${name}`).not.toContain(PAD)
      }
    })

    it(`${name}: every max-w-7xl container carries the padding instead`, () => {
      const containers = src.match(/class="[^"]*\bmax-w-7xl mx-auto\b[^"]*"/g) ?? []
      expect(containers.length, `no max-w-7xl container in ${name}`).toBeGreaterThan(0)
      for (const c of containers) {
        expect(c, `a max-w-7xl container lacks the gutter in ${name}`).toContain(PAD)
      }
    })
  }
})
