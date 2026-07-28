/**
 * /reservado/[reserveCode] — diseño "tiquete de viaje" (promovido de
 * /lab-reservado-tiquete el 2026-07-28): foto full-bleed de carretera con
 * llaves y mapa (asset webp), tiquete blanco con línea perforada y muescas
 * troqueladas por CSS mask, y los quick wins de texto/acción.
 *
 *   - SCEN-RSV-01: el estado confirmado usa el asset
 *     /images/reservado/fondo-tiquete.webp a pantalla completa (bg-cover).
 *   - SCEN-RSV-02: divisor perforado — línea punteada y muescas con
 *     radial-gradient + mask-composite.
 *   - SCEN-RSV-03: quick wins — cero emojis, botón copiar con clipboard y
 *     feedback "¡Copiado!", CTA wa.me con el código precargado tomado del
 *     app.config (franchise.whatsapp), textos concretos con horario real y
 *     sin "horario laboral".
 *   - SCEN-RSV-04: el estado 'unavailable' ("Estamos verificando tu reserva")
 *     sigue existiendo y legible sobre el nuevo fondo.
 *   - SCEN-RSV-05: noindex y confetti se conservan de la versión anterior.
 *   - SCEN-RSV-06: las páginas lab de este rediseño ya no existen (no pueden
 *     llegar a prod ni al sitemap, lección del PR #421).
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const PAGE = 'app/pages/reservado/[reserveCode]/index.vue'
const source = readFileSync(join(ROOT, PAGE), 'utf-8')

const count = (needle: string): number => source.split(needle).length - 1

describe('reservado/[reserveCode] — tiquete de confirmación', () => {
  it('SCEN-RSV-01: fondo full-bleed con el asset webp', () => {
    expect(source).toContain('/images/reservado/fondo-tiquete.webp')
    expect(source).toContain('bg-cover')
    expect(existsSync(join(ROOT, 'public/images/reservado/fondo-tiquete.webp'))).toBe(true)
  })

  it('SCEN-RSV-02: divisor perforado con muescas por mask', () => {
    expect(source).toContain('border-dashed')
    expect(source).toContain('radial-gradient')
    expect(source).toContain('mask-composite')
  })

  it('SCEN-RSV-03: quick wins de texto y acción', () => {
    expect(count('📱')).toBe(0)
    expect(count('📧')).toBe(0)
    expect(count('🚗')).toBe(0)
    expect(source).toContain('navigator.clipboard.writeText')
    expect(source).toContain('¡Copiado!')
    expect(source).toContain('franchise.whatsapp')
    expect(source).toContain('código de reserva es')
    expect(source).toContain('Escribir por WhatsApp')
    expect(source).toContain('Te enviamos la confirmación por:')
    expect(source).toContain('Guárdalo: lo necesitas para recoger el vehículo.')
    expect(source).toContain('Lunes a viernes 7:00')
    expect(count('horario laboral')).toBe(0)
  })

  it('SCEN-RSV-04: estado unavailable conservado', () => {
    expect(source).toContain('Estamos verificando tu reserva')
    expect(source).toContain("data-reservation-state=\"unavailable\"")
  })

  it('SCEN-RSV-05: noindex y confetti conservados', () => {
    expect(source).toContain('noindex, nofollow')
    expect(source).toContain('js-confetti')
  })

  it('SCEN-RSV-06: las páginas lab del rediseño fueron borradas', () => {
    expect(existsSync(join(ROOT, 'app/pages/lab-reservado.vue'))).toBe(false)
    expect(existsSync(join(ROOT, 'app/pages/lab-reservado-tiquete.vue'))).toBe(false)
  })
})
