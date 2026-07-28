import { describe, expect, it } from 'vitest'

import {
  compareTexts,
  decodeEntities,
  extractCityContentRegion,
  extractVisibleText,
  tokenize,
} from '../../../docs/seo/alquilame/tools/shingle-check.mjs'

const cityRegion = (intro, faq) => `
  <header>Navigation outside the region</header>
  <section id="ventajas">Generic brand benefits outside the region</section>
  <section class="city-copy" id="introduccion"><p>${intro}</p></section>
  <section id="destinos"><p>Destino uno destino dos destino tres</p></section>
  <section id="faqs"><div><p>${faq}</p></div></section>
  <footer>Footer outside the region</footer>
`

describe('shingle-check HTML handling', () => {
  it('decodes common Spanish named entities with their original case', () => {
    expect(decodeEntities(
      '&aacute;&eacute;&iacute;&oacute;&uacute;&ntilde;&uuml;&iexcl;&iquest; '
      + '&Aacute;&Eacute;&Iacute;&Oacute;&Uacute;&Ntilde;&Uuml;',
    )).toBe('áéíóúñü¡¿ ÁÉÍÓÚÑÜ')
  })

  it('strips tags and decodes entities in an HTML fragment without html/body tags', () => {
    const fragment = '<span>Bogot&aacute;</span><br><strong>m&aacute;s cerca</strong>'
    expect(tokenize(fragment)).toEqual(['bogotá', 'más', 'cerca'])
    expect(extractVisibleText(fragment)).not.toMatch(/<\/?(?:span|br|strong)/)
  })
})

describe('shingle-check city region', () => {
  it('extracts section#introduccion through the closing section#faqs', () => {
    const region = extractCityContentRegion(cityRegion('Texto propio de ciudad', 'Respuesta local'))
    expect(region).toContain('id="introduccion"')
    expect(region).toContain('id="faqs"')
    expect(region).toContain('Respuesta local')
    expect(region).not.toContain('Generic brand benefits')
    expect(region).not.toContain('Footer outside')
  })

  it('compares only the selected region when requested', () => {
    const sharedIntro = 'uno dos tres cuatro cinco seis siete ocho nueve diez'
    const sharedFaq = 'once doce trece catorce quince dieciséis diecisiete dieciocho'
    const a = cityRegion(sharedIntro, sharedFaq).replace('Navigation', 'Header A unique')
    const b = cityRegion(sharedIntro, sharedFaq).replace('Navigation', 'Header B different')
    const result = compareTexts(a, b, 8, { region: true })

    expect(result.region).toBe(true)
    expect(result.percentage).toBe(100)
  })

  it('fails clearly when a required marker is absent', () => {
    expect(() => extractCityContentRegion('<section id="introduccion">copy</section>'))
      .toThrow(/section#faqs/)
  })
})
