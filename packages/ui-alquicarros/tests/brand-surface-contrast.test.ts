/**
 * Issue #364 — SCEN-364-08: mover un token naranja rompe la suite.
 *
 * El naranja institucional de alquicarros no admite texto blanco (2.20:1 sobre
 * #ff9500). La remediación fija texto oscuro sobre naranja vía --color-on-brand,
 * y este archivo convierte esa regla en algo ejecutable: si alguien cambia un
 * token de superficie de marca a un valor que rompa el contraste, la suite se
 * pone roja nombrando el token y el ratio medido.
 *
 * Es el único guard que sobrevive a un cambio futuro de paleta. Los invariantes
 * por componente comprueban que nadie escriba `text-white` sobre naranja; este
 * comprueba que el naranja siga siendo un fondo sobre el que gray-900 se lee.
 *
 * El CAVEAT que vivía en theme.css desde F0 advertía del problema y prescribía
 * `brand-700+`, que tampoco cumple (3.74:1 sobre blanco). Una advertencia en un
 * comentario no detiene nada; un test sí.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const theme = readFileSync(resolve(pkgRoot, 'app/assets/css/theme.css'), 'utf-8')

/**
 * Superficies de marca que llevan texto encima. Los cuatro tokens de gradiente
 * cubren los heroes (hero-*) y la sección de aliados (footer-*); brand-600 es el
 * fondo sólido del badge y la CTA de FleetCard.
 *
 * Los extremos de gradiente van incluidos a propósito: footer-to (#e35d0a) es el
 * punto más oscuro de la aplicación y el que descarta gray-800 (4.08:1). Medir
 * solo el color de partida daría un falso verde.
 */
const SURFACE_TOKENS = [
  '--color-hero-from',
  '--color-hero-to',
  '--color-footer-from',
  '--color-footer-to',
  '--color-brand-600',
] as const

/** Texto normal en WCAG 2.1 AA. Es el umbral estricto: si lo pasa, el texto grande y los iconos (3:1) también. */
const MIN_RATIO = 4.5

function readToken(name: string): string {
  const m = theme.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!m?.[1]) throw new Error(`theme.css no define ${name} con un hex de 6 dígitos`)
  return m[1].toLowerCase()
}

/** Luminancia relativa, WCAG 2.x. */
function luminance(hexColor: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('issue #364 — superficie de marca legible (alquicarros)', () => {
  it('define --color-on-brand como el texto de las superficies naranjas', () => {
    expect(theme).toMatch(/--color-on-brand:\s*#111827/i)
  })

  it('la fórmula de contraste reproduce las anclas conocidas de WCAG', () => {
    // Sin esto, un error en luminance() haría pasar el resto del archivo por
    // razones equivocadas: un guard que mide mal es peor que no tener guard.
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 2)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 2)
  })

  describe('cada superficie de marca aguanta el texto de --color-on-brand', () => {
    for (const token of SURFACE_TOKENS) {
      it(`${token} alcanza ${MIN_RATIO}:1`, () => {
        const onBrand = readToken('--color-on-brand')
        const surface = readToken(token)
        const ratio = contrast(onBrand, surface)

        expect(
          ratio,
          `${token} (${surface}) contra --color-on-brand (${onBrand}) da ${ratio.toFixed(2)}:1, ` +
            `por debajo del mínimo AA de ${MIN_RATIO}:1 para texto normal. ` +
            `O se aclara el token, o esa superficie deja de llevar texto.`,
        ).toBeGreaterThanOrEqual(MIN_RATIO)
      })
    }
  })

  it('el texto blanco sigue sin caber en el naranja — el motivo de la regla', () => {
    // Ancla el porqué, no solo el qué. Si algún día blanco pasara sobre el
    // naranja institucional, la regla habría dejado de tener sentido y este
    // archivo debería revisarse en vez de arrastrarse por inercia.
    const heroFrom = readToken('--color-hero-from')
    expect(contrast('#ffffff', heroFrom)).toBeLessThan(3)
  })
})
