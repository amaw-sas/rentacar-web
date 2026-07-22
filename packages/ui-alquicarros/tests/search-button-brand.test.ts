/**
 * Issue #363 — el CTA "BUSCAR VEHÍCULOS" viste el rojo de alquilame.
 *
 * `base.css` se portó byte a byte desde alquilame en el reskin #210 y el bloque
 * `.search-button` nunca se adaptó: se pinta `red-600` (#dc2626) con un glow rojo
 * en bucle infinito, sobre un hero naranja.
 *
 * Este guard NO afirma sobre literales de color. Resuelve el relleno declarado en
 * `base.css` contra los tokens de `theme.css` y calcula ratios WCAG reales, porque
 * el fallo que importa no es "es rojo" sino "no se despega del fondo sobre el que
 * está apoyado". La propuesta original del issue (`bg-brand-600`) también lo
 * incumple —1.06:1 contra `--color-hero-from`— y un guard que solo buscara `red-*`
 * la habría dejado pasar.
 *
 * Encoda SCEN-363-01, 02, 03, 04, 06 y 08 de
 * `docs/specs/issue-363-cta-buscar/scenarios/cta-buscar.scenarios.md` en su capa
 * determinista. Los escenarios 04 y 05 tienen además una capa runtime (el
 * `box-shadow` muestreado en el navegador) que ningún test estático puede cubrir.
 *
 * Mismo patrón que `tests/brand-surface-contrast.test.ts` (#364) y
 * `tests/whatsapp-green-token.test.ts` (#284).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgRoot = join(__dirname, '..')
const cssRoot = join(pkgRoot, 'app/assets/css')

const base = readFileSync(join(cssRoot, 'rentacar-main/base.css'), 'utf-8')
const theme = readFileSync(join(cssRoot, 'theme.css'), 'utf-8')

/** Contraste de componentes no textuales, WCAG 1.4.11. */
const MIN_UI_RATIO = 3
/** Texto normal, WCAG 1.4.3 AA. */
const MIN_TEXT_RATIO = 4.5
/**
 * WCAG 2.2.2: el contenido que parpadea sin mecanismo de pausa no puede durar
 * más de 5 s. `prefers-reduced-motion` mitiga a quien lo configuró, no a todos.
 */
const MAX_ANIMATION_SECONDS = 5

/**
 * Extremos del gradiente del hero. Los DOS, no solo el de partida: el gradiente es
 * `to-br` y el botón cae del lado de `hero-to`, que es el extremo más oscuro y por
 * tanto el que menos margen deja. Medir solo `hero-from` daría un falso verde.
 */
const HERO_TOKENS = ['--color-hero-from', '--color-hero-to'] as const

/** Rojo institucional de alquilame, en sus dos formas: clase Tailwind y valor crudo. */
const RED_CLASS = /\b(?:hover:|focus:|active:)?(?:bg|text|border|from|to|via|ring|shadow)-red-\d/
const RED_VALUE = /220\s*,\s*38\s*,\s*38|#dc2626|#b91c1c/i

const COLOR_LITERALS: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
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

/** Cuerpo de una regla CSS de primer nivel, por selector exacto. */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = base.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  if (!m?.[1]) throw new Error(`base.css no define una regla ${selector}`)
  return m[1]
}

/** Utilidades de un `@apply`, ya separadas. Vacío si la regla no usa `@apply`. */
function appliedUtilities(selector: string): string[] {
  const m = ruleBody(selector).match(/@apply\s+([^;]+);/)
  return m?.[1] ? m[1].trim().split(/\s+/) : []
}

/**
 * Utilidad sin variante (`bg-brand-900` sí, `hover:bg-brand-950` no) con el prefijo
 * dado. El estado base es el que se pinta por defecto y el único que se puede medir
 * sin navegador.
 */
function baseUtility(utilities: string[], prefix: string): string {
  const hit = utilities.find((u) => u.startsWith(`${prefix}-`) && !u.includes(':'))
  if (!hit) throw new Error(`el @apply no declara ninguna utilidad ${prefix}-* sin variante`)
  return hit.slice(prefix.length + 1)
}

