/**
 * Stats — cifras de la home (se reusa en /reservas y en las landings de ciudad).
 *
 *   - SCEN-STATS-01: cada tarjeta muestra sólo la cifra, su etiqueta y el
 *     detalle. El ícono y la píldora de categoría se retiraron: repetían lo que
 *     la etiqueta ya decía ("FLOTA DISPONIBLE" sobre "Vehículos disponibles") y
 *     robaban peso visual a la cifra, que es el dato.
 *   - SCEN-STATS-02: la cifra no supera al título de página. Estaba en 60px
 *     (md:text-6xl), por encima de heading-page (48px máx.), así que un dato
 *     pesaba más que el H1 de la página. Baja a 48px.
 *   - SCEN-STATS-03: la cifra NO es un encabezado. Es un dato, no un título: si
 *     fuera h2 entraría al índice del documento y ensuciaría la estructura.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame
const stats = readFileSync(join(ROOT, 'app/components/home/Stats.vue'), 'utf-8')

describe('Stats', () => {
  it('SCEN-STATS-01: sin ícono ni píldora de categoría', () => {
    expect(stats).not.toMatch(/<svg[^>]*v-html="stat\.icon"/)
    expect(stats).not.toContain('stat.badge')
    // Y los datos tampoco arrastran los campos muertos.
    expect(stats).not.toMatch(/^\s*icon:/m)
    expect(stats).not.toMatch(/^\s*badge:/m)
  })

  it('SCEN-STATS-02: la cifra no supera el tamaño del título de página', () => {
    expect(stats).not.toMatch(/text-6xl/)
    expect(stats).toMatch(/text-4xl[^"]*md:text-5xl/)
  })

  it('SCEN-STATS-03: la cifra no es un encabezado', () => {
    expect(stats).not.toMatch(/<h[1-6][^>]*>\s*\{\{\s*stat\.value/)
  })
})
