/**
 * Issue #363 — el CTA "BUSCAR VEHÍCULOS" viste el rojo de alquilame.
 *
 * `base.css` se portó byte a byte desde alquilame en el reskin #210 y el bloque
 * `.search-button` nunca se adaptó: se pintaba `red-600` (#dc2626) con un glow
 * rojo en bucle infinito, sobre un hero naranja.
 *
 * POR QUÉ ESTE GUARD COMPILA EN VEZ DE HACER GREP. La primera versión afirmaba
 * sobre el texto de `base.css` con regex, como hacen `whatsapp-green-token` y
 * `f0-foundation`. Esos dos afirman sobre cadenas que un humano tecleó, y ahí el
 * grep es la herramienta correcta. Este afirma sobre un valor que el navegador
 * CALCULA tras resolver `@apply`, la cascada y una animación — y usar la
 * herramienta del vecino después de cambiar de problema dejó SEIS falsos verdes,
 * todos reproducidos mutando el CSS a mano:
 *
 *   1. renombrar la animación a `glow-pulse-v2` y añadir un keyframes rojo con
 *      ese nombre (el guard buscaba el literal `glow-pulse`, sin atarlo al
 *      `animation-name` real);
 *   2. una SEGUNDA regla `.search-button` roja al final del archivo, que es la
 *      que gana la cascada (el guard leía la primera);
 *   3. un selector más específico, `.hero-section .search-button` (el guard
 *      casaba por selector exacto);
 *   4. borrar el `box-shadow` del fallback de reduced-motion (el guard afirmaba
 *      ausencia de rojo, no presencia de halo);
 *   5. poner el halo NARANJA, invisible sobre el hero (mismo motivo);
 *   6. `animation: … 1.5s 3s … 3 forwards`, cuyo delay lo lleva a acabar a los
 *      7.5s (el parser leía el primer token temporal e ignoraba el segundo).
 *
 * Y la raíz de 4 y 5 no era el parser: era enumerar el color PROHIBIDO en vez
 * del permitido. `bg-red-900` (#7f1d1d) es rojo de otra marca y pasa todos los
 * umbrales de contraste — 4.56:1, 3.52:1, texto 10.02:1. Por eso las aserciones
 * de aquí son de IDENTIDAD (el relleno es un token `--color-brand-*`, el halo
 * viste la tinta de la etiqueta) y no listas negras.
 *
 * `tailwindcss.compile()` resuelve `@apply`; `postcss` resuelve la cascada.
 * Hacen falta las dos: el CSS compilado conserva las reglas duplicadas en orden,
 * así que un match sobre el compilado tendría el mismo bug del punto 2.
 *
 * Cubre la capa determinista de SCEN-363-01, 02, 03, 04, 06 y 08 de
 * `docs/specs/issue-363-cta-buscar/scenarios/cta-buscar.scenarios.md`.
 * SCEN-04 y 05 tienen además una capa runtime — que la animación TERMINÓ y qué
 * `box-shadow` dejó fijado `forwards` — que ningún test estático puede afirmar.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import postcss, { type Rule } from 'postcss'
import nested from 'postcss-nested'
import { compile } from 'tailwindcss'

/** Contraste de componentes no textuales, WCAG 1.4.11. */
const MIN_UI_RATIO = 3
/** Texto normal, WCAG 1.4.3 AA. */
const MIN_TEXT_RATIO = 4.5
/** WCAG 2.2.2: parpadeo sin mecanismo de pausa no puede pasar de 5 s. */
const MAX_ANIMATION_SECONDS = 5

/**
 * Los DOS extremos del gradiente del hero. El gradiente es `to-br` y el botón
 * cae del lado de `hero-to`, el más oscuro y el que menos margen deja; medir
 * solo el color de partida daría un falso verde.
 */
const HERO_TOKENS = ['--color-hero-from', '--color-hero-to'] as const

const cssRoot = join(__dirname, '../app/assets/css')
const req = createRequire(import.meta.url)

