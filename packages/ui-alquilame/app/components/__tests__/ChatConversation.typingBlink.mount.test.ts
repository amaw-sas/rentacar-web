// @vitest-environment jsdom
//
// SCEN-T1..T7 (docs/specs/2026-09-20-chat-typing-blink): while the bot answers, the
// "escribiendo…" row breathes — visible 2-3 s, hidden 0,25-0,5 s, a fresh draw every
// cycle, y el cambio es un CORTE, no un desvanecido (chat-typing-blink-timings-v2
// manda sobre los tiempos y el fundido de T1/T2). A REAL conversation instance streams from a stubbed fetch whose body stays
// open until the test releases it, so the component is observed mid-stream, with fake
// timers driving the rhythm. The real blink on a phone is runtime QA.
//
// Two timers coexist mid-stream: the composable's 30 s inactivity watchdog and the
// blink. Delay assertions filter to the blink's range; counts are documented inline.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  createChatConversation,
  type ChatConversation as ChatInstance,
} from '@rentacar-main/logic/composables/useChatConversation'
import ChatConversation from '../ChatConversation.vue'

const source = readFileSync(join(__dirname, '..', 'ChatConversation.vue'), 'utf8')

const sse = (events: unknown[]) =>
  new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join(''))

// Every turn streams one delta and then hangs until the test releases THAT turn.
// Text only reaches the bubble when the turn flushes, so the placeholder stays
// empty mid-stream — which is exactly when the typing row renders.
function heldFetch() {
  const releases: Array<() => void> = []
  let calls = 0
  const fn = vi.fn((_url: string, init: { signal?: AbortSignal }) => {
    const n = calls++
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    releases.push(release)
    const chunks: Array<() => Promise<{ done: boolean; value?: Uint8Array }>> = [
      () => Promise.resolve({ done: false, value: sse([{ type: 'text-start', id: `t${n}` }, { type: 'text-delta', id: `t${n}`, delta: 'Te cuento' }]) }),
      // Cortar la conversación aborta el turno: el cuerpo rechaza como un fetch real.
      () => Promise.race([
        gate.then(() => ({ done: false, value: sse([{ type: 'text-delta', id: `t${n}`, delta: ' todo.' }, { type: 'text-end', id: `t${n}` }]) })),
        new Promise<never>((_r, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
      ]),
      () => Promise.resolve({ done: true }),
    ]
    return Promise.resolve({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => ({ read: () => (chunks.shift() ?? (() => Promise.resolve({ done: true })))() }) },
    })
  })
  return { fn, release: (i = 0) => releases[i]!(), calls: () => calls }
}

let brandSeq = 0
function newInstance(): ChatInstance {
  const brand = `tb-ui-${brandSeq++}`
  return createChatConversation({
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  })
}

let wrapper: VueWrapper | null = null
let consoleError: ReturnType<typeof vi.spyOn>
let setTimeoutSpy: ReturnType<typeof vi.spyOn>
let clearTimeoutSpy: ReturnType<typeof vi.spyOn>

// Fake timers never resolve promises: the stream is advanced by draining microtasks.
const flush = async (times = 30) => { for (let i = 0; i < times; i++) await Promise.resolve() }

// Los temporizadores del parpadeo: los únicos setTimeout en [250, 3000] ms. Deja
// fuera el vigía de 30 s del composable y los de 0 ms que mete el entorno (jsdom +
// fake timers), que son los que hacen inútil un conteo absoluto de pendientes.
type BlinkCall = { delay: number; id: unknown }
const spyCalls = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.calls as unknown as unknown[][]
const spyResults = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.results as unknown as Array<{ value: unknown }>
const blinkCalls = (): BlinkCall[] =>
  spyCalls(setTimeoutSpy)
    .map((c, i) => ({ delay: c[1] as number, id: spyResults(setTimeoutSpy)[i]!.value }))
    .filter((x) => typeof x.delay === 'number' && x.delay >= 250 && x.delay <= 3000)
const blinkDelays = (): number[] => blinkCalls().map((x) => x.delay)

// "No queda ningún temporizador del parpadeo": el último agendado fue devuelto a
// clearTimeout, y avanzar medio minuto más no agenda ninguno nuevo.
// `ignore`: ids de otros temporizadores que caen en el mismo rango y no son del
// parpadeo (el sostenido del borrado oculto dura 2000 ms exactos).
function expectBlinkStopped(ignore: unknown[] = []) {
  const own = () => blinkCalls().filter((c) => !ignore.includes(c.id))
  const calls = own()
  expect(calls.length, 'nunca se agendó un parpadeo: la prueba no probó nada').toBeGreaterThan(0)
  expect(spyCalls(clearTimeoutSpy).map((c) => c[0]), 'el último parpadeo agendado nunca se canceló').toContain(calls.at(-1)!.id)
  const before = calls.length
  vi.advanceTimersByTime(30_000)
  expect(own().length, 'el ritmo siguió agendando después de parar').toBe(before)
}

function reducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  reducedMotion(false)
  setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
  clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (typeof globalThis.CSS === 'undefined') vi.stubGlobal('CSS', { escape: (s: string) => s })
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  // restoreAllMocks ANTES de useRealTimers: al revés, el espía de setTimeout
  // devolvería el temporizador falso al global y lo dejaría vivo entre archivos.
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Mounts over a real instance and leaves turn #1 streaming with an empty placeholder.
async function streaming() {
  const held = heldFetch()
  vi.stubGlobal('fetch', held.fn)
  const instance = newInstance()
  vi.stubGlobal('useChatConversation', () => instance)
  wrapper = mount(ChatConversation, { props: { variant: 'page', active: true }, attachTo: document.body })
  instance.input.value = 'hola'
  const turn = instance.submit()
  await flush()
  await wrapper.vm.$nextTick()
  expect(instance.isStreaming.value).toBe(true)
  expect(wrapper.find('.cc-typing-text').exists()).toBe(true)
  return { w: wrapper, instance, held, turn }
}

const typingEl = (w: VueWrapper) => w.find('.cc-typing-text')
const isHidden = (w: VueWrapper) => {
  const el = typingEl(w)
  return el.exists() && el.classes().includes('is-blink-off')
}

// Walks the clock in small steps and records the hidden/visible state at each one.
async function sample(w: VueWrapper, ms: number, step = 50) {
  const seen: boolean[] = []
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step)
    await w.vm.$nextTick()
    seen.push(isHidden(w))
  }
  return seen
}

