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