/**
 * Utilidad bajo una variante concreta (`hover:bg-brand-950` → `brand-950`). El
 * hover se mide igual que el estado base: un hover que se disuelve en el hero
 * hace desaparecer el botón justo cuando el usuario lo está apuntando.
 */
function variantUtility(utilities: string[], variant: string, prefix: string): string {
  const head = `${variant}:${prefix}-`
  const hit = utilities.find((u) => u.startsWith(head))
  if (!hit) throw new Error(`el @apply no declara ninguna utilidad ${variant}:${prefix}-*`)
  return hit.slice(head.length)
}

/** Nombre de color Tailwind → hex, vía los tokens de theme.css o los literales. */
function resolveColor(name: string): string {
  if (COLOR_LITERALS[name]) return COLOR_LITERALS[name]!
  const m = theme.match(new RegExp(`--color-${name}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!m?.[1]) {
    throw new Error(
      `"${name}" no resuelve: no es un literal conocido ni un token --color-${name} de theme.css. ` +
        `El CTA debe vestir un color de la rampa de marca para que este guard pueda medirlo.`,
    )
  }
  return m[1].toLowerCase()
}

function readToken(name: string): string {
  const m = theme.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!m?.[1]) throw new Error(`theme.css no define ${name} con un hex de 6 dígitos`)
  return m[1].toLowerCase()
}

describe('issue #363 — el CTA de búsqueda viste la marca alquicarros', () => {
  it('la fórmula de contraste reproduce las anclas conocidas de WCAG', () => {
    // Sin esto, un error en luminance() haría pasar el resto del archivo por
    // razones equivocadas: un guard que mide mal es peor que no tener guard.
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 2)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 2)
  })

  // SCEN-363-01
  it('no lleva ninguna clase red-* ni el rojo crudo de alquilame', () => {
    const body = ruleBody('.search-button')
    expect(body, '.search-button conserva una clase red-* del port de alquilame').not.toMatch(
      RED_CLASS,
    )
    expect(body, '.search-button conserva el rojo crudo de alquilame').not.toMatch(RED_VALUE)
  })

  // SCEN-363-02 — el fallo que la propuesta del issue no vio.
  // Reposo Y hover: un hover que se disuelve en el hero borra el botón justo
  // cuando el usuario lo está apuntando, que es el peor momento posible.
  describe('el relleno se despega del hero en el que está apoyado', () => {
    const fills = () => {
      const u = appliedUtilities('.search-button')
      return [
        { estado: 'reposo', color: resolveColor(baseUtility(u, 'bg')) },
        { estado: 'hover', color: resolveColor(variantUtility(u, 'hover', 'bg')) },
      ]
    }

    for (const token of HERO_TOKENS) {
      for (const estado of ['reposo', 'hover']) {
        it(`${estado}: alcanza ${MIN_UI_RATIO}:1 contra ${token}`, () => {
          const fill = fills().find((f) => f.estado === estado)!.color
          const hero = readToken(token)
          const ratio = contrast(fill, hero)

          expect(
            ratio,
            `el relleno del CTA en ${estado} (${fill}) contra ${token} (${hero}) da ` +
              `${ratio.toFixed(2)}:1, por debajo del mínimo de ${MIN_UI_RATIO}:1 de WCAG 1.4.11. ` +
              `El botón vive pelado sobre el gradiente del hero, sin tarjeta detrás: si no se ` +
              `despega, desaparece.`,
          ).toBeGreaterThanOrEqual(MIN_UI_RATIO)
        })
      }
    }
  })

  // SCEN-363-03 — la etiqueta es la misma en ambos estados, el relleno no.
  describe('la etiqueta se lee sobre el relleno', () => {
    for (const estado of ['reposo', 'hover']) {
      it(`${estado}: alcanza ${MIN_TEXT_RATIO}:1`, () => {
        const u = appliedUtilities('.search-button')
        const fill = resolveColor(
          estado === 'reposo' ? baseUtility(u, 'bg') : variantUtility(u, 'hover', 'bg'),
        )
        const ink = resolveColor(baseUtility(u, 'text'))
        const ratio = contrast(ink, fill)

        expect(
          ratio,
          `el texto del CTA (${ink}) sobre su relleno en ${estado} (${fill}) da ` +
            `${ratio.toFixed(2)}:1, por debajo del mínimo AA de ${MIN_TEXT_RATIO}:1 para texto normal.`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO)
      })
    }
  })

  // SCEN-363-01 + SCEN-363-06
  it('el halo no es rojo, ni en la animación ni en el fallback de reduced-motion', () => {
    const keyframes = base.match(/@keyframes\s+glow-pulse\s*\{[\s\S]*?\n\}/)?.[0]
    expect(keyframes, 'base.css no define @keyframes glow-pulse').toBeTruthy()
    expect(keyframes!, 'el glow conserva el rojo de alquilame').not.toMatch(RED_VALUE)

    // base.css tiene VARIOS bloques prefers-reduced-motion (.bg-animated-gradient,
    // .colombia-sweep). Hay que quedarse con el del CTA, no con el primero por
    // posición: si mañana alguien añade otro antes, el guard mediría el equivocado.
    // Cada bloque cierra en la primera `}` a principio de línea — las llaves
    // internas del @media van indentadas.
    const reducedMotion = [
      ...base.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/g),
    ]
      .map((m) => m[0])
      .find((blk) => blk.includes('.search-button-glow'))
    expect(reducedMotion, 'base.css no define el fallback de prefers-reduced-motion').toBeTruthy()
    expect(
      reducedMotion!,
      'el fallback de reduced-motion conserva el rojo de alquilame',
    ).not.toMatch(RED_VALUE)
  })

  // SCEN-363-04
  it('el pulso termina por debajo del umbral de 5 s de WCAG 2.2.2', () => {
    const animation = ruleBody('.search-button-glow').match(/animation:\s*([^;]+);/)?.[1]
    expect(animation, '.search-button-glow no declara una animación').toBeTruthy()

    expect(
      animation!,
      `la animación del CTA es infinita ("${animation!.trim()}"). WCAG 2.2.2 exige un ` +
        `mecanismo de pausa para contenido que parpadea más de 5 s; acotar las ` +
        `iteraciones es ese mecanismo.`,
    ).not.toMatch(/\binfinite\b/)

    const tokens = animation!.trim().split(/\s+/)
    const seconds = Number(tokens.find((t) => /^\d+(?:\.\d+)?m?s$/.test(t))?.replace(/m?s$/, ''))
    const iterations = Number(tokens.find((t) => /^\d+(?:\.\d+)?$/.test(t)))

    expect(seconds, 'no se pudo leer la duración de la animación').toBeGreaterThan(0)
    expect(iterations, 'no se pudo leer el número de iteraciones').toBeGreaterThan(0)

    const total = seconds * iterations
    expect(
      total,
      `el pulso dura ${total} s (${seconds}s × ${iterations}), por encima del umbral de ` +
        `${MAX_ANIMATION_SECONDS} s de WCAG 2.2.2.`,
    ).toBeLessThan(MAX_ANIMATION_SECONDS)

    // SCEN-363-04 pide que la muestra final NO sea `none`. Sin `forwards`, al
    // terminar la última iteración el box-shadow se corta de golpe en vez de
    // quedarse en el halo suave del keyframe 100%: el CTA pierde su affordance
    // de golpe y el usuario ve un parpadeo final.
    expect(
      animation!,
      `la animación no declara \`forwards\` ("${animation!.trim()}"): al acabar, el halo se ` +
        `corta en seco en vez de quedarse en el keyframe 100%.`,
    ).toMatch(/\bforwards\b/)
  })

  // SCEN-363-07 — el rojo de alquilame es correcto EN alquilame.
  it('mide solo alquicarros: este archivo no toca las otras marcas', () => {
    expect(cssRoot).toContain('ui-alquicarros')
  })
})
