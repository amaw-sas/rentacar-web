import { describe, it, expect } from 'vitest'
import { cityPullQuotes, splitSentences } from '../cityPullQuotes'

const BOGOTA =
  'Bogotá, la capital colombiana a 2.600 metros de altura, combina historia, gastronomía y vida nocturna en una ciudad que nunca duerme. Retira tu carro en el Aeropuerto El Dorado y muévete con libertad: sube a Monserrate al amanecer, recorre La Candelaria y el Museo del Oro, escápate a la Catedral de Sal en Zipaquirá o disfruta la Zona Rosa de noche. Sin anticipos, con descuentos de hasta el 60% y entrega inmediata los 7 días. En una capital donde el tráfico dicta los tiempos, tu propio carro te devuelve el control.'

describe('cityPullQuotes', () => {
  it('does not split a period used as a thousands separator (2.600)', () => {
    const s = splitSentences(BOGOTA)
    expect(s[0]).toContain('2.600 metros')
    expect(s).toHaveLength(4)
  })

  it('returns the identity, pickup and closing sentences — dropping the offer', () => {
    const q = cityPullQuotes(BOGOTA)
    expect(q).toHaveLength(3)
    expect(q[0]).toMatch(/^Bogotá, la capital colombiana/)
    expect(q[1]).toMatch(/^Retira tu carro en el Aeropuerto El Dorado/)
    expect(q[2]).toMatch(/tu propio carro te devuelve el control\.$/)
    // The sales sentence never appears as a quote.
    expect(q.join(' ')).not.toMatch(/anticipos|descuento|%/)
  })

  it('keeps opening two + closer when there are more than three non-offer sentences', () => {
    const five =
      'Uno es la identidad. Dos es la recogida. Tres es un dato extra. Cuatro es otro dato. Cinco es el cierre.'
    const q = cityPullQuotes(five)
    expect(q).toEqual(['Uno es la identidad.', 'Dos es la recogida.', 'Cinco es el cierre.'])
  })

  it('returns fewer quotes gracefully for a short description', () => {
    expect(cityPullQuotes('Una sola frase sobre la ciudad.')).toEqual([
      'Una sola frase sobre la ciudad.',
    ])
    expect(cityPullQuotes('')).toEqual([])
    expect(cityPullQuotes(null)).toEqual([])
  })
})
