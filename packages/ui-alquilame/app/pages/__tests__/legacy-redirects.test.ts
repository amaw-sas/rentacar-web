import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * F1 of the publication plan: the legacy alquilame.co landing has 3 URLs with
 * Search Console history that must 301 to their new homes when the domain
 * cuts over (/registratuflota had 437 impressions at position 3.1):
 *   /registratuflota          -> /aliados
 *   /aviso-proteccion-de-datos -> /politica-privacidad
 *   /terminos-condiciones.html -> /terminos-condiciones
 * (/terminos-condiciones keeps its path — no rule needed.)
 */
describe('legacy URL redirects (publication F1)', () => {
  const cfg = readFileSync(
    fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
    'utf8',
  )

  it.each([
    ['/registratuflota', '/aliados'],
    ['/aviso-proteccion-de-datos', '/politica-privacidad'],
    ['/terminos-condiciones.html', '/terminos-condiciones'],
  ])('301 rule exists: %s -> %s', (from, to) => {
    const rule = new RegExp(
      `'${from.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}':\\s*\\{\\s*redirect:\\s*\\{\\s*to:\\s*'${to}',\\s*statusCode:\\s*301`,
    )
    expect(cfg).toMatch(rule)
  })
})
