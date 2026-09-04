// @vitest-environment happy-dom
/**
 * StarRating — el widget de calificación de /opinion.
 *
 * Codifica la parte de teclado y estado de los escenarios de
 * docs/specs/2026-07-29-alquilame-opinion-design.md:
 *
 *   - SCEN-1: en reposo las cinco estrellas están huecas y ninguna marcada.
 *   - SCEN-3: el clic confirma la calificación (una sola emisión).
 *   - SCEN-7: con el foco dentro, flecha derecha ×2 y Enter deja la 3ª estrella
 *     seleccionada — y las flechas no confirman por el camino: si emitieran,
 *     pasar por la 2ª camino a la 4ª abriría el formulario de queja.
 *
 * El widget es CONTROLADO: `selected` (lo que anuncia `aria-checked`) sólo
 * cambia cuando el padre devuelve el valor por `modelValue`. Por eso los casos
 * que confirman hacen `setProps` — es lo que hace /opinion en su handler.
 *
 * Montaje hermético (sin Nuxt): el SFC usa `ref`/`computed`/`watch` a pelo
 * porque Nuxt los auto-importa; vitest no corre ese escaneo, así que se exponen
 * como globales.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, watch } from 'vue'
import StarRating from '../StarRating.vue'

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
})
afterAll(() => vi.unstubAllGlobals())

// attachTo document: sin nodo en el documento real, `.focus()` no mueve
// document.activeElement y la navegación por flechas no se puede observar.
const factory = (props: { modelValue?: number | null; disabled?: boolean } = {}) =>
  mount(StarRating, {
    props: { modelValue: null, ...props },
    attachTo: document.body,
  })

type Wrapper = ReturnType<typeof factory>

// Con `attachTo`, VTU envuelve el componente en un div propio, así que el
// contenedor se busca por su rol en vez de leer la raíz del wrapper.
const group = (w: Wrapper) => w.find('[role="radiogroup"]')
// El parámetro de tipo es lo que da acceso a `.focus()`: sin él VTU devuelve
// `DOMWrapper<Element>` y `element.focus()` no existe para TypeScript.
const stars = (w: Wrapper) => w.findAll<HTMLButtonElement>('button[role="radio"]')

/** Dispara la tecla sobre la estrella que TIENE el foco, como haría una persona. */
async function press(w: Wrapper, key: string) {
  const focusedStar = stars(w).find((s) => s.element === document.activeElement)
  expect(focusedStar, `ninguna estrella tiene el foco al pulsar ${key}`).toBeDefined()
  await focusedStar!.trigger('keydown', { key })
}

/** El color de relleno de las estrellas activas, tal y como se pinta. */
const FILL = '#d97706'

/** Cuántas estrellas se ven rellenas. */
const filled = (w: Wrapper) => w.findAll('svg').filter((s) => s.attributes('fill') === FILL).length

/** Cuáles se anuncian como marcadas al lector de pantalla. */
const checked = (w: Wrapper) => stars(w).filter((s) => s.attributes('aria-checked') === 'true').length