const transitions = (seen: boolean[]) => seen.filter((v, i) => i > 0 && v !== seen[i - 1]).length

describe('SCEN-T1 — el renglón se apaga y vuelve mientras la respuesta sigue llegando', () => {
  it('se oculta dentro de los primeros 3,1 s y reaparece en los 0,6 s siguientes', async () => {
    const { w } = await streaming()
    expect(isHidden(w)).toBe(false)

    const first = await sample(w, 3100)
    expect(first, 'el renglón nunca se ocultó en los primeros 3,1 s').toContain(true)

    const second = await sample(w, 600)
    expect(second, 'el renglón no volvió a verse en los 0,6 s siguientes').toContain(false)

    // El ciclo se repite mientras dure el stream: varios cambios más en 12 s.
    expect(transitions(await sample(w, 12_000))).toBeGreaterThanOrEqual(3)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-T2/T7 — ningún ciclo dura lo mismo que el anterior, y son cortos', () => {
  it('cada tramo visible cae en [2000, 3000] ms, cada tramo oculto en [250, 500] ms, y los visibles no son todos iguales', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)     // visible 2000
      .mockReturnValueOnce(0.5)   // oculto   375
      .mockReturnValueOnce(0.25)  // visible 2250
      .mockReturnValueOnce(0.9)   // oculto   475
      .mockReturnValueOnce(0.75)  // visible 2750
      .mockReturnValueOnce(0.1)   // oculto   275
      .mockReturnValue(0.5)

    const { w } = await streaming()
    await sample(w, 12_000)

    const delays = blinkDelays()
    expect(delays.length).toBeGreaterThanOrEqual(6)
    const visible = delays.filter((_, i) => i % 2 === 0)
    const hiddenSpans = delays.filter((_, i) => i % 2 === 1)

    expect(visible.slice(0, 3)).toEqual([2000, 2250, 2750])
    expect(hiddenSpans.slice(0, 3)).toEqual([375, 475, 275])
    for (const d of visible) {
      expect(d).toBeGreaterThanOrEqual(2000)
      expect(d).toBeLessThanOrEqual(3000)
    }
    for (const d of hiddenSpans) {
      expect(d).toBeGreaterThanOrEqual(250)
      expect(d).toBeLessThanOrEqual(500)
    }
    expect(new Set(visible.slice(0, 3)).size).toBe(3)
  })

  it('sin trucar el azar, los tramos siguen dentro de rango', async () => {
    const { w } = await streaming()
    await sample(w, 20_000)
    const delays = blinkDelays()
    expect(delays.length).toBeGreaterThanOrEqual(6)
    for (const d of delays.filter((_, i) => i % 2 === 0)) {
      expect(d).toBeGreaterThanOrEqual(2000)
      expect(d).toBeLessThanOrEqual(3000)
    }
    for (const d of delays.filter((_, i) => i % 2 === 1)) {
      expect(d).toBeGreaterThanOrEqual(250)
      expect(d).toBeLessThanOrEqual(500)
    }
  })
})

