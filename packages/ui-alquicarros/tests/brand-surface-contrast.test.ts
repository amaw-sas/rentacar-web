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
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Todos los .vue bajo un directorio. Mismo recorrido que whatsapp-green-token.test.ts. */
function walkVue(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walkVue(full, acc)
    else if (name.endsWith('.vue')) acc.push(full)
  }
  return acc
}

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

  /**
   * Invariante estructural de R1. Cada paso que arregla una superficie naranja
   * añade su archivo a esta lista; no hay un paso dedicado a "escribir tests".
   *
   * Lo estático vale aquí porque es ausencia de un literal en un archivo
   * concreto: sin ternarios que resolver ni fondos heredados de un ancestro.
   * La clasificación texto/icono/texto-grande, que sí necesita runtime, vive en
   * el barrido con navegador.
   */
  describe.each([
    'app/components/home/Hero.vue',
    'app/components/city/Hero.vue',
    'app/components/home/Partners.vue',
    'app/components/wizard/steps/StepSearch.vue',
  ])('%s — superficie naranja bajo R1', (rel) => {
    // Sin los comentarios. Estos componentes documentan POR QUÉ se quitó el
    // texto blanco, así que la prosa cita los literales prohibidos; afirmar
    // sobre el archivo crudo convertiría cada explicación en un fallo. El
    // invariante es sobre el markup que se pinta, no sobre lo que se cuenta.
    const src = readFileSync(resolve(pkgRoot, rel), 'utf-8').replace(/<!--[\s\S]*?-->/g, '')

    it('no pinta texto blanco sobre el naranja, en ningún estado', () => {
      // Coge también hover:text-white y text-white/85. El estado hover del
      // marquee de aliados daba 2.36:1, peor que el reposo — medir solo el
      // estilo base deja fuera fallos reales.
      expect(src).not.toMatch(/text-white/)
    })

    it('declara el contexto de marca en vez de fingir superficie oscura', () => {
      expect(src).toContain('context-brand')
      expect(src).not.toMatch(/--ctx-text-primary:\s*#fff/)
    })
  })

  /**
   * R2 y R3 sobre fondo claro. La card de flota lleva el dato por el que la
   * gente entra al sitio, y lo pintaba a 2.13:1.
   *
   * Los tonos prohibidos van por nombre porque el fondo (#F4F5F9) es constante
   * y conocido; donde el fondo depende de un ancestro, la comprobación es
   * runtime y no cabe en un test estático.
   */
  describe('app/components/home/FleetCard.vue — fondo claro bajo R2/R3', () => {
    const src = readFileSync(resolve(pkgRoot, 'app/components/home/FleetCard.vue'), 'utf-8')
      .replace(/<!--[\s\S]*?-->/g, '')

    it('no usa naranja por debajo de brand-800 como texto', () => {
      // brand-600 = 2.13:1 y brand-700 = 3.43:1 sobre #F4F5F9. El precio es
      // texto grande (30px/800) y le bastaría 3:1, pero ninguno de los dos llega.
      expect(src).not.toMatch(/text-brand-[567]00/)
    })

    it('no usa grises por debajo de gray-600', () => {
      // gray-400 = 2.33:1; gray-500 = 4.44:1, que falla por 0.06.
      expect(src).not.toMatch(/text-gray-[45]00/)
    })

    it('no usa emerald-600, que se queda en 3.46:1', () => {
      expect(src).not.toMatch(/text-emerald-600/)
    })
  })

  /**
   * R2 en todo el paquete. brand-500 y brand-600 no alcanzan NINGÚN umbral sobre
   * fondo claro: 2.02 y 2.13 sobre #F4F5F9, 2.20 y 2.32 sobre blanco. Ni siquiera
   * el 3:1 de los objetos gráficos, así que tampoco valen para iconos.
   *
   * brand-700 sí queda permitido, pero solo llega a 3.43-3.74: sirve para iconos
   * y no para texto. Esa distinción necesita saber si el nodo es texto o gráfico,
   * lo cual no se puede leer del fuente de forma fiable — vive en el barrido
   * runtime, no aquí.
   *
   * Si algún día hace falta brand-600 sobre una superficie OSCURA (el layout usa
   * un gradiente brand-900 → brand-950), habrá que medirlo y hacer una excepción
   * explícita. Hoy no hay ninguna.
   */
  it('ningún componente usa brand-500/600 como color de texto', () => {
    const offenders = walkVue(resolve(pkgRoot, 'app'))
      .map((file) => ({ file, hits: readFileSync(file, 'utf-8').match(/text-brand-[56]00/g) }))
      .filter((r) => r.hits)
      .map((r) => `${relative(pkgRoot, r.file)} (${r.hits!.length})`)

    expect(offenders, `usan un naranja ilegible como texto:\n  ${offenders.join('\n  ')}`).toEqual([])
  })

  it('el texto blanco sigue sin caber en el naranja — el motivo de la regla', () => {
    // Ancla el porqué, no solo el qué. Si algún día blanco pasara sobre el
    // naranja institucional, la regla habría dejado de tener sentido y este
    // archivo debería revisarse en vez de arrastrarse por inercia.
    const heroFrom = readToken('--color-hero-from')
    expect(contrast('#ffffff', heroFrom)).toBeLessThan(3)
  })
})
