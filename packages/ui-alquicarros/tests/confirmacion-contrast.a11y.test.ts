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

  it('no usa opacidades que fallan AA sobre bg-white/10 en la zona clara del gradiente', () => {
    // Medido en /agent-browser: sobre bg-white/10 en el punto más claro del
    // gradiente (from-brand-900, rgb 124,45,18), white/60 = 3.73:1 y white/70 =
    // 4.48:1 (ambos < 4.5). white/80 = 5.32:1 pasa. Prohibimos /70 y menos.
    expect(src).not.toMatch(/text-white\/(70|60|50|40|30|20|10)\b/)
  })

  it('no usa las clases body-* (imponen color gray-700 de modo claro, invisible en el fondo oscuro)', () => {
    // Trampa cazada en runtime: `body-sm`/`body-md` fijan color rgb(55,65,81)
    // (gray-700) que gana sobre text-white/*, dejando los valores del recap y el
    // checklist en gris oscuro sobre el marrón. jsdom no aplica esa cascada.
    expect(src).not.toMatch(/\bbody-(sm|md|lg|xl)\b/)
  })
})
