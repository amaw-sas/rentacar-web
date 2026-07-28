import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Tarjeta de categoría NO disponible. Rediseño 2026-07-25:
 *   - el mensaje de no disponibilidad va justo ANTES de los botones (no al tope),
 *   - fondo gris y texto negro (antes rojo),
 *   - el rojo se reserva para el icono de alerta y la línea izquierda.
 */
const src = readFileSync(
  fileURLToPath(new URL('../UnableCategoryCard.vue', import.meta.url)),
  'utf8',
)

describe('UnableCategoryCard — mensaje de no disponibilidad', () => {
  it('el mensaje "No disponible" va antes de los botones', () => {
    const msg = src.indexOf('No disponible')
    const btn = src.indexOf('Probar otras fechas')
    expect(msg).toBeGreaterThan(-1)
    expect(btn).toBeGreaterThan(-1)
    expect(msg).toBeLessThan(btn)
  })

  it('el fondo del mensaje es gris, ya no rojo', () => {
    expect(src).not.toContain('bg-red-50')
    expect(src).toMatch(/bg-gray-\d{2,3}/)
  })

  it('los textos del mensaje son oscuros, no rojos', () => {
    expect(src).not.toContain('text-red-800')
    expect(src).not.toContain('text-red-700')
  })

  it('el rojo se conserva SOLO en el icono de alerta y las líneas laterales (ambos lados)', () => {
    expect(src).toContain('i-lucide-alert-triangle')
    expect(src).toContain('text-red-600') // icono
    expect(src).toContain('border-red-500') // líneas
    expect(src).toContain('border-x-4') // izquierda + derecha
  })

  it('el banner del mensaje va a lo ancho (full-bleed, sin inset lateral)', () => {
    // El bloque del banner ya no está envuelto en un px-5 propio: la línea roja
    // y el gris tocan los bordes de la tarjeta.
    const banner = src.slice(src.indexOf('alert-triangle') - 200, src.indexOf('alert-triangle'))
    expect(banner).toContain('border-x-4')
    expect(banner).not.toMatch(/rounded-r\b/)
  })

  it('el cuerpo de CTAs tiene fondo blanco, no gris', () => {
    const cuerpo = src.slice(src.indexOf('Cuerpo de CTAs'), src.indexOf('Cuerpo de CTAs') + 400)
    expect(cuerpo).toContain('bg-white')
    expect(cuerpo).not.toContain('sutil-fondo')
  })

  it('nombre y grupo usan el mismo tamaño/orden que las tarjetas disponibles', () => {
    // Las disponibles: nombre grande (.descripcion-corta) y DEBAJO el grupo
    // (.categoria-carro). La no-disponible estaba al revés (#UnableCategoryCard).
    expect(src).toContain('descripcion-corta')
    expect(src).toContain('categoria-carro')
    const nombre = src.indexOf('descripcion-corta')
    const grupo = src.indexOf('categoria-carro')
    expect(nombre).toBeLessThan(grupo)
    // ya no hay un <h3> propio con text-2xl invertido
    expect(src).not.toMatch(/<h3[^>]*text-2xl/)
  })

  it('el nombre/grupo NO es expandible: sin colapsable ni flecha (nada que ampliar)', () => {
    expect(src).not.toContain('UCollapsible')
    expect(src).not.toContain('ChevronDownIcon')
    expect(src).not.toContain('descripcion-larga')
  })

  it('el botón "Probar otras fechas" es verde como los demás CTAs', () => {
    expect(src).toMatch(/bg-green-\d{3}[\s\S]{0,300}Probar otras fechas/)
  })

  it('"Probar otras fechas" sube el scroll hasta arriba (no a medio formulario)', () => {
    expect(src).toMatch(/window\.scrollTo\(\{\s*top:\s*0/)
    expect(src).not.toContain("getElementById('searcher')")
  })

  it('reemplaza el 2º botón por sucursales cercanas de la misma ciudad', () => {
    expect(src).not.toContain('Probar otra sucursal cercana')
    expect(src).toContain('nearbyBranches')
  })

  it('la invitación va dentro del banner gris y el listado lleva su propio título afuera', () => {
    // "Intenta con sucursales cercanas" dentro del gris (border-x-4);
    // "Sucursales cercanas:" como título del listado en el cuerpo blanco.
    const banner = src.slice(src.indexOf('border-x-4'), src.indexOf('Cuerpo de CTAs'))
    expect(banner).toContain('Intenta con sucursales cercanas')
    const cuerpo = src.slice(src.indexOf('Cuerpo de CTAs'))
    expect(cuerpo).toContain('Sucursales cercanas:')
    expect(cuerpo).not.toContain('Intenta con sucursales cercanas')
  })

  it('muestra TODAS las sucursales de la misma ciudad, excluyendo la actual (sin límite)', () => {
    expect(src).toContain('b.city === current.city')
    expect(src).toContain('b.slug !== current.slug')
    expect(src).not.toContain('.slice(0, 3)')
  })

  it('el bloque de sucursales se oculta si no hay otras en la ciudad', () => {
    expect(src).toMatch(/v-if="nearbyBranches\.length"/)
  })

  it('cada sucursal enlaza a la misma búsqueda cambiando solo la sucursal', () => {
    expect(src).toContain('urlForBranch')
    expect(src).toContain('lugar-recogida')
    expect(src).toContain('lugar-devolucion')
  })
})