describe('SCEN-T3 — ocultar es solo visual: el lector de pantalla oye "escribiendo" una vez', () => {
  it('el mismo nodo de texto sobrevive dos ciclos completos sin cambiar de contenido', async () => {
    const { w } = await streaming()
    const node = typingEl(w).element
    expect(node.textContent).toBe('escribiendo…')

    const seen = await sample(w, 12_000)
    expect(transitions(seen)).toBeGreaterThanOrEqual(4) // ≥ 2 ciclos completos

    expect(typingEl(w).exists()).toBe(true)
    expect(typingEl(w).element).toBe(node)
    expect(node.isConnected).toBe(true)
    expect(node.textContent).toBe('escribiendo…')
  })

  it('la región aria-live del renglón se declara una sola vez y el ocultado es CSS', () => {
    const row = source.match(/<span class="cc-typing-text"[\s\S]*?<\/span>/)?.[0]
    expect(row, 'no se encontró el renglón "escribiendo…"').toBeTruthy()
    expect(row!).toContain('aria-live="polite"')
    expect(row!.match(/aria-live/g)).toHaveLength(1)
    expect(source.match(/class="cc-typing-text"/g)).toHaveLength(1)
    // La clase que oculta solo apaga el pixel: nada de v-if ni display:none (que
    // sacarían el nodo del árbol accesible y re-anunciarían en cada ciclo).
    const rules = [...source.matchAll(/\.cc-typing-text\.is-blink-off\s*\{[^}]*\}/g)].map((m) => m[0])
    expect(rules.length, 'falta la regla CSS .cc-typing-text.is-blink-off').toBeGreaterThan(0)
    expect(rules.some((r) => /opacity:\s*0\s*;/.test(r)), 'la clase no apaga por opacidad').toBe(true)
    for (const r of rules) {
      expect(r).not.toMatch(/display:\s*none/)
      expect(r).not.toMatch(/visibility:\s*hidden/)
    }
  })
})

