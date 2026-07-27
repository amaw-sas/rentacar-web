import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Página de comparación (throwaway) para decidir el layout del bloque de
 * precios de la card de resultados. NO es superficie de producto: no debe
 * indexarse, no debe enlazarse desde el sitio, y se borra al decidir.
 */
const page = readFileSync(
  fileURLToPath(new URL('../lab-tarifas.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-LAB01 — la página de comparación no es superficie pública', () => {
  it('va en noindex', () => {
    expect(page).toMatch(/robots:\s*'noindex/)
  })

  it('lleva marca explícita de borrado para que no sobreviva al merge', () => {
    expect(page).toContain('BORRAR')
  })
})

describe('SCEN-LAB02 — muestra las tres opciones a comparar, lado a lado', () => {
  it.each([
    ['A · actual', 'data-variante="actual"'],
    ['B · una columna', 'data-variante="una-columna"'],
    ['C · descripción | precio', 'data-variante="dos-columnas"'],
  ])('incluye la variante %s', (_nombre, marca) => {
    expect(page).toContain(marca)
  })

  /**
   * El punto de la página es comparar con el CSS REAL de la card: si las
   * variantes no viven dentro de `.categoria`, las reglas anidadas
   * (.precio-total, .porcentaje-descuento, .texto-no-incluye…) no aplican y la
   * comparación miente.
   */
  it('cada variante se renderiza dentro de .categoria', () => {
    const aperturas = page.match(/class="categoria\b/g) ?? []
    expect(aperturas.length).toBeGreaterThanOrEqual(3)
  })
})

describe('SCEN-LAB03 — las tres muestran exactamente los mismos datos', () => {
  it.each([
    ['tarifa base tachada', '369.000'],
    ['descuento', 'Dto hoy 47%'],
    ['tarifa con descuento', '194.726'],
    ['total', '973.629'],
    ['aviso de impuestos', 'No incluye IVA ni tasa admin'],
    ['bloque de protección', 'Escoge protección'],
  ])('repite %s en las tres variantes', (_nombre, texto) => {
    const veces = page.split(texto).length - 1
    expect(veces, `"${texto}" aparece ${veces} veces, esperaba 3`).toBe(3)
  })
})
