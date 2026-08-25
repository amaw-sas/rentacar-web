/**
 * SCEN-003, SCEN-004 y SCEN-005 de docs/specs/blog-code-overflow.
 *
 * Un `code` en línea con una URL sin espacios medía 524px dentro de una columna
 * de 380 y ensanchaba el documento a 570 en un viewport de 412: la página se
 * arrastraba de lado. La guarda vive por marca porque el CSS está triplicado en
 * el `<style>` de cada `[...slug].vue`; el comportamiento se mide en el
 * navegador (SCEN-001/002).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'app/pages/blog/[...slug].vue'),
  'utf-8',
)

const rule = (selector: string) => {
  const start = SRC.indexOf(`${selector} {`)
  return start === -1 ? null : SRC.slice(start, SRC.indexOf('}', start))
}

describe('SCEN-003: cualquier token largo se parte dentro del ancho disponible', () => {
  it('el code en línea se acota al contenedor y puede partir el token', () => {
    const code = rule('.prose code')
    expect(code, '.prose code rule not found').not.toBeNull()
    expect(code).toMatch(/max-width:\s*100%/)
    expect(code).toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('parte sólo cuando no cabe — nada de break-all', () => {
    // `break-all` partiría también las palabras que sí caben (SCEN-005).
    expect(rule('.prose code')).not.toMatch(/word-break:\s*break-all/)
  })
})

describe('SCEN-004: los bloques de código no cambian', () => {
  it('pre conserva su propio desplazamiento horizontal', () => {
    expect(rule('.prose pre')).toMatch(/overflow-x:\s*auto/)
  })

  it('el code dentro de pre no hereda el partido del chip en línea', () => {
    const preCode = rule('.prose pre code')
    expect(preCode, '.prose pre code rule not found').not.toBeNull()
    expect(preCode).toMatch(/overflow-wrap:\s*normal/)
    expect(preCode).toMatch(/max-width:\s*none/)
  })
})
