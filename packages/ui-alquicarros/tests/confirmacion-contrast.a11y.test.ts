import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Issue #368 hallazgo 1, SCEN-368A-09 — tripwire de contraste. La medición real
 * (ratio ≥ 4.5:1 en canvas, Tailwind 4 emite oklch) va en el QA de /agent-browser,
 * igual que en B1. Aquí, guard de fuente barato: los textos nuevos de la
 * confirmación no caen a clases de bajo contraste sobre el fondo oscuro de marca.
 */

const file = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../app/components/ReservationConfirmation.vue',
)
const src = readFileSync(file, 'utf8')

describe('SCEN-368A-09 — la confirmación no usa texto de bajo contraste', () => {
  it('no usa text-gray-400 (falla AA como copy de cuerpo)', () => {
    expect(src).not.toMatch(/text-gray-400/)
  })

  it('no baja de white/60 en la opacidad del texto (white/50 y menos serían riesgo AA)', () => {
    expect(src).not.toMatch(/text-white\/(50|40|30|20|10)\b/)
  })
})
