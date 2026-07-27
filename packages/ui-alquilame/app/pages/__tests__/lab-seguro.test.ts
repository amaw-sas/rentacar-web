import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Mockup (throwaway) de mover Seguro Total desde el bloque "Escoge protección"
 * a un toggle dentro de "Servicios adicionales". Como el Básico siempre va
 * incluido, la única decisión es SUBIR a Total, y eso encaja como un extra
 * opcional. Dos variantes según cómo se muestra el precio del upgrade.
 *
 * NO es superficie de producto: noindex, sin enlaces, se borra al decidir.
 */
const page = readFileSync(
  fileURLToPath(new URL('../lab-seguro.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-LABS01 — el mockup no es superficie pública', () => {
  it('va en noindex', () => {
    expect(page).toMatch(/robots:\s*'noindex/)
  })
  it('lleva marca explícita de borrado', () => {
    expect(page).toContain('BORRAR')
  })
})

describe('SCEN-LABS02 — Seguro Total pasa a "Servicios adicionales"; ya no hay "Escoge protección"', () => {
  it('el desglose deja el Básico como incluido', () => {
    expect(page).toContain('Seguro Básico')
    expect(page).toContain('incluido')
  })
  it('Seguro Total aparece dentro del bloque de adicionales, como un toggle', () => {
    const adicionales = page.slice(page.indexOf('Servicios adicionales'))
    expect(adicionales).toContain('Seguro Total')
    expect(adicionales).toMatch(/type="checkbox"|UCheckbox|toggle/i)
  })
  it('ya no renderiza el encabezado "Escoge protección" de la card real', () => {
    // El texto puede aparecer en comentarios/explicación; lo que no debe existir
    // es el encabezado del bloque (en la card real: <p class="body-lg">Escoge
    // protección</p>).
    expect(page).not.toMatch(/body-lg[^>]*>\s*Escoge protección/)
  })
  it('conserva la nota de que el kilometraje mensual sigue en su selector', () => {
    expect(page).toContain('kilometraje')
  })
})

describe('SCEN-LABS03 — muestra las dos formas de mostrar el precio del upgrade', () => {
  it.each([
    ['A · con sobrecosto', 'data-variante="con-precio"'],
    ['B · sin precio aparte', 'data-variante="sin-precio"'],
  ])('incluye la variante %s', (_n, marca) => {
    expect(page).toContain(marca)
  })
})