// Entry reducido a propósito: `@nuxt/ui` no expone un export importable desde
// aquí, así que si alguien hiciera `@apply` de una utilidad suya, compile()
// lanzaría. Falla en rojo, no en verde. Hoy `base.css` solo aplica utilidades
// del core. Los dos candidatos fuerzan a Tailwind a emitir los tokens del hero,
// que si no los tree-shakea por no estar usados.
const compiler = await compile(
  [
    '@import "tailwindcss/theme.css" layer(theme);',
    '@import "tailwindcss/utilities.css" layer(utilities);',
    '@import "./theme.css";',
    '@import "./rentacar-main/base.css";',
  ].join('\n'),
  {
    base: cssRoot,
    loadStylesheet: async (id: string, base: string) => {
      const path = id.startsWith('.') ? resolve(base, id) : req.resolve(id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf-8') }
    },
    loadModule: async () => {
      throw new Error('base.css no debe cargar módulos JS')
    },
  },
)

// postcss-nested aplana el `&:hover` que emite Tailwind, para poder leer el
// hover con el mismo mecanismo que el estado base.
const root = postcss.parse(
  postcss([nested]).process(compiler.build(['bg-hero-from', 'bg-hero-to']), { from: undefined }).css,
)

interface Entry {
  selector: string
  prop: string
  value: string
  at: string
}

const entries: Entry[] = []
root.walkDecls((d) => {
  const rule = d.parent as Rule
  if (rule?.type !== 'rule') return
  let at = ''
  for (let n: unknown = rule.parent; n; n = (n as { parent?: unknown }).parent) {
    const node = n as { type?: string; name?: string; params?: string }
    if (node.type === 'atrule') at = `@${node.name} ${node.params} ${at}`
  }
  entries.push({ selector: rule.selector, prop: d.prop, value: d.value, at })
})

interface WinnerOpts {
  /** Sufijo de selector que debe estar presente (`:hover`, `[aria-disabled…]`). */
  state?: string
  at?: RegExp
}

/**
 * El valor que GANA la cascada: la última declaración de cualquier selector que
 * alcance al CTA, no la primera de una coincidencia exacta. `.at(-1)` mata el
 * falso verde de la regla duplicada; casar por familia en vez de por igualdad
 * mata el del selector más específico.
 *
 * El contexto por defecto es "cualquiera salvo reduced-motion" y no "ninguno":
 * el hover que emite Tailwind vive dentro de `@media (hover: hover)`.
 */
function winner(base: string, prop: string, opts: WinnerOpts = {}): string {
  const { state = '', at = /^(?!.*reduced-motion)/ } = opts
  const family = new RegExp(`\\${base}(?![\\w-])`)
  const hit = entries
    .filter(
      (e) =>
        family.test(e.selector) &&
        e.prop === prop &&
        e.selector.includes(state) &&
        // sin `state` pedido, excluye los selectores que SÍ llevan estado
        (state !== '' || !/:hover|aria-disabled|:disabled/.test(e.selector)) &&
        at.test(e.at),
    )
    .at(-1)
  if (!hit) {
    throw new Error(`el CSS compilado no declara ${prop} para ${base}${state} (contexto ${at})`)
  }
  return hit.value
}

/** Valor final de una custom property, venga del `@theme` o de Tailwind. */
function variable(name: string): string {
  const hit = entries.filter((e) => e.prop === name).at(-1)
  if (!hit) throw new Error(`el CSS compilado no define ${name}`)
  return hit.value
}

/**
 * `#rgb` | `#rrggbb` | `var(--token)` → `#rrggbb`.
 * La normalización de 3 dígitos no es defensiva de más: el `--color-white` de
 * Tailwind es literalmente `#fff`, y `luminance()` lo leería como NaN.
 */
function hex(value: string): string {
  const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (ref) return hex(variable(ref[1]!))
  const raw = value.trim().replace(/^#/, '')
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`no es un color resoluble: "${value}"`)
  return `#${full.toLowerCase()}`
}

/** Luminancia relativa, WCAG 2.x. */
function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** Todos los colores de un `box-shadow`, normalizados a `#rrggbb`. */
function shadowColors(shadow: string): string[] {
  const found = shadow.match(/rgba?\((?:[^()]|\([^()]*\))*\)|#[0-9a-f]{3,8}\b/gi) ?? []
  return found.map((c) => {
    const rgb = c.match(/^rgba?\(((?:[^()]|\([^()]*\))*)\)$/i)
    if (!rgb) return hex(c)
    const channels = rgb[1]!.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, n: string) => variable(n))
    const [r, g, b] = channels.split(/[\s,/]+/).filter(Boolean).map(Number)
    return `#${[r!, g!, b!].map((n) => n.toString(16).padStart(2, '0')).join('')}`
  })
}

const INK = winner('.search-button', 'color')
const FILLS = [
  { estado: 'reposo', color: winner('.search-button', 'background-color') },
  { estado: 'hover', color: winner('.search-button', 'background-color', { state: ':hover' }) },
  {
    estado: 'deshabilitado',
    color: winner('.search-button', 'background-color', { state: '[aria-disabled' }),
  },
] as const

