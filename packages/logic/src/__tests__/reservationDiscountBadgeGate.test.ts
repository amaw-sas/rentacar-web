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
  // La compuerta esperada por marca. alquilame pasó a `hasDiscountToShow`, que
  // se DERIVA de getDiscount (`getDiscount.value !== "0"`): es estrictamente más
  // fuerte que `hasDiscount()`, porque ata la compuerta al mismo valor que se
  // pinta en vez de a un campo independiente (`discountAmount`) — que era justo
  // la separación que dejó pasar el NaN. Además permite que la píldora aparezca
  // en mensual, donde el ahorro es real y `discountAmount` llega nulo.
  const GATE_POR_MARCA: Record<string, string> = {
    'ui-alquilatucarro': 'v-if="hasDiscount()"',
    'ui-alquilame': 'v-if="hasDiscountToShow"',
  }

  for (const brand of BRANDS) {
    it(`${brand} ReservationResume gates the "Dto Hoy" badge`, () => {
      const vue = readBrandFile(brand, 'app/components/ReservationResume.vue')
      // Ancla en el VALOR, no en el copy: alquilame pasó de "Dto Hoy {{ x }} %"
      // a "Hoy con {{ x }}% Dto." al espejar la card, y el invariante no es cómo
      // se redacta la píldora sino que la cifra nunca se pinte sin compuerta.
      const idx = vue.indexOf('{{ getDiscount }}')
      expect(idx, `${brand}: badge de descuento no encontrado`).toBeGreaterThan(-1)

      // The badge's OWN wrapping element must carry the hasDiscount() guard —
      // not a sibling. Scope the window to just the badge's enclosing element by
      // starting at the previous closing tag (the struck-price </div> above),
      // so the struck-price's own v-if is excluded.
      const prevClose = Math.max(
        vue.lastIndexOf('</div>', idx),
        vue.lastIndexOf('</span>', idx),
      )
      const badgeElement = vue.slice(prevClose, idx)
      const gateEsperada = GATE_POR_MARCA[brand] as string
      expect(
        badgeElement.includes(gateEsperada),
        `${brand}: "Dto Hoy" badge must be gated by ${gateEsperada}`,
      ).toBe(true)
      // Nunca sin compuerta: es la condición que originó el bug del NaN.
      expect(badgeElement).toMatch(/v-if="/)
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
 * SCEN-W1: the struck base price must never render when there is nothing to
 * strike. When no anchor applies, getDailyBasePrice collapses onto
 * getDailyPrice — the exact figure already printed right below it — so an
 * ungated struck price paints a phantom "$ X" crossed out over an identical
 * "$ X". This also protects the price-anchor pilot, where capping
 * discountAmount collapses the two figures on live quotes.
 *
 * Each surface declares the predicate it must carry. The result cards use
 * hasStruckBasePrice, which compares the two rendered figures and is therefore
 * agnostic to where the base price came from — a daily discount or the monthly
 * one_day_price anchor. hasDiscount() is NOT acceptable there: it only reads
 * discountAmount, a daily field the monthly price ignores, so it swallows the
 * legitimate monthly anchor (R-WEB D-W1, characterised in
 * useCategory.monthlyStruckPrice.adversarial.test.ts).
 *
 * The reservation summaries carried the same monthly blind spot and now use
 * hasStruckBasePrice too (SCEN-M7): a monthly booking reached the summary with
 * its one_day_price anchor silently dropped, so the customer saw the struck
 * price on the card and not on the page where they commit. Only the struck
 * price's own div moved; the "Dto Hoy" badge beside it keeps hasDiscount(),
 * which is the right predicate for a daily-discount badge.
 *
 * The alquilame reskin has landed and its two surfaces were migrated here: they
 * render the struck figure inside a `.fila-tarifa` row, so the row carries the
 * same v-if AND the span keeps its own — the span's is the one this guard reads.
 * hasDiscountToShow stays on the reskin's discount PILL and is not accepted for
 * the struck price: this guard pins one predicate on purpose so a silent
 * regression to a discount-only gate cannot pass.
 *
 * Anchored on the currencyDailyBasePrice interpolation rather than on
 * getDiscount so this describe never overlaps the badge guard above.
 */
const STRUCK_PRICE_SURFACES = [
  ['ui-alquilame', 'app/components/CategoryCard.vue', 'hasStruckBasePrice'],
  ['ui-alquilatucarro', 'app/components/CategoryCard.vue', 'hasStruckBasePrice'],
  ['ui-alquilame', 'app/components/ReservationResume.vue', 'hasStruckBasePrice'],
  ['ui-alquilatucarro', 'app/components/ReservationResume.vue', 'hasStruckBasePrice'],
] as const

describe('struck base price gate', () => {
  for (const [brand, rel, predicate] of STRUCK_PRICE_SURFACES) {
    it(`${brand} ${rel.split('/').pop()} gates the struck base price on ${predicate}`, () => {
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

      expect(
        openingTag.includes(`v-if="${predicate}"`),
        `${brand}/${rel}: struck base price must be gated by v-if="${predicate}" (opening tag: ${openingTag})`,
      ).toBe(true)
    })
  }

  // The composable must actually expose what the cards destructure, otherwise
  // the templates above would silently gate on undefined (always falsy) and
  // hide every struck price without a single test going red.
  it('useCategory exposes hasStruckBasePrice comparing the two rendered figures', () => {
    expect(logicSource).toMatch(
      /const hasStruckBasePrice = computed<boolean>\(\(\) => getDailyBasePrice\.value > getDailyPrice\.value\)/,
    )
    expect(
      /^\s*hasStruckBasePrice,\s*$/m.test(logicSource),
      'hasStruckBasePrice is computed but never returned from useCategory',
    ).toBe(true)
  })
})
