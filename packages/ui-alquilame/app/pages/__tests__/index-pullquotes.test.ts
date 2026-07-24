/**
 * Franjas separadoras (CityPullQuote) en la home.
 *
 *   - SCEN-PQ-01: la home reusa el MISMO componente que las landings de ciudad,
 *     no una franja propia — así el patrón es uno solo.
 *   - SCEN-PQ-02: se colocan tres, con el mismo ritmo que en ciudad.
 *   - SCEN-PQ-03: el texto habla del país (no de una ciudad) y NO es comercial
 *     — el util de ciudad descarta justo las frases de oferta.
 *   - SCEN-PQ-04: el conteo de ciudades sale de la misma fuente que el footer,
 *     no escrito a mano (ya se desactualizó una vez en el blog).
 *   - SCEN-PQ-05: ninguna franja queda pegada a una sección blanca. La franja es
 *     bg-white; junto a otra sección blanca no se ve el separador, sólo doble
 *     aire. En ciudad cada franja va entre secciones con color; la home debe
 *     respetar lo mismo, así que Stats y Requirements (bg-white) no pueden ser
 *     vecinos de una franja.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const index = readFileSync(join(ROOT, 'app/pages/index.vue'), 'utf-8')

describe('home — franjas separadoras', () => {
  it('SCEN-PQ-01/02: usa CityPullQuote y coloca tres', () => {
    const n = (index.match(/<CityPullQuote\b/g) || []).length
    expect(n).toBe(3)
  })

  it('SCEN-PQ-03: el copy habla del país y evita tono comercial', () => {
    // Acotado al array de las franjas: "anticipos" aparece en otro copy de la
    // home (el hero), y ahí sí es válido.
    const quotes = index.match(/const pullQuotes = computed\(\(\) => \[([\s\S]*?)\]\)/)?.[1] ?? ''
    expect(quotes).toMatch(/Colombia se ve distinta desde la carretera/)
    expect(quotes).not.toMatch(/anticipos|descuento|%/)
  })

  it('SCEN-PQ-04: el conteo de ciudades es dinámico', () => {
    expect(index).toMatch(/useCityCount\(\)/)
    expect(index).toMatch(/\$\{cityCount\.value\}\s*ciudades/)
    // No hay un número de ciudades escrito a mano en las franjas.
    expect(index).not.toMatch(/\b\d+\s+ciudades del pa/)
  })

  it('SCEN-PQ-05: ninguna franja es vecina de una sección blanca (Stats/Requirements)', () => {
    // Orden observable: cada CityPullQuote debe tener a ambos lados un componente
    // que NO sea el que renderiza bg-white (HomeStats, HomeRequirements).
    const order = [...index.matchAll(/<(Home[A-Za-z]+|CityPullQuote)\b/g)].map((m) => m[1])
    const WHITE = new Set(['HomeStats', 'HomeRequirements'])
    order.forEach((name, i) => {
      if (name !== 'CityPullQuote') return
      expect(WHITE.has(order[i - 1] ?? ''), `franja ${i} pegada a ${order[i - 1]}`).toBe(false)
      expect(WHITE.has(order[i + 1] ?? ''), `franja ${i} pegada a ${order[i + 1]}`).toBe(false)
    })
  })
})
