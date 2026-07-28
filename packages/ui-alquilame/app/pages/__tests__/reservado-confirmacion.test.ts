/**
 * /reservado/[reserveCode] — diseño "tiquete de viaje" (promovido de
 * /lab-reservado-tiquete el 2026-07-28): foto full-bleed de carretera con
 * llaves y mapa (asset webp), tiquete blanco con línea perforada y muescas
 * troqueladas por CSS mask, y los quick wins de texto/acción.
 *
 * Estas aserciones son estructurales sobre el fuente del SFC (la página es
 * async y depende de composables Nuxt, así que no se monta aquí); el
 * comportamiento se verificó en runtime con el navegador embebido. El
 * harness de montaje queda como follow-up documentado en el PR.
 *
 *   - SCEN-RSV-01: el fondo va en style INLINE + preload con fetchpriority —
 *     no como utility de Tailwind, porque en rutas no-home la hoja de estilos
 *     se inyecta tarde y la foto es el LCP (hallazgo del gate de performance).
 *   - SCEN-RSV-02: divisor perforado — línea punteada y muescas con
 *     radial-gradient + mask-composite.
 *   - SCEN-RSV-03: quick wins conectados — cero emojis, botón con
 *     @click="copyCode" y feedback "¡Copiado!", CTA con :href="whatsappHref"
 *     construido desde franchise.whatsapp, textos concretos con horario real
 *     y sin "horario laboral".
 *   - SCEN-RSV-04: el estado 'unavailable' ("Estamos verificando tu reserva")
 *     sigue existiendo con su marker y role="status".
 *   - SCEN-RSV-05: noindex y confetti se conservan de la versión anterior.
 *   - SCEN-RSV-06: el fallo del portapapeles NO es silencioso — hay región
 *     viva con mensaje de fallback (hallazgo del gate de edge cases).
 *   - SCEN-RSV-07: el CTA de WhatsApp usa el token accesible del issue #284
 *     (bg-whatsapp + text-black), nunca verde arbitrario con texto blanco.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const PAGE = 'app/pages/reservado/[reserveCode]/index.vue'
const source = readFileSync(join(ROOT, PAGE), 'utf-8')

const count = (needle: string): number => source.split(needle).length - 1

describe('reservado/[reserveCode] — tiquete de confirmación', () => {
  it('SCEN-RSV-01: fondo inline + preload (la foto es el LCP)', () => {
    expect(source).toMatch(
      /style="background-image:url\('\/images\/reservado\/fondo-tiquete\.webp'\);background-size:cover;background-position:center"/,
    )
    expect(source).not.toContain('bg-[url(')
    expect(source).toMatch(/rel: 'preload'[\s\S]*?href: '\/images\/reservado\/fondo-tiquete\.webp'[\s\S]*?fetchpriority: 'high'/)
    expect(existsSync(join(ROOT, 'public/images/reservado/fondo-tiquete.webp'))).toBe(true)
  })

  it('SCEN-RSV-02: divisor perforado con muescas por mask', () => {
    expect(source).toContain('border-dashed')
    expect(source).toContain('radial-gradient')
    expect(source).toContain('mask-composite')
  })

  it('SCEN-RSV-03: quick wins conectados al DOM', () => {
    expect(count('📱')).toBe(0)
    expect(count('📧')).toBe(0)
    expect(count('🚗')).toBe(0)
    expect(source).toContain('@click="copyCode"')
    expect(source).toContain('navigator.clipboard.writeText')
    expect(source).toContain('¡Copiado!')
    expect(source).toContain(':href="whatsappHref"')
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
    expect(source).toContain('data-reservation-state="unavailable"')
  })

  it('SCEN-RSV-05: noindex y confetti conservados', () => {
    expect(source).toContain('noindex, nofollow')
    expect(source).toContain('js-confetti')
  })

  it('SCEN-RSV-06: el fallo de copiado tiene feedback visible y accesible', () => {
    expect(source).toContain("copyState")
    expect(source).toContain('No se pudo copiar automáticamente')
    expect(source).toMatch(/role="status"[^>]*aria-live="polite"/)
  })

  it('SCEN-RSV-07: CTA de WhatsApp con el token accesible del issue #284', () => {
    expect(source).toMatch(/bg-whatsapp text-black hover:bg-whatsapp-hover/)
    expect(source).not.toMatch(/bg-\[#[0-9a-fA-F]{3,8}\][^"]*text-white/)
  })
})
