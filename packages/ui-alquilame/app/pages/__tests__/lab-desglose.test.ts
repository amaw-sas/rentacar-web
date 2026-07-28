import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Mockup (throwaway) del bloque de precios de la card de resultados. Dos
 * decisiones vivas:
 *   1. Surgir el desglose que hoy vive escondido en el tooltip del total
 *      (Seguro Básico, tasa administrativa, IVA) — se eligió la disposición C.
 *   2. Reemplazar el badge poco claro "Dto hoy 48%" por una redacción legible.
 *
 * NO es superficie de producto: noindex, sin enlaces desde el sitio, se borra
 * al decidir. Usa el CSS REAL de la card (`.categoria`) y cifras de ejemplo
 * internamente consistentes.
 */
const page = readFileSync(
  fileURLToPath(new URL('../lab-desglose.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-LABD01 — el mockup no es superficie pública', () => {
  it('va en noindex', () => {
    expect(page).toMatch(/robots:\s*'noindex/)
  })

  it('lleva marca explícita de borrado para que no sobreviva al merge', () => {
    expect(page).toContain('BORRAR')
  })
})

describe('SCEN-LABD02 — la disposición C surge los tres conceptos que hoy están ocultos', () => {
  it.each(['Seguro Básico', 'Tasa administrativa', 'IVA'])(
    'muestra "%s" como texto visible',
    (concepto) => {
      expect(page).toContain(concepto)
    },
  )

  it('reusa el CSS real de la card (no inventa un estilo propio)', () => {
    expect(page).toContain('categoria')
    expect(page).toContain('fila-tarifa')
    expect(page).toContain('precio-total')
  })

  it('las cifras de ejemplo cuadran: subtotal + impuestos = total a pagar', () => {
    const num = (label: string) => {
      const m = page.match(new RegExp(`data-monto="${label}"[^>]*>\\s*\\$\\s*([\\d.]+)`))
      return m ? Number(m[1].replace(/\./g, '')) : NaN
    }
    const subtotal = num('subtotal')
    const impuestos = num('impuestos')
    const total = num('total')
    expect(Number.isNaN(subtotal) || Number.isNaN(total)).toBe(false)
    expect(subtotal + impuestos).toBe(total)
  })
})

describe('SCEN-LABD03 — el badge de descuento se lee sin abreviaturas', () => {
  it('muestra el "antes" para tener referencia de lo que se reemplaza', () => {
    expect(page).toContain('Dto hoy 48%')
  })

  it('ofrece al menos tres redacciones alternativas para comparar', () => {
    const badges = [...page.matchAll(/data-badge="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(badges).size).toBeGreaterThanOrEqual(3)
  })

  it('las alternativas escriben "descuento" o "ahorras" completos, sin "Dto"', () => {
    const alternativas = [...page.matchAll(/data-badge="alt[^"]*"[\s\S]*?>([^<]+)</g)].map(
      (m) => m[1].trim(),
    )
    expect(alternativas.length).toBeGreaterThanOrEqual(3)
    for (const texto of alternativas) {
      expect(texto).not.toMatch(/\bDto\b/)
      // Acepta guion ASCII y el signo menos tipográfico U+2212 ("−").
      expect(texto).toMatch(/descuento|[Aa]horr|% menos|[-−]\s*\d/i)
    }
  })
})