describe('issue #363 — el CTA de búsqueda viste la marca alquicarros', () => {
  it('la fórmula de contraste reproduce las anclas conocidas de WCAG', () => {
    // Un guard que mide mal es peor que no tener guard: sin estas anclas, un
    // error en luminance() haría pasar todo lo demás por razones equivocadas.
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 2)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 2)
  })

  // SCEN-363-01 — identidad, no lista negra: bg-red-900 pasaría todos los
  // umbrales de contraste y sigue siendo el rojo de otra marca.
  describe('el relleno sale de la rampa de marca', () => {
    for (const { estado, color } of FILLS) {
      it(`${estado}: es un token --color-brand-*`, () => {
        expect(
          color,
          `el relleno en ${estado} es "${color}", no un token de la rampa de marca. ` +
            `Un color suelto puede cumplir contraste y seguir siendo de otra marca.`,
        ).toMatch(/^var\(--color-brand-\d+\)$/)
      })
    }
  })

  // SCEN-363-02 — el fallo que la propuesta del issue no vio. El estado
  // deshabilitado entra aquí porque el fallback SSR es el primer paint de todos.
  describe('el relleno se despega del hero en el que está apoyado', () => {
    for (const token of HERO_TOKENS) {
      for (const { estado, color } of FILLS) {
        it(`${estado}: alcanza ${MIN_UI_RATIO}:1 contra ${token}`, () => {
          const fill = hex(color)
          const hero = hex(`var(${token})`)
          const ratio = contrast(fill, hero)

          expect(
            ratio,
            `el relleno en ${estado} (${fill}) contra ${token} (${hero}) da ` +
              `${ratio.toFixed(2)}:1, por debajo del mínimo de ${MIN_UI_RATIO}:1 de WCAG 1.4.11. ` +
              `El botón vive pelado sobre el gradiente del hero, sin tarjeta detrás: si no se ` +
              `despega, desaparece.`,
          ).toBeGreaterThanOrEqual(MIN_UI_RATIO)
        })
      }
    }
  })

  // SCEN-363-03
  describe('la etiqueta se lee sobre el relleno', () => {
    for (const { estado, color } of FILLS) {
      it(`${estado}: alcanza ${MIN_TEXT_RATIO}:1`, () => {
        const ink = hex(INK)
        const fill = hex(color)
        const ratio = contrast(ink, fill)

        expect(
          ratio,
          `el texto (${ink}) sobre el relleno en ${estado} (${fill}) da ${ratio.toFixed(2)}:1, ` +
            `por debajo del mínimo AA de ${MIN_TEXT_RATIO}:1 para texto normal.`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO)
      })
    }
  })

  // SCEN-363-01 + SCEN-363-06.
  // No hay umbral de contraste defendible para el halo: el blanco correcto da
  // 2.20:1 contra hero-from y 2.85:1 contra hero-to, así que exigir 3:1 haría
  // fallar el diseño bueno. La aserción honesta es de identidad — el halo viste
  // la tinta de la etiqueta, el único color que se lee a la vez contra el
  // relleno oscuro y contra el naranja del hero.
  it('el halo viste la tinta de la etiqueta, en la animación y en el fallback', () => {
    const animation = winner('.search-button-glow', 'animation')
    const name = animation.trim().split(/\s+/)[0]!
    const frames = root.nodes.find(
      (n) => n.type === 'atrule' && n.name === 'keyframes' && n.params === name,
    )
    expect(frames, `el CSS no define @keyframes ${name}`).toBeTruthy()

    const shadows: string[] = []
    ;(frames as unknown as Rule).walkDecls('box-shadow', (d) => shadows.push(d.value))
    shadows.push(winner('.search-button-glow', 'box-shadow', { at: /reduced-motion/ }))

    // Presencia, no solo ausencia: borrar el box-shadow dejaba el CTA sin halo
    // y el guard anterior en verde.
    expect(
      shadows.length,
      'faltan declaraciones de box-shadow: los keyframes y el fallback de reduced-motion ' +
        'deben declarar halo, o el CTA se queda sin señal.',
    ).toBeGreaterThan(1)

    for (const shadow of shadows) {
      for (const color of shadowColors(shadow)) {
        expect(
          color,
          `el halo usa ${color}, distinto de la tinta de la etiqueta (${hex(INK)}). ` +
            `Un halo naranja sobre el hero naranja da 1.06:1 y no existe.`,
        ).toBe(hex(INK))
      }
    }
  })

  // SCEN-363-04
  it('el pulso termina por debajo del umbral de 5 s de WCAG 2.2.2', () => {
    const animation = winner('.search-button-glow', 'animation')
    const parts = animation.trim().split(/\s+/)
    // En el shorthand el PRIMER tiempo es la duración y el SEGUNDO el delay:
    // ignorar el segundo dejaba pasar un pulso que acaba a los 7.5 s.
    const times = parts
      .filter((p) => /^-?[\d.]+m?s$/.test(p))
      .map((t) => (t.endsWith('ms') ? Number(t.slice(0, -2)) / 1000 : Number(t.slice(0, -1))))
    const iterations = Number(parts.find((p) => /^[\d.]+$/.test(p)))

    expect(
      animation,
      `la animación es infinita ("${animation}"). WCAG 2.2.2 exige un mecanismo de pausa para ` +
        `contenido que parpadea más de 5 s; acotar las iteraciones es ese mecanismo.`,
    ).not.toMatch(/\binfinite\b/)

    expect(
      animation,
      `la animación no declara \`forwards\` ("${animation}"): al acabar, el halo se corta en ` +
        `seco en vez de quedarse en el keyframe 100%.`,
    ).toMatch(/\bforwards\b/)

    expect(times.length, 'no se pudo leer ninguna duración del shorthand').toBeGreaterThan(0)
    expect(iterations, 'no se pudo leer el número de iteraciones').toBeGreaterThan(0)

    const [duration = 0, delay = 0] = times
    const total = delay + duration * iterations
    expect(
      total,
      `el pulso acaba a los ${total} s (delay ${delay}s + ${duration}s × ${iterations}), ` +
        `por encima del umbral de ${MAX_ANIMATION_SECONDS} s de WCAG 2.2.2.`,
    ).toBeLessThan(MAX_ANIMATION_SECONDS)
  })
})