/** Contraste WCAG entre dos colores hex. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('SCEN-1 — en reposo no hay nada calificado', () => {
  it('pinta cinco estrellas huecas y ninguna marcada', () => {
    const w = factory()
    expect(stars(w)).toHaveLength(5)
    expect(filled(w)).toBe(0)
    expect(stars(w).every((s) => s.attributes('aria-checked') === 'false')).toBe(true)
  })

  it('es un radiogroup con nombre accesible y una estrella por opción', () => {
    const w = factory()
    expect(group(w).exists()).toBe(true)
    expect(group(w).attributes('aria-label')).toBeTruthy()
    expect(stars(w).map((s) => s.attributes('aria-label'))).toEqual([
      '1 estrella',
      '2 estrellas',
      '3 estrellas',
      '4 estrellas',
      '5 estrellas',
    ])
  })

  it('solo una estrella entra en el orden de tabulación', () => {
    const w = factory()
    expect(stars(w).filter((s) => s.attributes('tabindex') === '0')).toHaveLength(1)
  })
})

describe('SCEN-3 — el clic confirma', () => {
  it('emite el valor de la estrella pulsada, una sola vez', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[2]])
  })

  it('rellena hasta la estrella elegida cuando el padre acepta el valor', async () => {
    const w = factory()
    await stars(w)[3]!.trigger('click')
    await w.setProps({ modelValue: 4 })
    expect(filled(w)).toBe(4)
    expect(stars(w)[3]!.attributes('aria-checked')).toBe('true')
  })

  it('si el padre NO acepta el valor, el widget no se marca solo', async () => {
    // /opinion descarta el segundo voto (`if (rating.value !== null) return`).
    // Marcarse igual dejaba 5 estrellas doradas junto a un POST con "2 de 5".
    const w = factory({ modelValue: 2 })
    await stars(w)[4]!.trigger('click')

    expect(stars(w)[4]!.attributes('aria-checked')).toBe('false')
    expect(stars(w)[1]!.attributes('aria-checked')).toBe('true')
    expect(filled(w)).toBe(2)
  })

  it('la calificación confirmada no imprime NADA de texto', () => {
    // Antes se pintaba «Calificaste con N de 5» bajo las estrellas. Se quitó por
    // dos razones observadas en producción: empujaba la página 161 px al tocar
    // la estrella, y «Calificaste» le decía a la persona que ya había terminado
    // cuando todavía le faltaba escribir la reseña en Google.
    //
    // Nada se pierde para quien no ve el ámbar: `aria-checked` es el estado que
    // el lector de pantalla anuncia, y se afirma abajo. Es una afirmación MÁS
    // fuerte que buscar una subcadena en el texto del componente.
    const w = factory({ modelValue: 2 })
    expect(w.text().trim()).toBe('')
  })

  it('el estado confirmado vive en aria-checked, no en el color', () => {
    const w = factory({ modelValue: 2 })
    expect(stars(w).map((s) => s.attributes('aria-checked')))
      .toEqual(['false', 'true', 'false', 'false', 'false'])
    // Y el nombre accesible de cada estrella sigue diciendo cuál es.
    expect(stars(w)[1]!.attributes('aria-label')).toBe('2 estrellas')
  })
})

describe('contraste — las estrellas se tienen que ver', () => {
  it('el contorno de una estrella vacía llega al mínimo 3:1 de WCAG 1.4.11', () => {
    const w = factory()
    const stroke = w.findAll('svg')[0]!.attributes('stroke')!
    expect(contrast(stroke, '#ffffff')).toBeGreaterThanOrEqual(3)
  })

  it('el relleno de una estrella marcada también', () => {
    const w = factory({ modelValue: 5 })
    const svg = w.findAll('svg')[0]!
    expect(svg.attributes('fill')).toBe(FILL)
    expect(contrast(svg.attributes('fill')!, '#ffffff')).toBeGreaterThanOrEqual(3)
  })
})

describe('SCEN-7 — teclado: las flechas mueven, Enter confirma', () => {
  it('flecha derecha ×2 + Enter selecciona la 3ª estrella', async () => {
    const w = factory()
    stars(w)[0]!.element.focus()

    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')

    // Lo que evita la trampa: hasta aquí NADA se ha confirmado, aunque se haya
    // pasado por la 2ª estrella.
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.activeElement).toBe(stars(w)[2]!.element)

    await press(w, 'Enter')
    expect(w.emitted('update:modelValue')).toEqual([[3]])
  })

  it('moverse con las flechas NO anuncia nada como marcado', async () => {
    // Ponía aria-checked en la estrella de destino sin emitir: el lector de
    // pantalla decía "3 estrellas, marcado" y la persona se iba de la página
    // creyendo que había calificado, sin que saliera un solo POST.
    const w = factory()
    stars(w)[0]!.element.focus()
    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')

    expect(checked(w)).toBe(0)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('salir del grupo sin confirmar borra la previsualización', async () => {
    // Sin esto quedaban 5 estrellas doradas indefinidamente sobre un estado
    // vacío: nada devolvía el pintado al valor real al perder el foco.
    const w = factory()
    stars(w)[0]!.element.focus()
    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')
    expect(filled(w)).toBe(3)

    await group(w).trigger('focusout', { relatedTarget: document.body })
    expect(filled(w)).toBe(0)
  })

  it('el espacio confirma igual que Enter', async () => {
    const w = factory()
    stars(w)[0]!.element.focus()
    await press(w, 'ArrowRight')
    await press(w, ' ')
    expect(w.emitted('update:modelValue')).toEqual([[2]])
  })

  it('la flecha izquierda retrocede y no baja de la primera estrella', async () => {
    const w = factory({ modelValue: 3 })
    stars(w)[2]!.element.focus()
    await press(w, 'ArrowLeft')
    await press(w, 'ArrowLeft')
    await press(w, 'ArrowLeft')
    expect(document.activeElement).toBe(stars(w)[0]!.element)
    await press(w, 'Enter')
    expect(w.emitted('update:modelValue')).toEqual([[1]])
  })

  it('la flecha derecha no pasa de la quinta estrella', async () => {
    const w = factory({ modelValue: 5 })
    stars(w)[4]!.element.focus()
    await press(w, 'ArrowRight')
    expect(document.activeElement).toBe(stars(w)[4]!.element)
  })

  it('moverse rellena las estrellas por las que se pasa', async () => {
    const w = factory()
    stars(w)[0]!.element.focus()
    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')
    expect(filled(w)).toBe(3)
  })
})

describe('hover — previsualiza sin confirmar', () => {
  it('rellena hasta la estrella apuntada y vuelve al valor real al salir', async () => {
    const w = factory({ modelValue: 2 })
    expect(filled(w)).toBe(2)

    await stars(w)[4]!.trigger('mouseenter')
    expect(filled(w)).toBe(5)

    await group(w).trigger('mouseleave')
    expect(filled(w)).toBe(2)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('no anuncia como marcada la estrella apuntada', async () => {
    const w = factory({ modelValue: 2 })
    await stars(w)[4]!.trigger('mouseenter')
    expect(stars(w)[4]!.attributes('aria-checked')).toBe('false')
  })
})

describe('disabled — la calificación queda congelada', () => {
  it('no emite al hacer clic', async () => {
    const w = factory({ modelValue: 2, disabled: true })
    await stars(w)[4]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('no reacciona al teclado', async () => {
    const w = factory({ modelValue: 2, disabled: true })
    await stars(w)[1]!.trigger('keydown', { key: 'ArrowRight' })
    await stars(w)[1]!.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(filled(w)).toBe(2)
  })

  it('se congela con aria-disabled, no con disabled: el foco tiene que sobrevivir', () => {
    // Con `disabled` nativo el navegador desenfoca el botón en el mismo tick en
    // que se marca y el foco cae a <body>; el siguiente Tab reinicia desde el
    // principio del documento. happy-dom no emula ese blur, por eso se afirma
    // sobre los atributos que lo provocan.
    const w = factory({ modelValue: 2, disabled: true })
    expect(stars(w).every((s) => s.attributes('aria-disabled') === 'true')).toBe(true)
    expect(stars(w).every((s) => s.attributes('disabled') === undefined)).toBe(true)
    expect(stars(w).filter((s) => s.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('el hover tampoco previsualiza', async () => {
    const w = factory({ modelValue: 2, disabled: true })
    await stars(w)[4]!.trigger('mouseenter')
    expect(filled(w)).toBe(2)
  })

  it('un hover anterior al bloqueo no se queda pegado', async () => {
    // Puntero apoyado en la 5ª y confirmación por teclado en la 1ª: quedaban 5
    // doradas junto al formulario de queja, y ya bloqueadas.
    const w = factory({ modelValue: null })
    await stars(w)[4]!.trigger('mouseenter')
    expect(filled(w)).toBe(5)

    await w.setProps({ modelValue: 1, disabled: true })
    expect(filled(w)).toBe(1)
  })
})