describe('SCEN-T6 — el renglón corta, no se desvanece', () => {
  // El SFC lleva sus estilos en <style scoped> y vitest no los inyecta (css no está
  // activado): se meten a mano en el documento para poder leer el estilo COMPUTADO
  // del nodo montado. Ojo: jsdom no expande el atajo a longhands — `transitionDuration`
  // devuelve "0s" aunque haya fundido declarado, así que leerlo sería un verde falso.
  // La afirmación va sobre `transition`, que sí refleja lo declarado.
  function injectSfcStyles() {
    const css = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    expect(css).toContain('.cc-typing-text')
    const tag = document.createElement('style')
    tag.textContent = css
    document.head.appendChild(tag)
    return () => tag.remove()
  }

  it('el nodo montado no declara transición, ni visible ni oculto', async () => {
    const drop = injectSfcStyles()
    try {
      const { w } = await streaming()
      const node = typingEl(w).element

      expect(getComputedStyle(node).fontStyle, 'los estilos del SFC no llegaron al documento').toBe('italic')
      expect(getComputedStyle(node).transition, 'el renglón todavía se desvanece').toBe('')

      const seen = await sample(w, 4000)
      expect(seen, 'no llegó a ocultarse: no se comprobó el corte de vuelta').toContain(true)
      expect(getComputedStyle(node).transition).toBe('')
    } finally {
      drop()
    }
  })

  it('ninguna regla del renglón declara transición', () => {
    const rules = [...source.matchAll(/\.cc-typing-text[^{]*\{[^}]*\}/g)].map((m) => m[0])
    expect(rules.length).toBeGreaterThan(0)
    for (const r of rules) expect(r, r).not.toMatch(/transition/)
  })
})

describe('SCEN-T4 — quien pidió menos movimiento lo conserva quieto', () => {
  it('con prefers-reduced-motion: reduce el renglón no parpadea ni agenda temporizador', async () => {
    reducedMotion(true)
    const { w } = await streaming()

    const seen = await sample(w, 10_000, 100)
    expect(seen.every((h) => h === false)).toBe(true)
    expect(blinkDelays()).toEqual([])
    expect(typingEl(w).exists()).toBe(true)
    expect(consoleError).not.toHaveBeenCalled()

    // Control en el mismo archivo: sin la preferencia, el MISMO montaje sí parpadea.
    // Sin esto, la quietud de arriba también se cumpliría si el parpadeo no existiera.
    w.unmount()
    wrapper = null
    reducedMotion(false)
    const control = await streaming()
    expect(await sample(control.w, 6000)).toContain(true)
    expect(blinkDelays().length).toBeGreaterThan(0)
  })

  it('sin matchMedia (SSR / jsdom pelado) no revienta y sigue respirando', async () => {
    vi.stubGlobal('matchMedia', undefined)
    const { w } = await streaming()
    expect(await sample(w, 6000)).toContain(true)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-T5 — el ritmo se apaga con la respuesta y no deja temporizadores', () => {
  it('al terminar el stream no queda nada pendiente y el turno siguiente arranca visible', async () => {
    const { w, instance, held, turn } = await streaming()
    await sample(w, 3000) // deja el ciclo a medias

    held.release(0)
    await turn
    await flush()
    await w.vm.$nextTick()

    expect(instance.isStreaming.value).toBe(false)
    expect(typingEl(w).exists()).toBe(false)
    expectBlinkStopped()

    instance.input.value = 'otra'
    const second = instance.submit()
    await flush()
    await w.vm.$nextTick()
    expect(typingEl(w).exists()).toBe(true)
    expect(isHidden(w), 'el turno nuevo arrancó con el renglón apagado').toBe(false)

    held.release(1)
    await second
    await flush()
    expectBlinkStopped()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('al desmontar a mitad de ciclo se cancela el parpadeo', async () => {
    const { w } = await streaming()
    await sample(w, 3000)

    w.unmount()
    wrapper = null
    expectBlinkStopped()
  })

  it('el borrado oculto corta el stream y se lleva el parpadeo', async () => {
    const { w, instance, turn } = await streaming()
    await sample(w, 3000)

    const hit = w.find('.cc-titlewrap .cc-clear-hit')
    const holdMark = spyCalls(setTimeoutSpy).length
    hit.element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 20, clientY: 20, pointerId: 1, button: 0 }))
    // El sostenido (2000 ms) es el primer temporizador agendado tras el pointerdown.
    const holdId = spyResults(setTimeoutSpy)[holdMark]!.value
    vi.advanceTimersByTime(2000)
    await turn.catch(() => {})
    await flush()
    await w.vm.$nextTick()

    expect(instance.messages.value).toEqual([])
    expect(instance.isStreaming.value).toBe(false)
    expect(typingEl(w).exists()).toBe(false)
    expectBlinkStopped([holdId])
  })
})
