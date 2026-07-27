import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Bug guard: the "Dto Hoy {{ getDiscount }} %" badge in the reservation summary
 * rendered "Dto Hoy NaN %" on monthly reservations. Root cause: the badge in
 * ReservationResume.vue had no v-if, unlike its sibling (the struck base price)
 * and unlike CategoryCard.vue:67 — both gated by hasDiscount(). Monthly
 * availability carries vehicleDayCharge = coverageUnitCharge = 0, so getDiscount
 * divides 0/0 → NaN.
 *
 * Cross-brand structural guard (mirrors brand-tsconfig-hygiene): the badge must
 * be gated by hasDiscount() in all three brands, and getDiscount must never be
 * able to emit "NaN". See docs/specs/monthly-discount-badge/scenarios.
 */

// alquicarros dropped the dead grid ReservationResume (issue 322 PR6); wizard
// summary is the live surface there.
const BRANDS = ['ui-alquilatucarro', 'ui-alquilame'] as const

const readBrandFile = (brand: string, rel: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../${brand}/${rel}`, import.meta.url)),
    'utf8',
  )

const logicSource = readFileSync(
  fileURLToPath(new URL('../composables/useCategory.ts', import.meta.url)),
  'utf8',
)

describe('reservation summary discount badge gate (monthly NaN bug)', () => {
  // SCEN-D01: the badge must be gated so it does not appear when there is no
  // daily discount (which includes every monthly reservation).
  for (const brand of BRANDS) {
    it(`${brand} ReservationResume gates the "Dto Hoy" badge with hasDiscount()`, () => {
      const vue = readBrandFile(brand, 'app/components/ReservationResume.vue')
      const idx = vue.indexOf('Dto Hoy')
      expect(idx, `${brand}: "Dto Hoy" badge not found`).toBeGreaterThan(-1)

      // The badge's OWN wrapping element must carry the hasDiscount() guard —
      // not a sibling. Scope the window to just the badge's enclosing element by
      // starting at the previous closing tag (the struck-price </div> above),
      // so the struck-price's own v-if is excluded.
      const prevClose = Math.max(
        vue.lastIndexOf('</div>', idx),
        vue.lastIndexOf('</span>', idx),
      )
      const badgeElement = vue.slice(prevClose, idx)
      expect(
        badgeElement.includes('v-if="hasDiscount()"'),
        `${brand}: "Dto Hoy" badge is rendered unconditionally — must be gated by v-if="hasDiscount()"`,
      ).toBe(true)
    })
  }

  // SCEN-D03: getDiscount must never produce the string "NaN" — defense in depth
  // for a presentation function, even if the template gate is ever removed.
  it('getDiscount guards against a zero/non-finite base (no NaN)', () => {
    const start = logicSource.indexOf('const getDiscount = computed')
    expect(start, 'getDiscount computed not found').toBeGreaterThan(-1)
    const end = logicSource.indexOf('\n   });', start)
    const block = logicSource.slice(start, end)

    // Accept any explicit guard against the 0/0 → NaN path: a finite check, a
    // zero-base early return, or a NaN check.
    const hasGuard =
      /Number\.isFinite/.test(block) ||
      /isNaN/.test(block) ||
      /initial\s*===?\s*0/.test(block) ||
      /initial\s*<=\s*0/.test(block) ||
      /\?\s*0\s*:/.test(block) // ternary producing 0 when base is empty
    expect(
      hasGuard,
      'getDiscount must guard the 0/0 division so it cannot format "NaN"',
    ).toBe(true)
  })
})

/**
 * SCEN-W1: the struck base price must never render when there is no real
 * discount. getDailyBasePrice falls back to vehicleDayCharge +
 * coverageUnitCharge when hasDiscount() is false — the exact figure already
 * printed right below it — so an ungated struck price paints a phantom "$ X"
 * crossed out over an identical "$ X". This also protects the price-anchor
 * pilot, where capping discountAmount below coverageUnitCharge flips
 * hasDiscount() to false on live quotes.
 *
 * Anchored on the currencyDailyBasePrice interpolation rather than on
 * getDiscount so this describe never overlaps the badge guard above.
 */
const STRUCK_PRICE_SURFACES = [
  ['ui-alquilame', 'app/components/CategoryCard.vue'],
  ['ui-alquilatucarro', 'app/components/CategoryCard.vue'],
  ['ui-alquilame', 'app/components/ReservationResume.vue'],
  ['ui-alquilatucarro', 'app/components/ReservationResume.vue'],
] as const

describe('struck base price gate', () => {
  for (const [brand, rel] of STRUCK_PRICE_SURFACES) {
    it(`${brand} ${rel.split('/').pop()} gates the struck base price`, () => {
      const vue = readBrandFile(brand, rel)
      const idx = vue.indexOf('{{ currencyDailyBasePrice }}')
      expect(
        idx,
        `${brand}/${rel}: struck base price interpolation not found`,
      ).toBeGreaterThan(-1)

      // The interpolation's OWN enclosing element must carry the guard, not a
      // sibling: walk back to the nearest '<' and read that opening tag alone.
      const tagStart = vue.lastIndexOf('<', idx)
      const openingTag = vue.slice(tagStart, vue.indexOf('>', tagStart) + 1)

      // Both discount predicates are accepted. hasDiscount() is what the shared
      // composable exposes today; hasDiscountToShow is the monthly-aware
      // successor landing with the alquilame reskin. The invariant under test is
      // that SOME discount gate is present — pinning one predicate would make
      // this guard fight that in-flight work instead of protecting SCEN-W1.
      expect(
        /v-if="hasDiscount(\(\)|ToShow)"/.test(openingTag),
        `${brand}/${rel}: struck base price renders unconditionally (opening tag: ${openingTag})`,
      ).toBe(true)
    })
  }
})
